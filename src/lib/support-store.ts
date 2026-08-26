import "server-only";

import { prisma } from "@/lib/db";
import { getSupportTopic, supportTopics } from "@/lib/support-topics";

export type SupportStatus = "NEW" | "IN_PROGRESS" | "WAITING_CLIENT" | "CLOSED";
export type SupportMessageRole = "CLIENT" | "MANAGER";

export type SupportMessage = {
  id: string;
  role: SupportMessageRole;
  name: string;
  text: string;
  createdAt: string;
};

export type SupportRequest = {
  id: string;
  number: string;
  topicId: string;
  topicTitle: string;
  customerName: string;
  phone: string;
  email: string;
  source: "Сайт" | "Личный кабинет" | "Админка" | "Telegram";
  status: SupportStatus;
  assignedTo: string;
  lastMessage: string;
  unreadForManager: number;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
  orderId?: string;
  orderPublicId?: string;
};

const statusToDb: Record<SupportStatus, "new" | "in_work" | "waiting_client" | "closed"> = {
  NEW: "new",
  IN_PROGRESS: "in_work",
  WAITING_CLIENT: "waiting_client",
  CLOSED: "closed",
};

const statusFromDb: Record<string, SupportStatus> = {
  new: "NEW",
  in_work: "IN_PROGRESS",
  waiting_client: "WAITING_CLIENT",
  closed: "CLOSED",
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSupportTopicId(topicId: string) {
  if (topicId === "payment") {
    return "other";
  }

  const normalized = normalizeText(topicId);
  const byId = supportTopics.find((topic) => topic.id === normalized);

  if (byId) {
    return byId.id;
  }

  const byTitle = supportTopics.find(
    (topic) => topic.title === normalized || topic.shortTitle === normalized,
  );

  return byTitle?.id ?? getSupportTopic(normalized).id;
}

function getSource(value: string): SupportRequest["source"] {
  if (value === "Личный кабинет" || value === "Админка" || value === "Telegram") {
    return value;
  }

  return "Сайт";
}

async function generateSupportPublicId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicId = `SUP-${Date.now().toString().slice(-6)}${attempt ? attempt : ""}`;
    const existing = await prisma.supportRequest.findUnique({ where: { publicId } });

    if (!existing) {
      return publicId;
    }
  }

  return `SUP-${Date.now()}`;
}

type DbSupportRequest = Awaited<ReturnType<typeof prisma.supportRequest.findFirst>> & {
  order?: { id: string; publicId: string } | null;
  messages?: Array<{
    id: string;
    role: string;
    name: string;
    text: string;
    createdAt: Date;
  }>;
};

function mapSupportRequest(request: NonNullable<DbSupportRequest>): SupportRequest {
  const topicId = normalizeSupportTopicId(request.topic);
  const topic = getSupportTopic(topicId);
  const messages: SupportMessage[] = (request.messages ?? []).map((message) => ({
    id: message.id,
    role: message.role === "MANAGER" ? "MANAGER" : "CLIENT",
    name: message.name,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  }));
  const fallbackMessage: SupportMessage = {
    id: `${request.id}-initial`,
    role: "CLIENT",
    name: request.clientName || "Клиент",
    text: request.message,
    createdAt: request.createdAt.toISOString(),
  };
  const normalizedMessages = messages.length > 0 ? messages : [fallbackMessage];
  const lastMessage = normalizedMessages[normalizedMessages.length - 1];

  return {
    id: request.id,
    number: request.publicId,
    topicId: topic.id,
    topicTitle: topic.title,
    customerName: request.clientName,
    phone: request.phone,
    email: request.email,
    source: getSource(request.source),
    status: statusFromDb[request.status] ?? "NEW",
    assignedTo: request.manager || "Не назначен",
    lastMessage: lastMessage?.text || request.message,
    unreadForManager: lastMessage?.role === "CLIENT" && request.status !== "closed" ? 1 : 0,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    messages: normalizedMessages,
    orderId: request.order?.id,
    orderPublicId: request.order?.publicId,
  };
}

export function formatSupportDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getSupportStatusLabel(status: SupportStatus) {
  const labels: Record<SupportStatus, string> = {
    NEW: "Новое",
    IN_PROGRESS: "В работе",
    WAITING_CLIENT: "Ожидает клиента",
    CLOSED: "Закрыто",
  };

  return labels[status] ?? status;
}

export async function listSupportRequests() {
  const requests = await prisma.supportRequest.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      order: { select: { id: true, publicId: true } },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return requests.map(mapSupportRequest);
}

export async function listSupportTopicsWithCounts() {
  const requests = await listSupportRequests();

  return [
    {
      id: "all",
      title: "Все",
      count: requests.length,
      unread: requests.reduce((sum, request) => sum + request.unreadForManager, 0),
    },
    ...supportTopics.map((topic) => {
      const topicRequests = requests.filter((request) => request.topicId === topic.id);
      return {
        id: topic.id,
        title: topic.shortTitle,
        count: topicRequests.length,
        unread: topicRequests.reduce((sum, request) => sum + request.unreadForManager, 0),
      };
    }),
  ];
}

export async function getSupportRequest(idOrNumber: string) {
  const request = await prisma.supportRequest.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { publicId: idOrNumber }],
    },
    include: {
      order: { select: { id: true, publicId: true } },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return request ? mapSupportRequest(request) : null;
}

export async function createSupportRequest(input: {
  topicId: string;
  message: string;
  customerId?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  source?: SupportRequest["source"];
}) {
  const topic = getSupportTopic(normalizeSupportTopicId(input.topicId));
  const message = normalizeText(input.message);
  const phone = normalizeText(input.phone);
  const email = normalizeText(input.email);
  const customerName = normalizeText(input.customerName) || "Гость Neontech";

  let customerId = normalizeText(input.customerId) || undefined;

  if (!customerId && phone) {
    const customer = await prisma.customer.findFirst({ where: { phone } });
    const savedCustomer = customer
      ? await prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: customerName,
            email,
          },
        })
      : await prisma.customer.create({
          data: {
            name: customerName,
            phone,
            email,
          },
        });

    customerId = savedCustomer.id;
  }

  const createdAt = nowIso();
  const request = await prisma.supportRequest.create({
    data: {
      publicId: await generateSupportPublicId(),
      customerId,
      topic: topic.id,
      clientName: customerName,
      phone: phone || "Не указан",
      email,
      message,
      status: "new",
      source: input.source ?? "Сайт",
      manager: "",
      createdAt,
      updatedAt: createdAt,
      messages: {
        create: {
          role: "CLIENT",
          name: customerName || "Клиент",
          text: message,
          createdAt,
        },
      },
    },
    include: {
      order: { select: { id: true, publicId: true } },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return mapSupportRequest(request);
}

export async function addSupportMessage(
  idOrNumber: string,
  input: {
    text: string;
    role: SupportMessageRole;
    name?: string;
  },
) {
  const request = await prisma.supportRequest.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { publicId: idOrNumber }],
    },
  });

  if (!request) {
    return null;
  }

  const role: SupportMessageRole = input.role === "MANAGER" ? "MANAGER" : "CLIENT";
  const text = normalizeText(input.text);
  const name = normalizeText(input.name) || (role === "MANAGER" ? "Менеджер Neontech" : "Клиент");

  await prisma.supportMessage.create({
    data: {
      requestId: request.id,
      role,
      name,
      text,
    },
  });

  await prisma.supportRequest.update({
    where: { id: request.id },
    data: {
      message: text,
      status: role === "MANAGER" && request.status === "new" ? "in_work" : request.status,
      manager: role === "MANAGER" ? name : request.manager,
    },
  });

  return getSupportRequest(request.id);
}

export async function updateSupportRequest(
  idOrNumber: string,
  input: Partial<Pick<SupportRequest, "status" | "assignedTo" | "topicId">>,
) {
  const request = await prisma.supportRequest.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { publicId: idOrNumber }],
    },
  });

  if (!request) {
    return null;
  }

  await prisma.supportRequest.update({
    where: { id: request.id },
    data: {
      ...(input.status ? { status: statusToDb[input.status] } : {}),
      ...(input.assignedTo ? { manager: input.assignedTo.trim() } : {}),
      ...(input.topicId ? { topic: normalizeSupportTopicId(input.topicId) } : {}),
    },
  });

  return getSupportRequest(request.id);
}
