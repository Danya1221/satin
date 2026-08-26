import { NextResponse } from "next/server";

import { getAuthSession, normalizeText } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrderWorkflowSettings } from "@/lib/order-workflow-db";
import { getDefaultOrderStatus, getStatusesForDelivery } from "@/lib/order-status";

export const dynamic = "force-dynamic";

const allowedDeliveryTypes = ["courier", "pickup"] as const;

type DraftItem = {
  variantId?: unknown;
  quantity?: unknown;
  price?: unknown;
};

function positiveInteger(value: unknown, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.trunc(parsed)) : fallback;
}

async function requireAdmin() {
  const session = await getAuthSession();
  if (session?.role !== "admin") return null;

  const admin = session.login
    ? await prisma.adminUser.findUnique({
        where: { login: session.login },
        select: { id: true, name: true, login: true, isActive: true },
      })
    : null;

  if (admin && !admin.isActive) return null;

  return {
    id: admin?.id,
    name: admin?.name || session.name || session.login || "Менеджер",
  };
}

async function generatePublicId() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Math.floor(10000 + Math.random() * 90000);
    const publicId = `NZ-${suffix}`;
    const exists = await prisma.order.findUnique({ where: { publicId }, select: { id: true } });
    if (!exists) return publicId;
  }

  return `NZ-${Date.now().toString().slice(-8)}`;
}

async function prepareItems(rawItems: DraftItem[]) {
  if (!rawItems.length) throw new Error("Добавь хотя бы один товар.");

  const variantIds = rawItems
    .map((item) => normalizeText(item.variantId))
    .filter(Boolean);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });
  const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

  return rawItems.map((item) => {
    const variantId = normalizeText(item.variantId);
    const variant = variantsById.get(variantId);
    if (!variant) throw new Error("Одна из выбранных позиций больше не существует.");

    const quantity = positiveInteger(item.quantity);
    const requestedPrice = positiveInteger(item.price, variant.price);

    return {
      productId: variant.productId,
      variantId: variant.id,
      title: variant.title,
      productTitle: variant.product.name,
      brand: variant.product.brand,
      sku: variant.sku,
      memory: variant.memory,
      color: variant.color,
      sim: variant.sim,
      image: variant.images[0] || variant.product.image || variant.product.images[0] || "",
      quantity,
      price: requestedPrice,
    };
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Нет доступа." }, { status: 401 });

  try {
    const body = (await request.json()) as Record<string, unknown> & { items?: DraftItem[] };
    const customerName = normalizeText(body.customerName);
    const phone = normalizeText(body.phone);
    const email = normalizeText(body.email).toLowerCase();
    const customerId = normalizeText(body.customerId) || undefined;
    const deliveryType = allowedDeliveryTypes.includes(body.deliveryType as never)
      ? (body.deliveryType as "courier" | "pickup")
      : "courier";
    const workflow = await getOrderWorkflowSettings();
    const requestedStatus = normalizeText(body.status);
    const availableStatuses = getStatusesForDelivery(deliveryType, workflow);
    const status = availableStatuses.some((item) => item.id === requestedStatus && item.active)
      ? requestedStatus
      : getDefaultOrderStatus(deliveryType, workflow);
    const address = normalizeText(body.address);
    const pickupPoint = normalizeText(body.pickupPoint);
    const paymentMethod = normalizeText(body.paymentMethod) || "cash";
    const comment = normalizeText(body.comment);
    const managerComment = normalizeText(body.managerComment);
    const assignedToId = admin.id || undefined;
    const preparedItems = await prepareItems(Array.isArray(body.items) ? body.items : []);

    if (!customerName || !phone) {
      return NextResponse.json({ ok: false, error: "Укажи имя и телефон клиента." }, { status: 400 });
    }
    if (deliveryType === "courier" && !address) {
      return NextResponse.json({ ok: false, error: "Укажи адрес доставки." }, { status: 400 });
    }
    if (deliveryType === "pickup" && !pickupPoint) {
      return NextResponse.json({ ok: false, error: "Укажи ПВЗ или точку самовывоза." }, { status: 400 });
    }

    const assignee = assignedToId
      ? await prisma.adminUser.findFirst({
          where: { id: assignedToId, isActive: true },
          select: { id: true, name: true, login: true },
        })
      : null;

    const existingCustomer = customerId
      ? await prisma.customer.findUnique({ where: { id: customerId } })
      : await prisma.customer.findFirst({ where: { phone } });
    const nameParts = customerName.split(/\s+/).filter(Boolean);
    const savedCustomer = existingCustomer
      ? await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: nameParts[0] || customerName,
            lastName: nameParts.slice(1).join(" "),
            phone,
            email,
          },
        })
      : await prisma.customer.create({
          data: {
            name: nameParts[0] || customerName,
            lastName: nameParts.slice(1).join(" "),
            phone,
            email,
          },
        });

    const total = preparedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await prisma.order.create({
      data: ({
        publicId: await generatePublicId(),
        customerId: savedCustomer.id,
        customerName,
        phone,
        email,
        deliveryType,
        address: deliveryType === "courier" ? address : "",
        pickupPoint: deliveryType === "pickup" ? pickupPoint : "",
        paymentMethod,
        subtotal: total,
        statusDiscount: 0,
        promoDiscount: 0,
        promoCode: "",
        discountTotal: 0,
        total,
        status,
        comment,
        managerComment,
        assignedToId: assignee?.id,
        assignedToName: assignee?.name || assignee?.login || "",
        items: { create: preparedItems },
        changes: {
          create: {
            adminId: admin.id,
            adminName: admin.name,
            action: "Заявка создана вручную",
            details: `Товаров: ${preparedItems.length}. Ответственный: ${assignee?.name || assignee?.login || "не назначен"}.`,
          },
        },
      }),
    });

    return NextResponse.json({ ok: true, order: { id: order.id, publicId: order.publicId } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Не удалось создать заявку." },
      { status: 500 },
    );
  }
}
