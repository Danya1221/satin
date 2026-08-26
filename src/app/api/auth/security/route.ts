import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  createAuthSessionToken,
  getAuthCookieOptions,
  getAuthSession,
  hashPassword,
  normalizeText,
  verifyPassword,
} from "@/lib/auth";
import { normalizeEmailStrict, normalizeRuPhone } from "@/lib/contact-validation";
import { prisma } from "@/lib/db";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();

  if (!session || session.role !== "customer" || !session.customerId) {
    return jsonError("Нужно войти в личный кабинет.", 401);
  }

  const body = (await request.json().catch(() => null)) as
    | {
        currentPassword?: unknown;
        phone?: unknown;
        email?: unknown;
        newPassword?: unknown;
      }
    | null;

  const currentPassword = normalizeText(body?.currentPassword);
  const rawPhone = normalizeText(body?.phone);
  const rawEmail = normalizeText(body?.email);
  const newPassword = normalizeText(body?.newPassword);

  if (!currentPassword) {
    return jsonError("Введите текущий пароль.");
  }

  const phone = normalizeRuPhone(rawPhone);
  const email = rawEmail ? normalizeEmailStrict(rawEmail) : "";

  if (!phone) {
    return jsonError("Укажите корректный российский номер телефона.");
  }

  if (rawEmail && !email) {
    return jsonError("Укажите корректный e-mail.");
  }

  if (newPassword && newPassword.length < 6) {
    return jsonError("Новый пароль должен быть не короче 6 символов.");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: {
      id: true,
      name: true,
      lastName: true,
      phone: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!customer || !verifyPassword(currentPassword, customer.passwordHash)) {
    return jsonError("Текущий пароль указан неверно.", 401);
  }

  const duplicate = await prisma.customer.findFirst({
    where: {
      id: { not: customer.id },
      OR: [{ phone }, ...(email ? [{ email }] : [])],
    },
    select: { id: true },
  });

  if (duplicate) {
    return jsonError("Такой телефон или e-mail уже используется другим аккаунтом.", 409);
  }

  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: {
      phone,
      email,
      ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
    },
    select: {
      id: true,
      name: true,
      lastName: true,
      phone: true,
      email: true,
    },
  });

  const token = createAuthSessionToken({
    role: "customer",
    customerId: updated.id,
    name: updated.name,
    lastName: updated.lastName,
    phone: updated.phone,
    email: updated.email,
    createdAt: new Date().toISOString(),
  });

  const response = NextResponse.json({
    ok: true,
    message: newPassword
      ? "Данные для входа и пароль обновлены."
      : "Данные для входа обновлены.",
    profile: updated,
  });

  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  return response;
}
