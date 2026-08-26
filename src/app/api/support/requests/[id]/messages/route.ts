import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addSupportMessage, type SupportMessageRole } from "@/lib/support-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    text?: string;
    role?: SupportMessageRole;
    name?: string;
  } | null;

  if (!body?.text?.trim()) {
    return NextResponse.json({ error: "Сообщение пустое." }, { status: 400 });
  }

  const role: SupportMessageRole = body.role === "MANAGER" ? "MANAGER" : "CLIENT";
  let senderName = body.name;

  if (role === "CLIENT") {
    const session = await getAuthSession();
    const customer =
      session?.role === "customer" && session.customerId
        ? await prisma.customer.findUnique({
            where: { id: session.customerId },
            select: { name: true, lastName: true },
          })
        : null;

    if (customer) {
      senderName = [customer.name, customer.lastName].filter(Boolean).join(" ").trim();
    }
  }

  const supportRequest = await addSupportMessage(id, {
    text: body.text,
    role,
    name: senderName,
  });

  if (!supportRequest) {
    return NextResponse.json({ error: "Обращение не найдено." }, { status: 404 });
  }

  return NextResponse.json({ request: supportRequest }, { status: 201 });
}
