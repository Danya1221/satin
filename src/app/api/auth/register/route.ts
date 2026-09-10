import { validateConsent } from "@/lib/legal-db";
import { getAuthSecret } from "@/lib/auth-config";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createAuthSessionToken,
  getAuthCookieOptions,
  hashPassword,
  normalizeEmail,
  normalizeText,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeEmailStrict, normalizeRuPhone } from "@/lib/contact-validation";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        consent?: unknown;
        firstName?: unknown;
        lastName?: unknown;
        phone?: unknown;
        email?: unknown;
        password?: unknown;
      }
    | null;

  const firstName = normalizeText(body?.firstName);
  const lastName = normalizeText(body?.lastName);
  const phone = normalizeRuPhone(body?.phone);
  const rawEmail = normalizeText(body?.email);
  const email = rawEmail ? normalizeEmailStrict(rawEmail) : "";
  const password = normalizeText(body?.password);

  if (!firstName || !lastName || !phone || !password) {
    return jsonError("Для регистрации нужны имя, фамилия, телефон РФ и пароль.");
  }

  if (rawEmail && !email) {
    return jsonError("Укажите корректный e-mail.");
  }

  if (password.length < 6) {
    return jsonError("Пароль должен быть не короче 6 символов.");
  }

  let proof;
  try { getAuthSecret(); proof = await validateConsent(body?.consent, "account"); } catch (e) { return jsonError(e instanceof Error ? e.message : "Не удалось проверить согласие.", 400); }
  const passwordHash = hashPassword(password);
  let customer;
  try {
    customer = await prisma.$transaction(async tx => {
      const existing = await tx.customer.findFirst({ where: { passwordHash: { not: "" }, OR: [{ phone }, ...(email ? [{ email }] : [])] } });
      if (existing) throw new Error("ACCOUNT_EXISTS");
      const created = await tx.customer.create({ data: { name: firstName, lastName, phone, email, passwordHash }, select: { id: true, name: true, lastName: true, phone: true, email: true } });
      await tx.consentReceipt.create({ data: { ...proof, subjectId: created.id } });
      return created;
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    return jsonError(error instanceof Error && error.message === "ACCOUNT_EXISTS" ? "Клиент с таким телефоном или e-mail уже зарегистрирован." : "Не удалось зарегистрироваться. Попробуйте ещё раз.", error instanceof Error && error.message === "ACCOUNT_EXISTS" ? 409 : 503);
  }

  const token = createAuthSessionToken({
    role: "customer",
    customerId: customer.id,
    name: customer.name,
    lastName: customer.lastName,
    phone: customer.phone,
    email: customer.email,
    createdAt: new Date().toISOString(),
  });
  const response = NextResponse.json({
    ok: true,
    user: {
      role: "customer",
      profile: {
        id: customer.id,
        name: customer.name,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email,
      },
    },
    redirectTo: "/profile",
  });

  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  return response;
}
