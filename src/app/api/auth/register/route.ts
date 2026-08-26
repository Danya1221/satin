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

  const existingCustomer = await prisma.customer.findFirst({
    where: {
      OR: [{ phone }, ...(email ? [{ email }] : [])],
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (existingCustomer?.passwordHash) {
    return jsonError("Клиент с таким телефоном или e-mail уже зарегистрирован.", 409);
  }

  const passwordHash = hashPassword(password);
  const customer = existingCustomer
    ? await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name: firstName,
          lastName,
          phone,
          email,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          lastName: true,
          phone: true,
          email: true,
        },
      })
    : await prisma.customer.create({
        data: {
          name: firstName,
          lastName,
          phone,
          email,
          passwordHash,
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
