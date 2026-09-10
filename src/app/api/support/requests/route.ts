import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { validateConsent } from "@/lib/legal-db";
import { getSupportAccess, SUPPORT_COOKIE, supportTokenHash } from "@/lib/support-access";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSupportRequest, listSupportRequests } from "@/lib/support-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topic") ?? "all";
  const access = await getSupportAccess();
  if (!access.manager && !access.customerId && !access.guestTokenHash) return NextResponse.json({ requests: [] });
  const requests = await listSupportRequests(access.manager ? {} : { OR: [...(access.customerId ? [{ customerId: access.customerId }] : []), ...(access.guestTokenHash ? [{ guestTokenHash: access.guestTokenHash }] : [])] });

  return NextResponse.json({
    requests: topicId === "all" ? requests : requests.filter((item) => item.topicId === topicId),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    consent?: unknown;
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

  let proof;
  try { proof = await validateConsent(body.consent, "support"); } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Подтвердите согласие." }, { status: 400 }); }
  const existingToken = (await cookies()).get(SUPPORT_COOKIE)?.value || "";
  const guestToken = /^[a-f0-9]{64}$/.test(existingToken) ? existingToken : randomBytes(32).toString("hex");
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
    source: customer ? "Личный кабинет" : "Сайт",
    guestTokenHash: customer ? "" : supportTokenHash(guestToken),
    consent: proof,
  });

  const response = NextResponse.json({ request: supportRequest }, { status: 201 });
  if (!customer) response.cookies.set(SUPPORT_COOKIE, guestToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
