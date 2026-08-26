/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { prisma } from "@/lib/db";
import {
  calculateCustomerStatus,
  getCustomerStatusRules,
} from "@/lib/customer-status-db";
import type {
  CustomerStatus,
  CustomerStatusRules,
  DiscountType,
} from "@/lib/customer-status-types";
import { normalizeRuPhone } from "@/lib/contact-validation";

export type CheckoutQuoteItem = {
  sku: string;
  quantity: number;
};

export type CheckoutQuote = {
  subtotal: number;
  statusDiscount: number;
  statusLabel: string;
  statusCode: CustomerStatus;
  promoDiscount: number;
  promoCode: string;
  promoName: string;
  promoValid: boolean;
  promoMessage: string;
  discountTotal: number;
  total: number;
  promoId: string | null;
};

type PreparedItem = {
  sku: string;
  quantity: number;
  price: number;
};

type CustomerContext = {
  id: string;
  statusCode: CustomerStatus;
  statusLabel: string;
  completedOrders: number;
  completedSpent: number;
  totalOrders: number;
};

function normalizeCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function positiveInteger(value: unknown, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.trunc(parsed)) : fallback;
}

function calculateDiscount(
  type: DiscountType,
  value: number,
  eligibleSubtotal: number,
  maxDiscount = 0,
) {
  if (eligibleSubtotal <= 0 || value <= 0) return 0;
  const calculated = type === "fixed"
    ? value
    : Math.round((eligibleSubtotal * Math.min(100, value)) / 100);
  const limited = maxDiscount > 0 ? Math.min(calculated, maxDiscount) : calculated;
  return Math.max(0, Math.min(eligibleSubtotal, limited));
}

async function prepareItems(items: CheckoutQuoteItem[]): Promise<PreparedItem[]> {
  const normalized = items
    .map((item) => ({
      sku: typeof item.sku === "string" ? item.sku.trim() : "",
      quantity: positiveInteger(item.quantity),
    }))
    .filter((item) => item.sku);

  if (!normalized.length) return [];

  const variants = await prisma.productVariant.findMany({
    where: { sku: { in: normalized.map((item) => item.sku) } },
    select: { sku: true, price: true },
  });
  const bySku = new Map(variants.map((variant) => [variant.sku, variant.price]));

  return normalized
    .map((item) => ({ ...item, price: bySku.get(item.sku) ?? 0 }))
    .filter((item) => item.price > 0);
}

async function getCustomerContext(input: {
  customerId?: string | null;
  phone?: string | null;
}): Promise<CustomerContext | null> {
  const phone = normalizeRuPhone(input.phone);
  const customer = input.customerId
    ? await prisma.customer.findUnique({
        where: { id: input.customerId },
        include: {
          orders: {
            select: { status: true, total: true, createdAt: true },
          },
        },
      })
    : phone
      ? await prisma.customer.findFirst({
          where: { phone },
          include: {
            orders: {
              select: { status: true, total: true, createdAt: true },
            },
          },
        })
      : null;

  if (!customer) return null;

  const rules = await getCustomerStatusRules();
  const status = calculateCustomerStatus(customer, rules);
  const completed = customer.orders.filter((order) => order.status === "completed");

  return {
    id: customer.id,
    statusCode: status.status,
    statusLabel: status.statusLabel,
    completedOrders: completed.length,
    completedSpent: completed.reduce((sum, order) => sum + order.total, 0),
    totalOrders: customer.orders.filter((order) => order.status !== "cancelled").length,
  };
}

function statusDiscountFor(
  items: PreparedItem[],
  subtotal: number,
  status: CustomerStatus,
  rules: CustomerStatusRules,
) {
  if (status === "new") return 0;

  const enabled = status === "vip" ? rules.vipDiscountEnabled : rules.regularDiscountEnabled;
  const tiers = status === "vip" ? rules.vipDiscountTiers : rules.regularDiscountTiers;

  if (!enabled || !tiers.length) return 0;

  const activeTier = [...tiers]
    .filter((tier) => tier.discountValue > 0 && subtotal >= tier.minOrderTotal)
    .sort((first, second) => second.minOrderTotal - first.minOrderTotal)[0];

  if (!activeTier) return 0;

  const eligibleSubtotal = items
    .filter((item) => item.price >= activeTier.minItemPrice)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return calculateDiscount(
    activeTier.discountType,
    activeTier.discountValue,
    eligibleSubtotal,
  );
}

export async function getCheckoutQuote(input: {
  items: CheckoutQuoteItem[];
  promoCode?: string | null;
  customerId?: string | null;
  phone?: string | null;
}): Promise<CheckoutQuote> {
  const items = await prepareItems(input.items);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const rules = await getCustomerStatusRules();
  const customer = await getCustomerContext({
    customerId: input.customerId,
    phone: input.phone,
  });
  const statusCode = customer?.statusCode ?? "new";
  const statusLabel = customer?.statusLabel ?? "Новый клиент";
  let statusDiscount = statusDiscountFor(items, subtotal, statusCode, rules);

  const code = normalizeCode(input.promoCode);
  if (!code) {
    return {
      subtotal,
      statusDiscount,
      statusLabel,
      statusCode,
      promoDiscount: 0,
      promoCode: "",
      promoName: "",
      promoValid: false,
      promoMessage: "",
      discountTotal: statusDiscount,
      total: Math.max(0, subtotal - statusDiscount),
      promoId: null,
    };
  }

  const promo = await (prisma as any).promoCode.findUnique({
    where: { code },
    include: { _count: { select: { usages: true } } },
  });

  const invalid = (message: string): CheckoutQuote => ({
    subtotal,
    statusDiscount,
    statusLabel,
    statusCode,
    promoDiscount: 0,
    promoCode: code,
    promoName: promo?.name ?? "",
    promoValid: false,
    promoMessage: message,
    discountTotal: statusDiscount,
    total: Math.max(0, subtotal - statusDiscount),
    promoId: null,
  });

  if (!promo || !promo.active) return invalid("Промокод не найден или выключен.");
  const now = new Date();
  if (promo.startsAt && promo.startsAt > now) return invalid("Промокод ещё не начал действовать.");
  if (promo.endsAt && promo.endsAt < now) return invalid("Срок действия промокода закончился.");
  if (subtotal < promo.minOrderTotal) {
    return invalid(`Минимальная сумма заказа — ${promo.minOrderTotal.toLocaleString("ru-RU")} ₽.`);
  }
  if (promo.usageLimit > 0 && promo._count.usages >= promo.usageLimit) {
    return invalid("Лимит использований промокода исчерпан.");
  }

  if (promo.firstOrderOnly || promo.minCompletedOrders > 0 || promo.minTotalSpent > 0 || promo.allowedStatuses.length) {
    if (!customer) return invalid("Для этого промокода нужно войти в аккаунт.");
  }

  if (customer && promo.perCustomerLimit > 0) {
    const used = await (prisma as any).promoCodeUsage.count({
      where: { promoCodeId: promo.id, customerId: customer.id },
    });
    if (used >= promo.perCustomerLimit) return invalid("Вы уже использовали этот промокод максимальное число раз.");
  }

  if (promo.firstOrderOnly && customer && customer.totalOrders > 0) {
    return invalid("Промокод действует только на первый заказ.");
  }

  const conditions: boolean[] = [];
  const conditionMessages: string[] = [];
  if (promo.minCompletedOrders > 0) {
    conditions.push(Boolean(customer && customer.completedOrders >= promo.minCompletedOrders));
    conditionMessages.push(`нужно ${promo.minCompletedOrders} завершённых заказов`);
  }
  if (promo.minTotalSpent > 0) {
    conditions.push(Boolean(customer && customer.completedSpent >= promo.minTotalSpent));
    conditionMessages.push(`нужна сумма покупок ${promo.minTotalSpent.toLocaleString("ru-RU")} ₽`);
  }
  if (promo.allowedStatuses.length > 0) {
    conditions.push(Boolean(customer && promo.allowedStatuses.includes(customer.statusCode)));
    conditionMessages.push(`доступен для статусов: ${promo.allowedStatuses.join(", ")}`);
  }

  if (conditions.length) {
    const passed = promo.conditionMode === "any" ? conditions.some(Boolean) : conditions.every(Boolean);
    if (!passed) {
      return invalid(
        `Условия промокода не выполнены: ${conditionMessages.join(promo.conditionMode === "any" ? " или " : ", ")}.`,
      );
    }
  }

  const eligibleSubtotal = items
    .filter((item) => item.price >= promo.minItemPrice)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (eligibleSubtotal <= 0) {
    return invalid(`Промокод действует на товары ценой от ${promo.minItemPrice.toLocaleString("ru-RU")} ₽.`);
  }

  let promoDiscount = calculateDiscount(
    promo.discountType === "fixed" ? "fixed" : "percent",
    promo.discountValue,
    eligibleSubtotal,
    promo.maxDiscount,
  );

  const canStack = promo.allowWithStatusDiscount;
  if (!canStack && statusDiscount > 0 && promoDiscount > 0) {
    if (promoDiscount >= statusDiscount) statusDiscount = 0;
    else promoDiscount = 0;
  }

  const discountTotal = Math.min(subtotal, statusDiscount + promoDiscount);

  return {
    subtotal,
    statusDiscount,
    statusLabel,
    statusCode,
    promoDiscount,
    promoCode: promo.code,
    promoName: promo.name,
    promoValid: true,
    promoMessage: `Промокод «${promo.code}» применён.`,
    discountTotal,
    total: Math.max(0, subtotal - discountTotal),
    promoId: promo.id,
  };
}
