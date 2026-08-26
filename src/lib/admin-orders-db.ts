import "server-only";

import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/product-pricing";
export { getOrderStatusClass, getOrderStatusLabel } from "@/lib/order-status";

export function getDeliveryLabel(type: string) {
  return type === "pickup" ? "ПВЗ / самовывоз" : "Курьерская доставка";
}

export function formatAdminDate(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function formatAdminPrice(value: number) {
  return formatPrice(value);
}

export async function getAdminOrders() {
  return prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      assignedTo: {
        select: { id: true, name: true, login: true },
      },
    },
  });
}

export async function getAdminOrder(idOrPublicId: string) {
  return prisma.order.findFirst({
    where: {
      OR: [{ id: idOrPublicId }, { publicId: idOrPublicId }],
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      assignedTo: {
        select: { id: true, name: true, login: true },
      },
      changes: {
        orderBy: { createdAt: "desc" },
      },
      supportRequests: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, publicId: true, status: true, updatedAt: true },
      },
    },
  });
}

export async function getOrderMetrics() {
  const [orders, newOrders, inWorkOrders] = await Promise.all([
    prisma.order.findMany({ select: { total: true, status: true, createdAt: true } }),
    prisma.order.count({ where: { status: "new" } }),
    prisma.order.count({ where: { status: "in_work" } }),
  ]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayTotal = orders
    .filter((order) => order.createdAt >= startOfToday)
    .reduce((sum, order) => sum + order.total, 0);

  return {
    total: orders.length,
    new: newOrders,
    inWork: inWorkOrders,
    todayTotal,
  };
}


export async function getOrderEditorOptions() {
  const [customers, positions, staff] = await Promise.all([
    prisma.customer.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        lastName: true,
        phone: true,
        email: true,
        city: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
          select: { id: true, type: true, value: true, isDefault: true },
        },
      },
    }),
    prisma.productVariant.findMany({
      orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
      include: {
        product: {
          select: { id: true, name: true, brand: true, image: true, images: true },
        },
      },
    }),
    prisma.adminUser.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }, { login: "asc" }],
      select: { id: true, name: true, login: true, role: true, roles: true },
    }),
  ]);

  return {
    customers: customers.map((customer) => ({
      ...customer,
      fullName: [customer.name, customer.lastName].filter(Boolean).join(" ").trim() || customer.phone,
    })),
    positions: positions.map((position) => ({
      id: position.id,
      productId: position.productId,
      sku: position.sku,
      title: position.title,
      productTitle: position.product.name,
      brand: position.product.brand,
      memory: position.memory,
      color: position.color,
      sim: position.sim,
      price: position.price,
      oldPrice: position.oldPrice ?? 0,
      stock: position.stock,
      status: position.status,
      image: position.images[0] || position.product.image || position.product.images[0] || "",
    })),
    staff,
  };
}
