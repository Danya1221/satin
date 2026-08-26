import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSupportRequest, listSupportRequests } from "@/lib/support-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topic") ?? "all";
  const requests = await listSupportRequests();

  return NextResponse.json({
    requests: topicId === "all" ? requests : requests.filter((item) => item.topicId === topicId),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    topicId?: string;
    message?: string;
    customerName?: string;
    phone?: string;
    email?: string;
    source?: "Сайт" | "Личный кабинет" | "Админка" | "Telegram";
  } | null;

  if (!body?.topicId || !body?.message?.trim()) {
    return NextResponse.json(
      { error: "Нужны тема и сообщение обращения." },
      { status: 400 },
    );
  }

  const session = await getAuthSession();
  const customer =
    session?.role === "customer" && session.customerId
      ? await prisma.customer.findUnique({
          where: { id: session.customerId },
          select: { id: true, name: true, lastName: true, phone: true, email: true },
        })
      : null;
  const customerName = customer
    ? [customer.name, customer.lastName].filter(Boolean).join(" ").trim()
    : body.customerName;

  const supportRequest = await createSupportRequest({
    topicId: body.topicId,
    message: body.message,
    customerId: customer?.id,
    customerName,
    phone: customer?.phone || body.phone,
    email: customer?.email || body.email,
    source: customer ? "Личный кабинет" : body.source,
  });

  return NextResponse.json({ request: supportRequest }, { status: 201 });
}
