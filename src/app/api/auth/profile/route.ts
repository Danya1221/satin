import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createAuthSessionToken,
  getAuthCookieOptions,
  getAuthSession,
  normalizeText,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSupportTopic } from "@/lib/support-topics";
import {
  calculateCustomerStatus,
  getCustomerStatusRules,
} from "@/lib/customer-status-db";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function orderDelivery(order: {
  deliveryType: "courier" | "pickup";
  address: string;
  pickupPoint: string;
}) {
  if (order.deliveryType === "pickup") {
    return order.pickupPoint || "ПВЗ / самовывоз";
  }

  return order.address || "Курьерская доставка";
}

async function getCustomerProfile(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      lastName: true,
      phone: true,
      email: true,
      createdAt: true,
      statusOverride: true,
      statusOverrideAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          items: {
            orderBy: { id: "asc" },
          },
        },
      },
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      },
      tickets: {
        orderBy: { updatedAt: "desc" },
        take: 20,
      },
      favorites: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          product: true,
        },
      },
    },
  });

  if (!customer) {
    return null;
  }

  const statusRules = await getCustomerStatusRules();
  const statusProgress = calculateCustomerStatus(customer, statusRules);
  const statusDiscountEnabled =
    statusProgress.status === "vip"
      ? statusRules.vipDiscountEnabled
      : statusProgress.status === "regular"
        ? statusRules.regularDiscountEnabled
        : false;
  const statusDiscountTiers =
    statusProgress.status === "vip"
      ? statusRules.vipDiscountTiers
      : statusProgress.status === "regular"
        ? statusRules.regularDiscountTiers
        : [];

  return {
    profile: {
      id: customer.id,
      name: customer.name,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email,
      createdAt: customer.createdAt.toISOString(),
    },
    statusProgress,
    statusDiscount: {
      enabled: statusDiscountEnabled,
      tiers: statusDiscountTiers,
    },
    orders: customer.orders.map((order) => ({
      id: order.id,
      publicId: order.publicId,
      createdAt: order.createdAt.toISOString(),
      total: order.total,
      status: order.status,
      delivery: orderDelivery(order),
      items: order.items.map((item) => ({
        id: item.id,
        title: item.title,
        productTitle: item.productTitle,
        brand: item.brand,
        sku: item.sku,
        memory: item.memory,
        color: item.color,
        sim: item.sim,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
      })),
    })),
    addresses: customer.addresses.map((address) => ({
      id: address.id,
      type: address.type,
      value: address.value,
      isDefault: address.isDefault,
    })),
    supportRequests: customer.tickets.map((ticket) => {
      const topic = getSupportTopic(ticket.topic);

      return {
        id: ticket.id,
        publicId: ticket.publicId,
        topic: topic.title,
        message: ticket.message,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
      };
    }),
    favorites: customer.favorites.map((favorite) => ({
      id: favorite.id,
      product: {
        id: favorite.product.id,
        slug: favorite.product.slug,
        name: favorite.product.name,
        brand: favorite.product.brand,
        image: favorite.product.image || favorite.product.images[0] || "",
        price: null,
      },
    })),
  };
}

export async function GET() {
  const session = await getAuthSession();

  if (!session || session.role !== "customer" || !session.customerId) {
    return jsonError("Нужно войти в личный кабинет.", 401);
  }

  const data = await getCustomerProfile(session.customerId);

  if (!data) {
    return jsonError("Клиент не найден.", 404);
  }

  return NextResponse.json({ ok: true, ...data });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();

  if (!session || session.role !== "customer" || !session.customerId) {
    return jsonError("Нужно войти в личный кабинет.", 401);
  }

  const body = (await request.json().catch(() => null)) as
    | { firstName?: unknown; lastName?: unknown }
    | null;
  const firstName = normalizeText(body?.firstName);
  const lastName = normalizeText(body?.lastName);

  if (!firstName || !lastName) {
    return jsonError("Укажите имя и фамилию.");
  }

  const customer = await prisma.customer.update({
    where: { id: session.customerId },
    data: {
      name: firstName,
      lastName,
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
      profile: customer,
    },
  });

  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  return response;
}

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session || session.role !== "customer" || !session.customerId) {
    return jsonError("Нужно войти в личный кабинет.", 401);
  }

  const body = (await request.json().catch(() => null)) as
    | { action?: unknown; address?: unknown }
    | null;
  const action = normalizeText(body?.action);
  const address = normalizeText(body?.address);

  if (action !== "add-address") {
    return jsonError("Неизвестное действие.");
  }

  if (!address) {
    return jsonError("Укажи адрес доставки.");
  }

  const existing = await prisma.address.findFirst({
    where: {
      customerId: session.customerId,
      value: address,
    },
    select: { id: true },
  });

  if (!existing) {
    const addressesCount = await prisma.address.count({
      where: { customerId: session.customerId },
    });

    await prisma.address.create({
      data: {
        customerId: session.customerId,
        type: "courier",
        value: address,
        isDefault: addressesCount === 0,
      },
    });
  }

  const data = await getCustomerProfile(session.customerId);

  return NextResponse.json({ ok: true, addresses: data?.addresses ?? [] });
}
