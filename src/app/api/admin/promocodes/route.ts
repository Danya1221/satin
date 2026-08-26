/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isCustomerStatus } from "@/lib/customer-status-types";

export const dynamic = "force-dynamic";

type PromoInput = {
  id?: unknown;
  code?: unknown;
  name?: unknown;
  description?: unknown;
  discountType?: unknown;
  discountValue?: unknown;
  maxDiscount?: unknown;
  minOrderTotal?: unknown;
  minItemPrice?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  usageLimit?: unknown;
  perCustomerLimit?: unknown;
  firstOrderOnly?: unknown;
  minCompletedOrders?: unknown;
  minTotalSpent?: unknown;
  conditionMode?: unknown;
  allowedStatuses?: unknown;
  allowWithStatusDiscount?: unknown;
  active?: unknown;
};

async function requireAdmin() {
  const session = await getAuthSession();
  return session?.role === "admin";
}

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function integer(value: unknown, min = 0, max = 1_000_000_000) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : min;
}

function dateValue(value: unknown) {
  const raw = text(value, 60);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizePromo(body: PromoInput) {
  const code = text(body.code, 40).toUpperCase().replace(/\s+/g, "");
  if (!/^[A-ZА-Я0-9_-]{3,40}$/u.test(code)) {
    throw new Error("Код должен содержать 3–40 букв, цифр, _ или -.");
  }
  const name = text(body.name, 120) || code;
  const discountType = body.discountType === "fixed" ? "fixed" : "percent";
  const discountValue = integer(body.discountValue, 1, discountType === "percent" ? 100 : 100_000_000);
  const allowedStatuses = Array.isArray(body.allowedStatuses)
    ? body.allowedStatuses.filter(isCustomerStatus)
    : [];

  return {
    code,
    name,
    description: text(body.description, 1000),
    discountType,
    discountValue,
    maxDiscount: integer(body.maxDiscount),
    minOrderTotal: integer(body.minOrderTotal),
    minItemPrice: integer(body.minItemPrice),
    startsAt: dateValue(body.startsAt),
    endsAt: dateValue(body.endsAt),
    usageLimit: integer(body.usageLimit, 0, 10_000_000),
    perCustomerLimit: integer(body.perCustomerLimit, 0, 100_000),
    firstOrderOnly: body.firstOrderOnly === true,
    minCompletedOrders: integer(body.minCompletedOrders, 0, 100_000),
    minTotalSpent: integer(body.minTotalSpent),
    conditionMode: body.conditionMode === "any" ? "any" : "all",
    allowedStatuses,
    allowWithStatusDiscount: body.allowWithStatusDiscount !== false,
    active: body.active !== false,
  };
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Нет доступа." }, { status: 401 });

  const promocodes = await (prisma as any).promoCode.findMany({
    include: { _count: { select: { usages: true } } },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ promocodes });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  try {
    const body = (await request.json()) as PromoInput;
    const promo = await (prisma as any).promoCode.create({ data: normalizePromo(body) });
    return NextResponse.json({ ok: true, promo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось создать промокод." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  try {
    const body = (await request.json()) as PromoInput;
    const id = text(body.id, 100);
    if (!id) throw new Error("Не указан промокод.");
    const promo = await (prisma as any).promoCode.update({ where: { id }, data: normalizePromo(body) });
    return NextResponse.json({ ok: true, promo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось сохранить промокод." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "Не указан промокод." }, { status: 400 });
  await (prisma as any).promoCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
