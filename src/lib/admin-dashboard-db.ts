import { prisma } from "@/lib/db";

export type AdminDashboardMetric = {
  label: string;
  value: string;
};

export type AdminDashboardSection = {
  title: string;
  description: string;
  href: string;
  value: string;
  label: string;
};

export type AdminDashboardAction = {
  title: string;
  text: string;
  time: string;
  href: string;
  createdAt: Date;
};

export type AdminDashboardData = {
  metrics: AdminDashboardMetric[];
  sections: AdminDashboardSection[];
  recentActions: AdminDashboardAction[];
};

function formatCount(value: number) {
  return value.toLocaleString("ru-RU");
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function formatActionTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) {
    return "только что";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} мин назад`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} ч назад`;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

function orderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "новая",
    confirming: "подтверждение",
    in_work: "в работе",
    ready: "готова",
    completed: "завершена",
    cancelled: "отменена",
  };

  return labels[status] ?? status;
}

function supportStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "новое",
    in_work: "в работе",
    waiting_client: "ждёт клиента",
    closed: "закрыто",
  };

  return labels[status] ?? status;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    productsCount,
    activeProductsCount,
    popularProductsCount,
    newProductsCount,
    variantsCount,
    variantsInStockCount,
    categoriesCount,
    activeCategoriesCount,
    customersCount,
    ordersCount,
    ordersTodayCount,
    openOrdersCount,
    revenueAggregate,
    supportCount,
    openSupportCount,
    products,
    variants,
    orders,
    supportRequests,
    customers,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "active" } }),
    prisma.product.count({ where: { isPopular: true } }),
    prisma.product.count({ where: { isNew: true } }),
    prisma.productVariant.count(),
    prisma.productVariant.count({ where: { status: "active", stock: { gt: 0 } } }),
    prisma.category.count(),
    prisma.category.count({ where: { status: "active" } }),
    prisma.customer.count(),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: { notIn: ["completed", "cancelled"] } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "cancelled" } },
    }),
    prisma.supportRequest.count(),
    prisma.supportRequest.count({ where: { status: { not: "closed" } } }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        createdAt: true,
      },
    }),
    prisma.productVariant.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        sku: true,
        title: true,
        price: true,
        stock: true,
        createdAt: true,
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        publicId: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.supportRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        publicId: true,
        topic: true,
        clientName: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        name: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    }),
  ]);

  const recentActions: AdminDashboardAction[] = [
    ...orders.map((order) => ({
      title: "Новая заявка",
      text: `${order.publicId} · ${order.customerName || "клиент"} · ${formatMoney(order.total)} · ${orderStatusLabel(order.status)}`,
      time: formatActionTime(order.createdAt),
      href: `/nz-console/orders/${order.id}`,
      createdAt: order.createdAt,
    })),
    ...supportRequests.map((request) => ({
      title: "Обращение в поддержку",
      text: `${request.publicId} · ${request.topic} · ${request.clientName || "клиент"} · ${supportStatusLabel(request.status)}`,
      time: formatActionTime(request.createdAt),
      href: `/nz-console/support/${request.id}`,
      createdAt: request.createdAt,
    })),
    ...products.map((product) => ({
      title: "Создана карточка",
      text: `${product.brand} · ${product.name}`,
      time: formatActionTime(product.createdAt),
      href: `/nz-console/products/${product.slug}`,
      createdAt: product.createdAt,
    })),
    ...variants.map((variant) => ({
      title: "Добавлена позиция",
      text: `${variant.product.name} · ${variant.title} · ${formatMoney(variant.price)} · ${variant.stock} шт.`,
      time: formatActionTime(variant.createdAt),
      href: `/nz-console/positions/${variant.sku}`,
      createdAt: variant.createdAt,
    })),
    ...customers.map((customer) => ({
      title: "Новый клиент",
      text: `${customer.name} ${customer.lastName}`.trim() || customer.phone,
      time: formatActionTime(customer.createdAt),
      href: `/nz-console/users/${customer.id}`,
      createdAt: customer.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 7);

  return {
    metrics: [
      { label: "Карточки", value: formatCount(productsCount) },
      { label: "Позиции / SKU", value: formatCount(variantsCount) },
      { label: "Заявки сегодня", value: formatCount(ordersTodayCount) },
      { label: "Выручка", value: formatMoney(revenueAggregate._sum.total ?? 0) },
    ],
    sections: [
      {
        title: "Карточки товаров",
        description:
          "Материнские карточки, которые видит клиент: название, бренд, категория, фото, популярное и новинки.",
        href: "/nz-console/products",
        value: formatCount(activeProductsCount),
        label: "активные",
      },
      {
        title: "Позиции / SKU",
        description:
          "Конкретные конфигурации с ценой, наличием и SKU: память, цвет, SIM, склад.",
        href: "/nz-console/positions",
        value: formatCount(variantsInStockCount),
        label: "в наличии",
      },
      {
        title: "Заявки",
        description: "Корзина, новые заказы, статусы, подтверждение и история клиента.",
        href: "/nz-console/orders",
        value: formatCount(openOrdersCount),
        label: "открытые",
      },
      {
        title: "Обращения",
        description:
          "Единый центр коммуникации: темы, диалоги и связь с клиентами.",
        href: "/nz-console/support",
        value: formatCount(openSupportCount),
        label: "в работе",
      },
      {
        title: "Категории",
        description: "Категории каталога, фото плиток, SEO-страницы и структура витрины.",
        href: "/nz-console/categories",
        value: formatCount(activeCategoriesCount),
        label: "активные",
      },
      {
        title: "Клиенты",
        description:
          "Зарегистрированные пользователи, заявки, обращения, адреса и история покупок.",
        href: "/nz-console/users",
        value: formatCount(customersCount),
        label: "клиентов",
      },
      {
        title: "Редактор сайта",
        description:
          "Витрина сайта: логотипы, hero, блоки главной, каталог и страница товара.",
        href: "/nz-console/site-editor",
        value: formatCount(popularProductsCount + newProductsCount),
        label: "витрина",
      },
      {
        title: "Настройки",
        description: "Интеграции, роли, доставка, уведомления и безопасность.",
        href: "/nz-console/settings",
        value: "⚙",
        label: "система",
      },
    ],
    recentActions,
  };
}
