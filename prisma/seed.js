/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function cleanEnvValue(value, fallback) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    return fallback;
  }

  return normalized.replace(/^["\'`]+|["\'`]+$/g, "").trim() || fallback;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");

  return `${salt}:${hash}`;
}

const categories = [
  { slug: "smartphones", name: "Смартфоны", sortOrder: 10 },
  { slug: "laptops", name: "Ноутбуки", sortOrder: 20 },
  { slug: "tablets", name: "Планшеты", sortOrder: 30 },
  { slug: "headphones", name: "Наушники", sortOrder: 40 },
  { slug: "watches", name: "Часы", sortOrder: 50 },
  { slug: "accessories", name: "Аксессуары", sortOrder: 60 },
  { slug: "home", name: "Для дома", sortOrder: 70 },
  { slug: "vacuums", name: "Пылесосы", sortOrder: 80 },
  { slug: "beauty", name: "Фены и стайлеры", sortOrder: 90 },
  { slug: "monitors", name: "Мониторы", sortOrder: 100 },
  { slug: "gaming", name: "Игровая техника", sortOrder: 110 },
  { slug: "tv", name: "ТВ и мультимедиа", sortOrder: 120 },
];


const defaultPageBlocks = {
  home: [
    ["hero", "Hero", 10, { title: "", subtitle: "" }],
    ["benefits", "Преимущества", 20, { title: "Преимущества", subtitle: "Почему выбирают Neontech", source: "library", limit: 6, style: "cards" }],
    ["category-grid", "Категории", 30, { title: "Выберите категорию", subtitle: "Выберите направление и найдите свой идеальный гаджет", limit: 12, showButton: true, buttonText: "Смотреть все категории →", buttonHref: "/catalog" }],
    ["popular-products", "Популярные товары", 40, { title: "Популярные товары", subtitle: "Выберите модель — конфигурацию подберёте на странице товара.", limit: 12, showButton: true, buttonText: "Смотреть все товары →", buttonHref: "/catalog?popular=1", filter: "popular" }],
    ["new-arrivals", "Новинки", 50, { title: "Новинки", subtitle: "Техника, которая только появилась", limit: 3 }],
    ["support", "Поддержка", 60, { title: "Сервис и поддержка" }],
  ],
  catalog: [
    ["catalog-header", "Заголовок каталога", 10, { title: "Каталог", subtitle: "Выберите категорию, модель и конфигурацию." }],
    ["category-grid", "Категории", 20, { title: "Категории", limit: 12 }],
    ["catalog-filters", "Фильтры каталога", 30, { showFilters: true, showSort: true }],
    ["catalog-grid", "Сетка товаров", 40, { columns: 4, limit: 24 }],
    ["catalog-empty", "Пустое состояние", 50, { title: "Ничего не найдено" }],
  ],
  product: [
    ["product-gallery", "Галерея товара", 10, { ratio: "3:4" }],
    ["product-info", "Информация о товаре", 20, { showBrand: true, showSku: true }],
    ["product-description", "Описание товара", 30, { showDescriptionBlocks: true }],
    ["related-products", "Похожие товары", 40, { limit: 8 }],
  ],
  cart: [
    ["cart-items", "Товары в корзине", 10, {}],
    ["delivery-methods", "Способы получения", 20, {}],
    ["order-summary", "Итог заказа", 30, {}],
  ],
  profile: [
    ["profile-overview", "Данные клиента", 10, {}],
    ["profile-orders", "Заказы клиента", 20, {}],
    ["profile-addresses", "Адреса клиента", 30, {}],
    ["profile-support", "Обращения клиента", 40, {}],
  ],
};

async function seedPageBlocks() {
  for (const [pageKey, blocks] of Object.entries(defaultPageBlocks)) {
    const count = await prisma.pageBlock.count({ where: { pageKey } });

    if (count > 0) {
      continue;
    }

    await prisma.pageBlock.createMany({
      data: blocks.map(([type, title, sortOrder, settings]) => ({
        pageKey,
        type,
        title,
        description: "",
        enabled: true,
        sortOrder,
        settings,
      })),
    });
  }
}


async function seedSiteContent() {
  const benefitsCount = await prisma.siteBenefit.count();

  if (benefitsCount === 0) {
    await prisma.siteBenefit.createMany({
      data: [
        { title: "Только оригинал", description: "Работаем с проверенными поставщиками.", icon: "✓", sortOrder: 10 },
        { title: "Гарантия и сервис", description: "Поможем после покупки и решим вопросы.", icon: "✓", sortOrder: 20 },
        { title: "Быстрая доставка", description: "По Москве — быстро, по России — надёжно.", icon: "✓", sortOrder: 30 },
        { title: "Безопасная оплата", description: "Удобные способы оплаты и подтверждение заказа.", icon: "✓", sortOrder: 40 },
        { title: "Поддержка 24/7", description: "Подскажем с выбором и конфигурацией.", icon: "✓", sortOrder: 50 },
      ],
    });
  }

  const bannersCount = await prisma.siteBanner.count();

  if (bannersCount === 0) {
    await prisma.siteBanner.create({
      data: {
        adminTitle: "Основной промо-баннер",
        label: "Промо",
        title: "Соберите витрину без кода",
        subtitle: "Создавайте баннеры в редакторе и подключайте их к модулям главной.",
        buttonText: "В каталог →",
        buttonHref: "/catalog",
        placement: "home",
        tone: "blue",
        layout: "split",
        sortOrder: 10,
      },
    });
  }
}

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const adminLogin = cleanEnvValue(process.env.ADMIN_LOGIN, "admin");
  const adminPassword = cleanEnvValue(process.env.ADMIN_PASSWORD, "netizen-admin");
  const adminName = cleanEnvValue(process.env.ADMIN_NAME, "Администратор");

  await prisma.adminUser.upsert({
    where: { login: adminLogin },
    update: {
      name: adminName,
      role: "owner",
      roles: ["owner"],
      permissions: ["all"],
      passwordHash: hashPassword(adminPassword),
      isActive: true,
    },
    create: {
      login: adminLogin,
      name: adminName,
      role: "owner",
      roles: ["owner"],
      permissions: ["all"],
      passwordHash: hashPassword(adminPassword),
      isActive: true,
    },
  });

  await seedPageBlocks();
  await seedSiteContent();

  console.log(`Seed complete: categories, admin account, page builder blocks and content library are ready. Admin login: ${adminLogin}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
