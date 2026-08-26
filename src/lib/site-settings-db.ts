import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { publicImageUrl } from "@/lib/public-image-urls";

export type SiteBrandingSettings = {
  storeName: string;
  logoLight: string;
  logoDark: string;
  mobileLogo: string;
  favicon: string;
  navIconHome: string;
  navIconCatalog: string;
  navIconNew: string;
  navIconSupport: string;
  navIconCart: string;
  defaultTheme: "system" | "light" | "dark";
  accentColor: string;
  primaryColor: string;
};

export type SiteAddressSettings = {
  id: string;
  title: string;
  type: "showroom" | "pickup" | "office";
  city: string;
  address: string;
  metro: string;
  workingHours: string;
  phone: string;
  active: boolean;
  isMain: boolean;
};

export type SiteContactsSettings = {
  phone: string;
  phoneText: string;
  email: string;
  emailText: string;
  telegram: string;
  telegramText: string;
  whatsapp: string;
  city: string;
  workingHours: string;
  address: string;
  addresses: SiteAddressSettings[];
};

export type HomeBlockSettings = {
  id: string;
  title: string;
  type: string;
  description: string;
  enabled: boolean;
  order: number;
};

export type SiteCatalogSettings = {
  showFilters: boolean;
  showBrandRows: boolean;
  showLoadMore: boolean;
  showCategorySeoText: boolean;
};

export type SiteProductPageSettings = {
  showRelated: boolean;
  showAccessories: boolean;
  showSpecs: boolean;
  showSeoBlock: boolean;
  showDeliveryWarranty: boolean;
  showProductFaq: boolean;
};

export type SiteSeoSettings = {
  homeTitle: string;
  homeDescription: string;
  keywords: string;
};

export type SiteEditorSettings = {
  branding: SiteBrandingSettings;
  contacts: SiteContactsSettings;
  homeBlocks: HomeBlockSettings[];
  catalog: SiteCatalogSettings;
  productPage: SiteProductPageSettings;
  seo: SiteSeoSettings;
};

export type DeliverySettings = {
  key: string;
  title: string;
  type: "courier" | "pickup";
  addressId: string;
  crmField: string;
  text: string;
  active: boolean;
};

export type NotificationSettings = {
  key: string;
  title: string;
  text: string;
  channel: string;
  active: boolean;
};

export type IntegrationSettings = {
  key: string;
  name: string;
  status: string;
  access: string;
  text: string;
  token: string;
  webhookUrl: string;
};

export type SystemSettings = {
  deliveries: DeliverySettings[];
  notifications: NotificationSettings[];
  integrations: IntegrationSettings[];
  lowStockLimit: number;
  orderPrefix: string;
};

const defaultHomeBlocks: HomeBlockSettings[] = [
  {
    id: "hero",
    title: "Hero-блок",
    type: "Главный экран",
    description: "Заголовок, подзаголовок, кнопки и главный баннер.",
    enabled: true,
    order: 1,
  },
  {
    id: "benefits",
    title: "Преимущества",
    type: "Информационный блок",
    description: "Оригинал, гарантия, доставка, оплата и поддержка.",
    enabled: true,
    order: 2,
  },
  {
    id: "categories",
    title: "Категории",
    type: "Сетка категорий",
    description: "Основные разделы каталога на главной странице.",
    enabled: true,
    order: 3,
  },
  {
    id: "popular-products",
    title: "Популярные товары",
    type: "Карусель товаров",
    description: "Товары с флагом “Популярный товар”.",
    enabled: true,
    order: 4,
  },
  {
    id: "new-arrivals",
    title: "Новинки",
    type: "Промо-блок",
    description: "Товары с флагом “Новинка” и отдельной promo-фотографией.",
    enabled: true,
    order: 5,
  },
  {
    id: "support",
    title: "Сервис и поддержка",
    type: "FAQ / поддержка",
    description: "FAQ, карточки сервиса и помощь клиенту.",
    enabled: true,
    order: 6,
  },
];

export const defaultSiteEditorSettings: SiteEditorSettings = {
  branding: {
    storeName: "Neontech",
    logoLight: "/logo-light.webp",
    logoDark: "/logo-dark.webp",
    mobileLogo: "",
    favicon: "/favicon.ico",
    navIconHome: "⌂",
    navIconCatalog: "▦",
    navIconNew: "✦",
    navIconSupport: "?",
    navIconCart: "🛒",
    defaultTheme: "system",
    accentColor: "#2563eb",
    primaryColor: "#020814",
  },
  contacts: {
    phone: "8 (800) 123-45-67",
    phoneText: "Ежедневно с 10:00 до 21:00",
    email: "info@netizen.store",
    emailText: "Ответим на почту",
    telegram: "@netizen_store",
    telegramText: "Мы в Telegram",
    whatsapp: "+7 999 000-00-00",
    city: "Москва",
    workingHours: "Ежедневно, 10:00–21:00",
    address: "Москва, адрес будет указан позже",
    addresses: [
      {
        id: "main-showroom",
        title: "Основной шоурум",
        type: "showroom",
        city: "Москва",
        address: "Москва, адрес будет указан позже",
        metro: "",
        workingHours: "Ежедневно, 10:00–21:00",
        phone: "8 (800) 123-45-67",
        active: true,
        isMain: true,
      },
    ],
  },
  homeBlocks: defaultHomeBlocks,
  catalog: {
    showFilters: true,
    showBrandRows: true,
    showLoadMore: true,
    showCategorySeoText: false,
  },
  productPage: {
    showRelated: true,
    showAccessories: true,
    showSpecs: true,
    showSeoBlock: true,
    showDeliveryWarranty: true,
    showProductFaq: false,
  },
  seo: {
    homeTitle: "Neontech — магазин техники",
    homeDescription: "Оригинальная техника, быстрая доставка и поддержка при выборе.",
    keywords: "техника, смартфоны, ноутбуки, гаджеты, Neontech",
  },
};

export const defaultSystemSettings: SystemSettings = {
  deliveries: [
    {
      key: "courier",
      title: "Курьерская доставка",
      type: "courier",
      addressId: "",
      crmField: "delivery.type = courier",
      text: "Клиент указывает город и адрес, CRM получает delivery.address.",
      active: true,
    },
    {
      key: "pickup_main",
      title: "Самовывоз из магазина",
      type: "pickup",
      addressId: "main-showroom",
      crmField: "delivery.type = pickup; delivery.addressId = main-showroom",
      text: "Клиент выбирает адрес магазина или ПВЗ из списка адресов редактора сайта.",
      active: true,
    },
  ],
  notifications: [
    {
      key: "new_orders",
      title: "Новые заявки",
      text: "Уведомлять менеджеров о новых заявках с сайта.",
      channel: "Telegram / админка",
      active: true,
    },
    {
      key: "new_support",
      title: "Новые обращения",
      text: "Уведомлять поддержку о новых сообщениях клиентов.",
      channel: "Telegram / админка",
      active: true,
    },
    {
      key: "integration_errors",
      title: "Ошибки интеграций",
      text: "Сообщать главному админу об ошибках синхронизации.",
      channel: "Telegram",
      active: true,
    },
    {
      key: "low_stock",
      title: "Низкий остаток",
      text: "Уведомлять, если позиция заканчивается на складе.",
      channel: "Админка",
      active: false,
    },
  ],
  integrations: [
    {
      key: "moysklad",
      name: "МойСклад",
      status: "Не подключено",
      access: "Главный админ / Технический админ",
      text: "Остатки, склад, документы и синхронизация позиций по SKU.",
      token: "",
      webhookUrl: "",
    },
    {
      key: "crm",
      name: "CRM",
      status: "Планируется",
      access: "Главный админ / Технический админ",
      text: "Передача заявок, клиентов, доставки и статусов заказов.",
      token: "",
      webhookUrl: "",
    },
    {
      key: "telegram",
      name: "Telegram",
      status: "Не подключено",
      access: "Главный админ / Менеджер",
      text: "Уведомления о новых заявках, обращениях и ошибках.",
      token: "",
      webhookUrl: "",
    },
  ],
  lowStockLimit: 3,
  orderPrefix: "NZ",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeBranding(
  value: unknown,
  exposePublicImages = true,
  imageVersion?: string | number,
): SiteBrandingSettings {
  const raw = isRecord(value) ? value : {};
  const defaultTheme = stringValue(raw.defaultTheme, defaultSiteEditorSettings.branding.defaultTheme);

  const imageValue = (field: keyof SiteBrandingSettings) => {
    const fallback = defaultSiteEditorSettings.branding[field];

    if (typeof fallback !== "string") {
      return "";
    }

    const value = stringValue(raw[field], fallback);
    return exposePublicImages
      ? publicImageUrl("setting", "branding", field, value, undefined, imageVersion)
      : value;
  };

  return {
    storeName: stringValue(raw.storeName, defaultSiteEditorSettings.branding.storeName),
    logoLight: imageValue("logoLight"),
    logoDark: imageValue("logoDark"),
    mobileLogo: imageValue("mobileLogo"),
    favicon: imageValue("favicon"),
    navIconHome: imageValue("navIconHome"),
    navIconCatalog: imageValue("navIconCatalog"),
    navIconNew: imageValue("navIconNew"),
    navIconSupport: imageValue("navIconSupport"),
    navIconCart: imageValue("navIconCart"),
    defaultTheme: defaultTheme === "light" || defaultTheme === "dark" ? defaultTheme : "system",
    accentColor: stringValue(raw.accentColor, defaultSiteEditorSettings.branding.accentColor),
    primaryColor: stringValue(raw.primaryColor, defaultSiteEditorSettings.branding.primaryColor),
  };
}


function normalizeAddresses(value: unknown): SiteAddressSettings[] {
  const defaults = defaultSiteEditorSettings.contacts.addresses;
  const source = Array.isArray(value) ? value : defaults;

  const addresses: SiteAddressSettings[] = source
    .map((item, index): SiteAddressSettings => {
      const raw = isRecord(item) ? item : {};
      const fallback = defaults[index] ?? defaults[0];
      const rawType = stringValue(raw.type, fallback.type);
      const type: SiteAddressSettings["type"] =
        rawType === "pickup" || rawType === "office" || rawType === "showroom"
          ? rawType
          : "showroom";

      return {
        id: stringValue(raw.id, fallback.id || `address-${index + 1}`),
        title: stringValue(raw.title, fallback.title),
        type,
        city: stringValue(raw.city, fallback.city),
        address: stringValue(raw.address, fallback.address),
        metro: stringValue(raw.metro, fallback.metro),
        workingHours: stringValue(raw.workingHours, fallback.workingHours),
        phone: stringValue(raw.phone, fallback.phone),
        active: booleanValue(raw.active, fallback.active),
        isMain: booleanValue(raw.isMain, fallback.isMain),
      };
    })
    .filter((item) => item.title || item.address);

  if (!addresses.length) {
    return defaults;
  }

  if (!addresses.some((item) => item.isMain)) {
    addresses[0] = { ...addresses[0], isMain: true };
  }

  return addresses.map((item, index): SiteAddressSettings => ({
    ...item,
    isMain: item.isMain && addresses.findIndex((address) => address.isMain) === index,
  }));
}

function normalizeContacts(value: unknown): SiteContactsSettings {
  const raw = isRecord(value) ? value : {};
  const defaults = defaultSiteEditorSettings.contacts;

  return {
    phone: stringValue(raw.phone, defaults.phone),
    phoneText: stringValue(raw.phoneText, defaults.phoneText),
    email: stringValue(raw.email, defaults.email),
    emailText: stringValue(raw.emailText, defaults.emailText),
    telegram: stringValue(raw.telegram, defaults.telegram),
    telegramText: stringValue(raw.telegramText, defaults.telegramText),
    whatsapp: stringValue(raw.whatsapp, defaults.whatsapp),
    city: stringValue(raw.city, defaults.city),
    workingHours: stringValue(raw.workingHours, defaults.workingHours),
    address: stringValue(raw.address, defaults.address),
    addresses: normalizeAddresses(raw.addresses),
  };
}

function normalizeHomeBlocks(value: unknown): HomeBlockSettings[] {
  const source = Array.isArray(value) ? value : [];
  const byId = new Map<string, Record<string, unknown>>();

  for (const item of source) {
    if (isRecord(item) && typeof item.id === "string") {
      byId.set(item.id, item);
    }
  }

  return defaultHomeBlocks
    .map((block) => {
      const raw = byId.get(block.id);

      return {
        ...block,
        title: stringValue(raw?.title, block.title),
        type: stringValue(raw?.type, block.type),
        description: stringValue(raw?.description, block.description),
        enabled: booleanValue(raw?.enabled, block.enabled),
        order: numberValue(raw?.order, block.order),
      };
    })
    .sort((a, b) => a.order - b.order);
}

function normalizeCatalog(value: unknown): SiteCatalogSettings {
  const raw = isRecord(value) ? value : {};
  const defaults = defaultSiteEditorSettings.catalog;

  return {
    showFilters: booleanValue(raw.showFilters, defaults.showFilters),
    showBrandRows: booleanValue(raw.showBrandRows, defaults.showBrandRows),
    showLoadMore: booleanValue(raw.showLoadMore, defaults.showLoadMore),
    showCategorySeoText: booleanValue(raw.showCategorySeoText, defaults.showCategorySeoText),
  };
}

function normalizeProductPage(value: unknown): SiteProductPageSettings {
  const raw = isRecord(value) ? value : {};
  const defaults = defaultSiteEditorSettings.productPage;

  return {
    showRelated: booleanValue(raw.showRelated, defaults.showRelated),
    showAccessories: booleanValue(raw.showAccessories, defaults.showAccessories),
    showSpecs: booleanValue(raw.showSpecs, defaults.showSpecs),
    showSeoBlock: booleanValue(raw.showSeoBlock, defaults.showSeoBlock),
    showDeliveryWarranty: booleanValue(raw.showDeliveryWarranty, defaults.showDeliveryWarranty),
    showProductFaq: booleanValue(raw.showProductFaq, defaults.showProductFaq),
  };
}

function normalizeSeo(value: unknown): SiteSeoSettings {
  const raw = isRecord(value) ? value : {};
  const defaults = defaultSiteEditorSettings.seo;

  return {
    homeTitle: stringValue(raw.homeTitle, defaults.homeTitle),
    homeDescription: stringValue(raw.homeDescription, defaults.homeDescription),
    keywords: stringValue(raw.keywords, defaults.keywords),
  };
}

export function normalizeSiteEditorSettings(
  value: unknown,
  exposePublicImages = true,
  imageVersion?: string | number,
): SiteEditorSettings {
  const raw = isRecord(value) ? value : {};

  return {
    branding: normalizeBranding(raw.branding, exposePublicImages, imageVersion),
    contacts: normalizeContacts(raw.contacts),
    homeBlocks: normalizeHomeBlocks(raw.homeBlocks),
    catalog: normalizeCatalog(raw.catalog),
    productPage: normalizeProductPage(raw.productPage),
    seo: normalizeSeo(raw.seo),
  };
}

const brandingImageFields = [
  "logoLight",
  "logoDark",
  "mobileLogo",
  "favicon",
  "navIconHome",
  "navIconCatalog",
  "navIconNew",
  "navIconSupport",
  "navIconCart",
] as const;

type BrandingImageField = (typeof brandingImageFields)[number];

function isSettingPublicImageUrl(value: string, field?: BrandingImageField) {
  const cleanValue = value.trim();

  if (!cleanValue.startsWith("/api/public-image/setting/branding/")) {
    return false;
  }

  if (!field) {
    return true;
  }

  return cleanValue
    .split("?")[0]
    .endsWith(`/api/public-image/setting/branding/${encodeURIComponent(field)}`);
}

function navFallbackSvg(field: BrandingImageField) {
  const common =
    'fill="none" stroke="#2563eb" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round"';

  if (field === "navIconHome") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path ${common} d="M3.5 11.2 12 4l8.5 7.2"/><path ${common} d="M5.5 10.4V20h13v-9.6"/><path ${common} d="M9.5 20v-5h5v5"/></svg>`;
  }

  if (field === "navIconCatalog") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path ${common} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>`;
  }

  if (field === "navIconNew") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path ${common} d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3z"/></svg>`;
  }

  if (field === "navIconSupport") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle ${common} cx="12" cy="12" r="9"/><path ${common} d="M9.5 9a2.6 2.6 0 1 1 4.4 1.85c-1.05.95-1.9 1.55-1.9 3.15"/><path ${common} d="M12 18h.01"/></svg>`;
  }

  if (field === "navIconCart") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path ${common} d="M3 3h2.2l2.1 10.15a2 2 0 0 0 1.96 1.6h7.96a2 2 0 0 0 1.94-1.52L21 6.5H6.05"/><path ${common} stroke-width="1.8" d="M9 9.25h8.9M10 12h7.2"/><circle cx="9.25" cy="19.25" r="1.25" fill="#2563eb"/><circle cx="17.25" cy="19.25" r="1.25" fill="#2563eb"/></svg>`;
  }

  return "";
}

function svgDataUrl(svg: string) {
  return svg
    ? `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`
    : "";
}

function fallbackBrandingImage(field: BrandingImageField) {
  const navSvg = navFallbackSvg(field);

  if (navSvg) {
    return svgDataUrl(navSvg);
  }

  return defaultSiteEditorSettings.branding[field];
}

function mergeBrandingImagesForStorage(incoming: unknown, current: unknown) {
  const incomingSite = isRecord(incoming) ? incoming : {};
  const currentSite = isRecord(current) ? current : {};
  const incomingBranding = isRecord(incomingSite.branding)
    ? incomingSite.branding
    : {};
  const currentBranding = isRecord(currentSite.branding)
    ? currentSite.branding
    : {};
  const mergedBranding: Record<string, unknown> = { ...incomingBranding };

  for (const field of brandingImageFields) {
    const incomingValue =
      typeof incomingBranding[field] === "string"
        ? incomingBranding[field].trim()
        : "";
    const currentValue =
      typeof currentBranding[field] === "string"
        ? currentBranding[field].trim()
        : "";

    if (isSettingPublicImageUrl(incomingValue, field)) {
      if (currentValue && !isSettingPublicImageUrl(currentValue)) {
        mergedBranding[field] = currentValue;
      } else {
        mergedBranding[field] = fallbackBrandingImage(field);
      }

      continue;
    }

    mergedBranding[field] = incomingValue;
  }

  return {
    ...incomingSite,
    branding: mergedBranding,
  };
}

function normalizeDeliveries(value: unknown): DeliverySettings[] {
  const source = Array.isArray(value) ? value : defaultSystemSettings.deliveries;

  return source.map((item, index) => {
    const raw = isRecord(item) ? item : {};
    const fallback = defaultSystemSettings.deliveries[index] ?? defaultSystemSettings.deliveries[0];

    return {
      key: stringValue(raw.key, fallback.key),
      title: stringValue(raw.title, fallback.title),
      type: stringValue(raw.type, fallback.type) === "pickup" ? "pickup" : "courier",
      addressId: stringValue(raw.addressId, fallback.addressId),
      crmField: stringValue(raw.crmField, fallback.crmField),
      text: stringValue(raw.text, fallback.text),
      active: booleanValue(raw.active, fallback.active),
    };
  });
}

function normalizeNotifications(value: unknown): NotificationSettings[] {
  const source = Array.isArray(value) ? value : defaultSystemSettings.notifications;

  return source.map((item, index) => {
    const raw = isRecord(item) ? item : {};
    const fallback = defaultSystemSettings.notifications[index] ?? defaultSystemSettings.notifications[0];

    return {
      key: stringValue(raw.key, fallback.key),
      title: stringValue(raw.title, fallback.title),
      text: stringValue(raw.text, fallback.text),
      channel: stringValue(raw.channel, fallback.channel),
      active: booleanValue(raw.active, fallback.active),
    };
  });
}

function normalizeIntegrations(value: unknown): IntegrationSettings[] {
  const source = Array.isArray(value) ? value : defaultSystemSettings.integrations;

  return source.map((item, index) => {
    const raw = isRecord(item) ? item : {};
    const fallback = defaultSystemSettings.integrations[index] ?? defaultSystemSettings.integrations[0];

    return {
      key: stringValue(raw.key, fallback.key),
      name: stringValue(raw.name, fallback.name),
      status: stringValue(raw.status, fallback.status),
      access: stringValue(raw.access, fallback.access),
      text: stringValue(raw.text, fallback.text),
      token: stringValue(raw.token, ""),
      webhookUrl: stringValue(raw.webhookUrl, ""),
    };
  });
}

export function normalizeSystemSettings(value: unknown): SystemSettings {
  const raw = isRecord(value) ? value : {};

  return {
    deliveries: normalizeDeliveries(raw.deliveries),
    notifications: normalizeNotifications(raw.notifications),
    integrations: normalizeIntegrations(raw.integrations),
    lowStockLimit: numberValue(raw.lowStockLimit, defaultSystemSettings.lowStockLimit),
    orderPrefix: stringValue(raw.orderPrefix, defaultSystemSettings.orderPrefix),
  };
}

async function getSettingRecord(key: string) {
  return prisma.siteSetting.findUnique({ where: { key } });
}

async function getSettingValue(key: string) {
  return (await getSettingRecord(key))?.value;
}

async function upsertSettingValue(key: string, value: unknown) {
  return prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: value as Prisma.InputJsonValue },
    update: { value: value as Prisma.InputJsonValue },
  });
}

export async function getSiteEditorSettings() {
  const setting = await getSettingRecord("site");

  return normalizeSiteEditorSettings(
    setting?.value,
    true,
    setting?.updatedAt.getTime(),
  );
}

export async function saveSiteEditorSettings(value: unknown) {
  const currentSetting = await getSettingRecord("site");
  const mergedValue = mergeBrandingImagesForStorage(
    value,
    currentSetting?.value,
  );
  const settingsForStorage = normalizeSiteEditorSettings(mergedValue, false);
  const storedSetting = await upsertSettingValue("site", settingsForStorage);

  return normalizeSiteEditorSettings(
    storedSetting.value,
    true,
    storedSetting.updatedAt.getTime(),
  );
}

export async function getSystemSettings() {
  return normalizeSystemSettings(await getSettingValue("system"));
}

export async function saveSystemSettings(value: unknown) {
  const settings = normalizeSystemSettings(value);
  await upsertSettingValue("system", settings);
  return settings;
}
