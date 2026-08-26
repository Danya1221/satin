import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export type PageKey = "home" | "catalog" | "new" | "product" | "cart" | "profile" | "faq";

export type PageBlockType =
  | "hero"
  | "benefits"
  | "category-grid"
  | "popular-products"
  | "new-arrivals"
  | "support"
  | "promo-banner"
  | "text-image"
  | "product-carousel"
  | "catalog-header"
  | "catalog-filters"
  | "catalog-grid"
  | "catalog-empty"
  | "product-gallery"
  | "product-info"
  | "product-description"
  | "related-products"
  | "cart-items"
  | "delivery-methods"
  | "order-summary"
  | "profile-overview"
  | "profile-orders"
  | "profile-addresses"
  | "profile-support"
  | "faq-header"
  | "faq-content";

export type PageBlockSettings = Record<string, string | number | boolean | null>;

export type BuilderPage = {
  key: PageKey;
  title: string;
  description: string;
};

export type ModuleDefinition = {
  type: PageBlockType;
  title: string;
  description: string;
  pageKeys: PageKey[];
  defaultSettings: PageBlockSettings;
};

export type SitePageBlock = {
  id: string;
  pageKey: PageKey;
  type: PageBlockType;
  title: string;
  description: string;
  enabled: boolean;
  sortOrder: number;
  settings: PageBlockSettings;
  createdAt: string;
  updatedAt: string;
};

export type PageBuilderState = {
  pages: BuilderPage[];
  modules: ModuleDefinition[];
  blocks: Record<PageKey, SitePageBlock[]>;
};

export const builderPages: BuilderPage[] = [
  {
    key: "home",
    title: "Главная",
    description: "Hero, категории, популярные товары, новинки и промо-блоки.",
  },
  {
    key: "catalog",
    title: "Каталог",
    description: "Заголовок, фильтры, сетка товаров, пустые состояния и баннеры.",
  },
  {
    key: "new",
    title: "Новинки",
    description: "Отдельная страница новинок и её баннерные модули.",
  },
  {
    key: "product",
    title: "Карточка товара",
    description: "Галерея, информация, описание, похожие товары и дополнительные блоки.",
  },
  {
    key: "cart",
    title: "Корзина",
    description: "Состав заказа, способы получения, оформление и итоговая карточка.",
  },
  {
    key: "profile",
    title: "Профиль",
    description: "Данные клиента, заказы, адреса и обращения в поддержку.",
  },
  {
    key: "faq",
    title: "FAQ",
    description: "Страница частых вопросов, разделы, ответы и дополнительные блоки.",
  },
];

export const moduleLibrary: ModuleDefinition[] = [
  {
    type: "hero",
    title: "Hero",
    description: "Главный первый экран. Пока использует текущий дизайн сайта.",
    pageKeys: ["home"],
    defaultSettings: { title: "", subtitle: "", buttonText: "", buttonHref: "" },
  },
  {
    type: "benefits",
    title: "Преимущества",
    description: "Редактируемый блок преимуществ магазина.",
    pageKeys: ["home"],
    defaultSettings: {
      title: "Преимущества",
      subtitle: "Почему выбирают Neontech",
      style: "cards",
      source: "library",
      limit: 6,
    },
  },
  {
    type: "category-grid",
    title: "Категории",
    description: "Сетка категорий из БД с фото категории.",
    pageKeys: ["home", "catalog"],
    defaultSettings: {
      title: "Выберите категорию",
      subtitle: "Выберите направление и найдите свой идеальный гаджет",
      limit: 12,
      showButton: true,
      buttonText: "Смотреть все категории",
      buttonHref: "/catalog",
    },
  },
  {
    type: "popular-products",
    title: "Популярные товары",
    description: "Карусель товаров с флагом “Популярный”.",
    pageKeys: ["home", "catalog"],
    defaultSettings: {
      title: "Популярные товары",
      subtitle: "Выберите модель — конфигурацию подберёте на странице товара.",
      limit: 12,
      showButton: true,
      buttonText: "Смотреть все товары",
      buttonHref: "/catalog?popular=1",
      filter: "popular",
    },
  },
  {
    type: "new-arrivals",
    title: "Новинки",
    description: "Баннерный блок новинок с отдельным promo-фото.",
    pageKeys: ["home", "catalog", "new"],
    defaultSettings: {
      title: "Новинки",
      subtitle: "Техника, которая только появилась",
      limit: 3,
      showButton: false,
      buttonText: "Смотреть новинки",
      buttonHref: "/catalog?new=1",
    },
  },
  {
    type: "support",
    title: "Поддержка",
    description: "Блок помощи и сервиса.",
    pageKeys: ["home", "new", "product", "cart", "profile"],
    defaultSettings: { title: "Сервис и поддержка", subtitle: "Поможем с выбором и заказом." },
  },
  {
    type: "promo-banner",
    title: "Баннер",
    description: "Редактируемый баннер с текстом, кнопкой, изображением и стилем.",
    pageKeys: ["home", "catalog", "new", "product", "cart", "profile"],
    defaultSettings: {
      bannerId: "",
      label: "Промо",
      title: "Новый баннер",
      subtitle: "Добавьте текст, ссылку и изображение.",
      image: "",
      buttonText: "Подробнее",
      buttonHref: "/catalog",
      tone: "blue",
      layout: "split",
      height: 320,
      imageFit: "contain",
      imageSide: "right",
    },
  },
  {
    type: "text-image",
    title: "Текст + картинка",
    description: "Apple-style секция с крупным текстом и изображением.",
    pageKeys: ["home", "catalog", "new", "product"],
    defaultSettings: {
      title: "Заголовок секции",
      subtitle: "Описание секции можно менять без кода.",
      image: "",
      imageSide: "right",
      tone: "dark",
    },
  },
  {
    type: "product-carousel",
    title: "Карусель товаров",
    description: "Гибкая карусель товаров: популярные, новинки или все товары.",
    pageKeys: ["home", "catalog", "new", "product"],
    defaultSettings: {
      title: "Товары",
      subtitle: "Подборка из каталога",
      filter: "all",
      limit: 12,
      showButton: true,
      buttonText: "Открыть каталог",
      buttonHref: "/catalog",
    },
  },
  {
    type: "catalog-header",
    title: "Заголовок каталога",
    description: "Верхний текст и SEO-заголовок каталога.",
    pageKeys: ["catalog"],
    defaultSettings: { title: "Каталог", subtitle: "Выберите категорию, модель и конфигурацию." },
  },
  {
    type: "catalog-filters",
    title: "Фильтры каталога",
    description: "Фильтры, сортировка и параметры каталога.",
    pageKeys: ["catalog"],
    defaultSettings: { title: "Фильтры", showFilters: true, showSort: true },
  },
  {
    type: "catalog-grid",
    title: "Сетка товаров",
    description: "Основная сетка карточек каталога.",
    pageKeys: ["catalog"],
    defaultSettings: { title: "Товары", columns: 4, limit: 24 },
  },
  {
    type: "catalog-empty",
    title: "Пустое состояние",
    description: "Что показывать, если товаров нет.",
    pageKeys: ["catalog"],
    defaultSettings: { title: "Ничего не найдено", subtitle: "Попробуйте изменить фильтры." },
  },
  {
    type: "product-gallery",
    title: "Галерея товара",
    description: "Фото и миниатюры товара.",
    pageKeys: ["product"],
    defaultSettings: { title: "Галерея", ratio: "3:4" },
  },
  {
    type: "product-info",
    title: "Информация о товаре",
    description: "Название, цена, параметры, кнопки покупки.",
    pageKeys: ["product"],
    defaultSettings: { title: "Информация", showBrand: true, showSku: true },
  },
  {
    type: "product-description",
    title: "Описание товара",
    description: "Apple-style описание из карточки товара.",
    pageKeys: ["product"],
    defaultSettings: { title: "Описание", showDescriptionBlocks: true },
  },
  {
    type: "related-products",
    title: "Похожие товары",
    description: "Карусель похожих товаров.",
    pageKeys: ["product"],
    defaultSettings: { title: "Похожие товары", limit: 8 },
  },
  {
    type: "cart-items",
    title: "Товары в корзине",
    description: "Список позиций в корзине.",
    pageKeys: ["cart"],
    defaultSettings: { title: "Корзина" },
  },
  {
    type: "delivery-methods",
    title: "Способы получения",
    description: "Курьерская доставка и самовывоз из настроек.",
    pageKeys: ["cart"],
    defaultSettings: { title: "Способ получения" },
  },
  {
    type: "order-summary",
    title: "Итог заказа",
    description: "Правая карточка с итоговой суммой.",
    pageKeys: ["cart"],
    defaultSettings: { title: "Итого" },
  },
  {
    type: "profile-overview",
    title: "Данные клиента",
    description: "Основные данные профиля.",
    pageKeys: ["profile"],
    defaultSettings: { title: "Профиль" },
  },
  {
    type: "profile-orders",
    title: "Заказы клиента",
    description: "История заказов клиента.",
    pageKeys: ["profile"],
    defaultSettings: { title: "Заказы" },
  },
  {
    type: "profile-addresses",
    title: "Адреса клиента",
    description: "Адреса доставки и самовывоза.",
    pageKeys: ["profile"],
    defaultSettings: { title: "Адреса" },
  },
  {
    type: "profile-support",
    title: "Обращения клиента",
    description: "История обращений в поддержку.",
    pageKeys: ["profile"],
    defaultSettings: { title: "Поддержка" },
  },
  {
    type: "faq-header",
    title: "Заголовок FAQ",
    description: "Верхний блок страницы FAQ: заголовок, описание и кнопки.",
    pageKeys: ["faq"],
    defaultSettings: {
      title: "Частые вопросы",
      subtitle: "Коротко объясняем, как работает выбор техники, корзина, доставка, оплата и связь с менеджером.",
      showSupportButton: true,
      supportButtonText: "Написать в поддержку",
      supportButtonHref: "/help",
      showCatalogButton: true,
      catalogButtonText: "Перейти в каталог",
      catalogButtonHref: "/catalog",
    },
  },
  {
    type: "faq-content",
    title: "Разделы и вопросы",
    description: "Основной блок FAQ с разделами, вопросами, ответами и изображениями.",
    pageKeys: ["faq"],
    defaultSettings: {
      title: "Разделы FAQ",
      showImages: true,
      showBenefits: true,
      layout: "tabs",
    },
  },
];

export const defaultPageBlocks: Record<PageKey, Array<Omit<SitePageBlock, "id" | "createdAt" | "updatedAt">>> = {
  home: [
    makeDefaultBlock("home", "hero", 10),
    makeDefaultBlock("home", "benefits", 20),
    makeDefaultBlock("home", "category-grid", 30),
    makeDefaultBlock("home", "popular-products", 40),
    makeDefaultBlock("home", "new-arrivals", 50),
    makeDefaultBlock("home", "support", 60),
  ],
  catalog: [
    makeDefaultBlock("catalog", "catalog-header", 10),
    makeDefaultBlock("catalog", "category-grid", 20),
    makeDefaultBlock("catalog", "catalog-filters", 30),
    makeDefaultBlock("catalog", "catalog-grid", 40),
    makeDefaultBlock("catalog", "catalog-empty", 50),
  ],
  new: [
    makeDefaultBlock("new", "new-arrivals", 10),
    makeDefaultBlock("new", "promo-banner", 20),
    makeDefaultBlock("new", "support", 30),
  ],
  product: [
    makeDefaultBlock("product", "product-gallery", 10),
    makeDefaultBlock("product", "product-info", 20),
    makeDefaultBlock("product", "product-description", 30),
    makeDefaultBlock("product", "related-products", 40),
  ],
  cart: [
    makeDefaultBlock("cart", "cart-items", 10),
    makeDefaultBlock("cart", "delivery-methods", 20),
    makeDefaultBlock("cart", "order-summary", 30),
  ],
  profile: [
    makeDefaultBlock("profile", "profile-overview", 10),
    makeDefaultBlock("profile", "profile-orders", 20),
    makeDefaultBlock("profile", "profile-addresses", 30),
    makeDefaultBlock("profile", "profile-support", 40),
  ],
  faq: [
    makeDefaultBlock("faq", "faq-header", 10),
    makeDefaultBlock("faq", "faq-content", 20),
  ],
};

function makeDefaultBlock(pageKey: PageKey, type: PageBlockType, sortOrder: number) {
  const definition = getModuleDefinition(type);

  return {
    pageKey,
    type,
    title: definition?.title ?? type,
    description: definition?.description ?? "",
    enabled: true,
    sortOrder,
    settings: definition?.defaultSettings ?? {},
  };
}

export function getModuleDefinition(type: PageBlockType | string) {
  return moduleLibrary.find((item) => item.type === type);
}

export function isPageKey(value: unknown): value is PageKey {
  return builderPages.some((page) => page.key === value);
}

export function isPageBlockType(value: unknown): value is PageBlockType {
  return moduleLibrary.some((module) => module.type === value);
}

function asSettings(value: Prisma.JsonValue | null | undefined): PageBlockSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      return (
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean" ||
        item === null
      );
    })
  ) as PageBlockSettings;
}

function toBlock(block: {
  id: string;
  pageKey: string;
  type: string;
  title: string;
  description: string;
  enabled: boolean;
  sortOrder: number;
  settings: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): SitePageBlock {
  const pageKey = isPageKey(block.pageKey) ? block.pageKey : "home";
  const type = isPageBlockType(block.type) ? block.type : "promo-banner";
  const definition = getModuleDefinition(type);

  return {
    id: block.id,
    pageKey,
    type,
    title: block.title || definition?.title || type,
    description: block.description || definition?.description || "",
    enabled: block.enabled,
    sortOrder: block.sortOrder,
    settings: {
      ...(definition?.defaultSettings ?? {}),
      ...asSettings(block.settings),
    },
    createdAt: block.createdAt.toISOString(),
    updatedAt: block.updatedAt.toISOString(),
  };
}

export async function ensureDefaultPageBlocks(pageKey?: PageKey) {
  const pages = pageKey ? [pageKey] : builderPages.map((page) => page.key);

  for (const key of pages) {
    const count = await prisma.pageBlock.count({ where: { pageKey: key } });

    if (count > 0) {
      continue;
    }

    await prisma.pageBlock.createMany({
      data: defaultPageBlocks[key].map((block) => ({
        pageKey: block.pageKey,
        type: block.type,
        title: block.title,
        description: block.description,
        enabled: block.enabled,
        sortOrder: block.sortOrder,
        settings: block.settings as Prisma.InputJsonValue,
      })),
    });
  }
}

export async function getPageBlocks(pageKey: PageKey) {
  await ensureDefaultPageBlocks(pageKey);

  const blocks = await prisma.pageBlock.findMany({
    where: { pageKey },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return blocks.map(toBlock);
}

export async function getPublicPageBlocks(pageKey: PageKey) {
  const blocks = await getPageBlocks(pageKey);
  return blocks.filter((block) => block.enabled);
}

export async function getPageBuilderState(): Promise<PageBuilderState> {
  await ensureDefaultPageBlocks();

  const rows = await prisma.pageBlock.findMany({
    orderBy: [{ pageKey: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const blocks = builderPages.reduce((acc, page) => {
    acc[page.key] = [];
    return acc;
  }, {} as Record<PageKey, SitePageBlock[]>);

  for (const row of rows) {
    const block = toBlock(row);
    blocks[block.pageKey].push(block);
  }

  return {
    pages: builderPages,
    modules: moduleLibrary,
    blocks,
  };
}

export async function createPageBlock(input: { pageKey: PageKey; type: PageBlockType }) {
  const definition = getModuleDefinition(input.type);

  if (!definition || !definition.pageKeys.includes(input.pageKey)) {
    throw new Error("Этот модуль нельзя добавить на выбранную страницу.");
  }

  const lastBlock = await prisma.pageBlock.findFirst({
    where: { pageKey: input.pageKey },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const block = await prisma.pageBlock.create({
    data: {
      pageKey: input.pageKey,
      type: input.type,
      title: definition.title,
      description: definition.description,
      enabled: true,
      sortOrder: (lastBlock?.sortOrder ?? 0) + 10,
      settings: definition.defaultSettings as Prisma.InputJsonValue,
    },
  });

  return toBlock(block);
}

export async function updatePageBlock(
  id: string,
  patch: Partial<Pick<SitePageBlock, "title" | "description" | "enabled" | "sortOrder" | "settings" | "type">>
) {
  const current = await prisma.pageBlock.findUnique({ where: { id } });

  if (!current) {
    throw new Error("Модуль не найден.");
  }

  const nextType = patch.type && isPageBlockType(patch.type) ? patch.type : undefined;
  const definition = nextType ? getModuleDefinition(nextType) : null;

  if (definition && !definition.pageKeys.includes(current.pageKey as PageKey)) {
    throw new Error("Этот модуль нельзя использовать на выбранной странице.");
  }

  const settings = {
    ...(definition?.defaultSettings ?? asSettings(current.settings)),
    ...(patch.settings ?? {}),
  };

  const updated = await prisma.pageBlock.update({
    where: { id },
    data: {
      title: patch.title,
      description: patch.description,
      enabled: patch.enabled,
      sortOrder: patch.sortOrder,
      type: nextType,
      settings: settings as Prisma.InputJsonValue,
    },
  });

  return toBlock(updated);
}

export async function movePageBlock(id: string, direction: "up" | "down") {
  const current = await prisma.pageBlock.findUnique({ where: { id } });

  if (!current) {
    throw new Error("Модуль не найден.");
  }

  const neighbor = await prisma.pageBlock.findFirst({
    where: {
      pageKey: current.pageKey,
      sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });

  if (!neighbor) {
    return toBlock(current);
  }

  await prisma.$transaction([
    prisma.pageBlock.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.pageBlock.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
  ]);

  const updated = await prisma.pageBlock.findUniqueOrThrow({ where: { id } });
  return toBlock(updated);
}

export async function deletePageBlock(id: string) {
  await prisma.pageBlock.delete({ where: { id } });
}
