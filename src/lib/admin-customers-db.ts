import "server-only";

import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/product-pricing";
import { calculateCustomerStatus, getCustomerStatusRules } from "@/lib/customer-status-db";
import {
  formatSupportDate,
  getSupportStatusLabel,
  listSupportRequests,
  type SupportRequest,
} from "@/lib/support-store";


type CustomerWithRelations = Awaited<ReturnType<typeof getCustomerRecords>>[number];

async function getCustomerRecords() {
  // Важно: основа раздела "Клиенты" — таблица Customer.
  // Поэтому сюда попадают и зарегистрированные пользователи без заказов.
  return prisma.customer.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      addresses: {
        orderBy: {
          updatedAt: "desc",
        },
      },
      orders: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          items: true,
        },
      },
    },
  });
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isRealContact(value: string | null | undefined) {
  const normalized = normalize(value);
  return Boolean(normalized && normalized !== "не указан" && normalized !== "не указано");
}

function getCustomerFullName(customer: Pick<CustomerWithRelations, "name" | "lastName" | "phone" | "email">) {
  return [customer.name, customer.lastName].filter(Boolean).join(" ").trim() || customer.phone || customer.email || "Клиент";
}

function getCustomerInitial(customer: Pick<CustomerWithRelations, "name" | "lastName" | "phone" | "email">) {
  return getCustomerFullName(customer).slice(0, 1).toUpperCase() || "К";
}

function matchesCustomer(request: SupportRequest, customer: Pick<CustomerWithRelations, "phone" | "email" | "name">) {
  const requestPhone = normalize(request.phone);
  const customerPhone = normalize(customer.phone);
  const requestEmail = normalize(request.email);
  const customerEmail = normalize(customer.email);

  if (isRealContact(requestPhone) && requestPhone === customerPhone) {
    return true;
  }

  if (isRealContact(requestEmail) && isRealContact(customerEmail) && requestEmail === customerEmail) {
    return true;
  }

  return false;
}

function getCustomerSupportRequests(customer: Pick<CustomerWithRelations, "phone" | "email" | "name">, requests: SupportRequest[]) {
  return requests.filter((request) => matchesCustomer(request, customer));
}

function getCustomerTotal(customer: CustomerWithRelations) {
  return customer.orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + order.total, 0);
}

function getCustomerLastActivity(customer: CustomerWithRelations, requests: SupportRequest[]) {
  const dates = [
    customer.updatedAt,
    ...customer.orders.map((order) => order.updatedAt),
    ...customer.addresses.map((address) => address.updatedAt),
    ...requests.map((request) => new Date(request.updatedAt)),
  ].filter((date) => !Number.isNaN(date.getTime()));

  return dates.sort((first, second) => second.getTime() - first.getTime())[0] ?? customer.updatedAt;
}

function isRegisteredCustomer(customer: Pick<CustomerWithRelations, "passwordHash">) {
  return Boolean(customer.passwordHash.trim());
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

export function getAddressTypeLabel(type: string) {
  return type === "pickup" ? "ПВЗ / самовывоз" : "Курьерская доставка";
}

export function getClientStatusClass(status: string) {
  if (status === "VIP") {
    return "border-purple-500/35 bg-purple-500/10 text-purple-300";
  }

  if (status === "Постоянный клиент") {
    return "border-blue-500/35 bg-blue-500/10 text-blue-400";
  }

  if (status === "Новый клиент") {
    return "border-green-500/35 bg-green-500/10 text-green-300";
  }

  return "border-orange-500/35 bg-orange-500/10 text-orange-300";
}

export async function getAdminCustomers() {
  const [customers, supportRequests, statusRules] = await Promise.all([
    getCustomerRecords(),
    listSupportRequests(),
    getCustomerStatusRules(),
  ]);

  return customers.map((customer) => {
    const tickets = getCustomerSupportRequests(customer, supportRequests);
    const totalSpent = getCustomerTotal(customer);
    const lastActivity = getCustomerLastActivity(customer, tickets);
    const statusProgress = calculateCustomerStatus(customer, statusRules);
    const fullName = getCustomerFullName(customer);
    const isRegistered = isRegisteredCustomer(customer);

    return {
      id: customer.id,
      name: customer.name,
      lastName: customer.lastName,
      fullName,
      initial: getCustomerInitial(customer),
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      crmId: customer.crmId,
      isRegistered,
      authLabel: isRegistered ? "Аккаунт создан" : "Без аккаунта",
      registeredAt: customer.createdAt,
      registeredAtLabel: formatAdminDate(customer.createdAt),
      ordersCount: customer.orders.length,
      completedOrdersCount: statusProgress.completedOrders,
      countedOrdersCount: statusProgress.countedOrders,
      ticketsCount: tickets.length,
      totalSpent,
      totalSpentLabel: formatAdminPrice(totalSpent),
      countedSpent: statusProgress.countedSpent,
      countedSpentLabel: formatAdminPrice(statusProgress.countedSpent),
      status: statusProgress.statusLabel,
      statusProgress,
      lastActivity,
      lastActivityLabel: formatAdminDate(lastActivity),
    };
  });
}

export async function getCustomerMetrics() {
  const customers = await getAdminCustomers();

  return {
    total: customers.length,
    registered: customers.filter((customer) => customer.isRegistered).length,
    new: customers.filter((customer) => customer.status === "Новый клиент").length,
    regular: customers.filter((customer) => customer.status === "Постоянный клиент").length,
    vip: customers.filter((customer) => customer.status === "VIP").length,
    attention: customers.filter((customer) => customer.status === "Требует внимания").length,
    totalSpent: customers.reduce((sum, customer) => sum + customer.totalSpent, 0),
  };
}

export async function getAdminCustomer(id: string) {
  const [customer, supportRequests, statusRules] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: {
          orderBy: {
            updatedAt: "desc",
          },
        },
        orders: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            items: true,
          },
        },
      },
    }),
    listSupportRequests(),
    getCustomerStatusRules(),
  ]);

  if (!customer) {
    return null;
  }

  const tickets = getCustomerSupportRequests(customer, supportRequests);
  const totalSpent = getCustomerTotal(customer);
  const lastActivity = getCustomerLastActivity(customer, tickets);
  const statusProgress = calculateCustomerStatus(customer, statusRules);
  const isRegistered = isRegisteredCustomer(customer);

  return {
    id: customer.id,
    name: customer.name,
    lastName: customer.lastName,
    fullName: getCustomerFullName(customer),
    initial: getCustomerInitial(customer),
    phone: customer.phone,
    email: customer.email,
    city: customer.city,
    crmId: customer.crmId,
    isRegistered,
    authLabel: isRegistered ? "Аккаунт создан" : "Без аккаунта",
    registeredAt: customer.createdAt,
    registeredAtLabel: formatAdminDate(customer.createdAt),
    status: statusProgress.statusLabel,
    statusProgress,
    statusRules,
    totalSpent,
    totalSpentLabel: formatAdminPrice(totalSpent),
    ordersCount: customer.orders.length,
    ticketsCount: tickets.length,
    lastActivity,
    lastActivityLabel: formatAdminDate(lastActivity),
    addresses: customer.addresses.map((address) => ({
      id: address.id,
      type: getAddressTypeLabel(address.type),
      value: address.value,
      isDefault: address.isDefault,
    })),
    orders: customer.orders.map((order) => ({
      id: order.id,
      publicId: order.publicId,
      product: order.items.map((item) => `${item.title} × ${item.quantity}`).join(", ") || "Без товаров",
      total: formatAdminPrice(order.total),
      status: order.status,
      deliveryType: order.deliveryType,
      date: formatAdminDate(order.createdAt),
    })),
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      number: ticket.number,
      topic: ticket.topicTitle,
      linkedOrder: ticket.orderPublicId || "Без привязки к заказу",
      status: getSupportStatusLabel(ticket.status),
      date: formatSupportDate(ticket.updatedAt),
    })),
  };
}
