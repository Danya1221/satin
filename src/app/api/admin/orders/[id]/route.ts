import { NextResponse } from "next/server";

import { canAccessAdminSection } from "@/lib/admin-access";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrderWorkflowSettings } from "@/lib/order-workflow-db";
import {
  getDefaultOrderStatus,
  getOrderStatusLabel,
  getStatusesForDelivery,
} from "@/lib/order-status";

type DraftItem = {
  variantId?: unknown;
  quantity?: unknown;
  price?: unknown;
};

type UpdateBody = {
  customerId?: unknown;
  customerName?: unknown;
  phone?: unknown;
  email?: unknown;
  deliveryType?: unknown;
  address?: unknown;
  pickupPoint?: unknown;
  paymentMethod?: unknown;
  status?: unknown;
  comment?: unknown;
  managerComment?: unknown;
  items?: unknown;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function positiveInteger(value: unknown, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.trunc(parsed)) : fallback;
}

async function prepareItems(rawItems: DraftItem[]) {
  if (!rawItems.length) throw new Error("Добавь хотя бы один товар.");

  const variantIds = rawItems.map((item) => normalizeText(item.variantId)).filter(Boolean);
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
    const price = positiveInteger(item.price, variant.price);

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
      price,
    };
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (session?.role !== "admin" || !canAccessAdminSection(session, "orders")) {
      return NextResponse.json({ ok: false, error: "Недостаточно прав." }, { status: 403 });
    }

    const currentAdmin = session.login
      ? await prisma.adminUser.findUnique({
          where: { login: session.login },
          select: { id: true, name: true, login: true, isActive: true },
        })
      : null;

    if (currentAdmin && !currentAdmin.isActive) {
      return NextResponse.json(
        { ok: false, error: "Учётная запись сотрудника отключена." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateBody;
    const isFullEdit = Array.isArray(body.items);

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "Заявка не найдена." }, { status: 404 });
    }

    const workflow = await getOrderWorkflowSettings();
    const deliveryType =
      body.deliveryType === "pickup"
        ? "pickup"
        : body.deliveryType === "courier"
          ? "courier"
          : order.deliveryType;
    const deliveryChanged = deliveryType !== order.deliveryType;

    const requestedStatus = normalizeText(body.status);
    const availableStatuses = getStatusesForDelivery(deliveryType, workflow);
    const requestedStatusExists = availableStatuses.some(
      (status) => status.id === requestedStatus && status.active,
    );

    let nextStatus = requestedStatusExists ? requestedStatus : order.status;
    const currentStatusExists = availableStatuses.some(
      (status) => status.id === nextStatus && (status.active || status.id === order.status),
    );

    if ((deliveryChanged && workflow.resetStatusOnDeliveryChange) || !currentStatusExists) {
      nextStatus = getDefaultOrderStatus(deliveryType, workflow);
    }

    const nextAddress =
      deliveryType === "courier"
        ? normalizeText(body.address) || (!deliveryChanged ? order.address : "")
        : "";
    const nextPickupPoint =
      deliveryType === "pickup"
        ? normalizeText(body.pickupPoint) || (!deliveryChanged ? order.pickupPoint : "")
        : "";

    if (deliveryType === "courier" && !nextAddress) {
      return NextResponse.json({ ok: false, error: "Укажи адрес доставки." }, { status: 400 });
    }
    if (deliveryType === "pickup" && !nextPickupPoint) {
      return NextResponse.json(
        { ok: false, error: "Укажи ПВЗ или точку самовывоза." },
        { status: 400 },
      );
    }

    const customerName = isFullEdit ? normalizeText(body.customerName) : order.customerName;
    const phone = isFullEdit ? normalizeText(body.phone) : order.phone;
    const email = isFullEdit ? normalizeText(body.email).toLowerCase() : order.email;

    if (!customerName || !phone) {
      return NextResponse.json(
        { ok: false, error: "Укажи имя и телефон клиента." },
        { status: 400 },
      );
    }

    let customerId = order.customerId;
    if (isFullEdit) {
      const requestedCustomerId = normalizeText(body.customerId);
      const existingCustomer = requestedCustomerId
        ? await prisma.customer.findUnique({ where: { id: requestedCustomerId } })
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

      customerId = savedCustomer.id;
    }

    const preparedItems = isFullEdit ? await prepareItems(body.items as DraftItem[]) : null;
    const subtotal = preparedItems
      ? preparedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : order.subtotal || order.total;

    const statusChanged = nextStatus !== order.status;
    const adminName =
      currentAdmin?.name || currentAdmin?.login || session.name || session.login || "Менеджер";
    const details: string[] = [];

    if (deliveryChanged) {
      details.push(
        `Способ получения: ${order.deliveryType === "pickup" ? "самовывоз" : "курьер"} → ${
          deliveryType === "pickup" ? "самовывоз" : "курьер"
        }`,
      );
    }
    if (statusChanged) {
      details.push(
        `Статус: ${getOrderStatusLabel(order.status, order.deliveryType, workflow)} → ${getOrderStatusLabel(
          nextStatus,
          deliveryType,
          workflow,
        )}`,
      );
    }
    if (isFullEdit) {
      details.push(`Обновлены данные заявки и товары: ${preparedItems?.length ?? 0} поз.`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        customerId,
        customerName,
        phone,
        email,
        status: nextStatus,
        deliveryType,
        address: nextAddress,
        pickupPoint: nextPickupPoint,
        paymentMethod:
          isFullEdit && normalizeText(body.paymentMethod)
            ? normalizeText(body.paymentMethod)
            : order.paymentMethod,
        comment: typeof body.comment === "string" ? body.comment.trim() : order.comment,
        managerComment:
          isFullEdit && typeof body.managerComment === "string"
            ? body.managerComment.trim()
            : order.managerComment,
        ...(preparedItems
          ? {
              subtotal,
              statusDiscount: 0,
              promoDiscount: 0,
              promoCode: "",
              discountTotal: 0,
              total: subtotal,
              items: {
                deleteMany: {},
                create: preparedItems,
              },
            }
          : {}),
        ...(statusChanged
          ? {
              assignedToId: currentAdmin?.id ?? order.assignedToId,
              assignedToName: adminName,
            }
          : {}),
        changes: {
          create: {
            adminId: currentAdmin?.id,
            adminName,
            action: statusChanged
              ? "Изменён статус заявки"
              : deliveryChanged
                ? "Изменён способ получения"
                : isFullEdit
                  ? "Отредактирована заявка"
                  : "Заявка обновлена",
            details: details.join(". "),
          },
        },
      },
    });

    return NextResponse.json({ ok: true, order: updatedOrder });
  } catch (error) {
    console.error("Order update error", error);

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Не удалось обновить заявку." },
      { status: 500 },
    );
  }
}
