import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function generateSupportPublicId() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const publicId = `SUP-${Date.now().toString().slice(-6)}${attempt || ""}`;
    const exists = await prisma.supportRequest.findUnique({ where: { publicId }, select: { id: true } });
    if (!exists) return publicId;
  }
  return `SUP-${Date.now()}`;
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Нет доступа." }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    include: {
      supportRequests: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });
  if (!order) return NextResponse.json({ ok: false, error: "Заявка не найдена." }, { status: 404 });

  const existing = order.supportRequests[0];
  if (existing) {
    return NextResponse.json({ ok: true, href: `/nz-console/support/${existing.publicId}` });
  }

  const adminName = session.name || session.login || "Менеджер Neontech";
  const text = `Здравствуйте! Пишем по вашей заявке ${order.publicId}.`;
  const ticket = await prisma.supportRequest.create({
    data: {
      publicId: await generateSupportPublicId(),
      customerId: order.customerId,
      orderId: order.id,
      topic: "order",
      clientName: order.customerName,
      phone: order.phone,
      email: order.email,
      message: text,
      status: "in_work",
      source: "Админка",
      manager: adminName,
      messages: {
        create: { role: "MANAGER", name: adminName, text },
      },
    },
  });

  await prisma.orderChange.create({
    data: {
      orderId: order.id,
      adminName,
      action: "Создан чат с клиентом",
      details: `Обращение ${ticket.publicId}`,
    },
  });

  return NextResponse.json({ ok: true, href: `/nz-console/support/${ticket.publicId}` }, { status: 201 });
}
