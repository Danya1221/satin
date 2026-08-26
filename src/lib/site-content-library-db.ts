import { prisma } from "@/lib/db";
import { publicImageUrl } from "@/lib/public-image-urls";

export type SiteBanner = {
  id: string;
  adminTitle: string;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  secondaryButtonText: string;
  secondaryButtonHref: string;
  imageLight: string;
  imageDark: string;
  imageMobile: string;
  placement: string;
  tone: string;
  layout: string;
  titleSize: string;
  textSize: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SiteBenefit = {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: string;
  href: string;
  placement: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SiteContentLibrary = {
  banners: SiteBanner[];
  benefits: SiteBenefit[];
};

type BannerInput = Partial<Omit<SiteBanner, "id" | "createdAt" | "updatedAt">>;
type BenefitInput = Partial<Omit<SiteBenefit, "id" | "createdAt" | "updatedAt">>;

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanNumber(value: unknown, fallback = 100) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : fallback;
}

function cleanBoolean(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function toBanner(item: {
  id: string;
  adminTitle: string;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  secondaryButtonText: string;
  secondaryButtonHref: string;
  imageLight: string;
  imageDark: string;
  imageMobile: string;
  placement: string;
  tone: string;
  layout: string;
  titleSize: string;
  textSize: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): SiteBanner {
  return {
    ...item,
    imageLight: publicImageUrl(
      "banner",
      item.id,
      "imageLight",
      item.imageLight,
      undefined,
      item.updatedAt.getTime(),
    ),
    imageDark: publicImageUrl(
      "banner",
      item.id,
      "imageDark",
      item.imageDark,
      undefined,
      item.updatedAt.getTime(),
    ),
    imageMobile: publicImageUrl(
      "banner",
      item.id,
      "imageMobile",
      item.imageMobile,
      undefined,
      item.updatedAt.getTime(),
    ),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function toRawBenefit(item: {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: string;
  href: string;
  placement: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): SiteBenefit {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function toBenefit(item: {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: string;
  href: string;
  placement: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): SiteBenefit {
  return {
    ...item,
    image: publicImageUrl(
      "benefit",
      item.id,
      "image",
      item.image,
      undefined,
      item.updatedAt.getTime(),
    ),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getSiteBanners(options?: { activeOnly?: boolean }) {
  const banners = await prisma.siteBanner.findMany({
    where: options?.activeOnly ? { enabled: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return banners.map(toBanner);
}

export async function getSiteBenefits(options?: {
  activeOnly?: boolean;
  rawImages?: boolean;
  placement?: "store" | "product";
  fallbackPlacement?: "store" | "product";
}) {
  const where = {
    ...(options?.activeOnly ? { enabled: true } : {}),
    ...(options?.placement ? { placement: options.placement } : {}),
  };

  let benefits = await prisma.siteBenefit.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (benefits.length === 0 && options?.fallbackPlacement) {
    benefits = await prisma.siteBenefit.findMany({
      where: {
        ...(options.activeOnly ? { enabled: true } : {}),
        placement: options.fallbackPlacement,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  return benefits.map(options?.rawImages ? toRawBenefit : toBenefit);
}

export async function getSiteContentLibrary(options?: {
  activeOnly?: boolean;
  benefitPlacement?: "store" | "product";
}): Promise<SiteContentLibrary> {
  const [banners, benefits] = await Promise.all([
    getSiteBanners(options),
    getSiteBenefits({
      activeOnly: options?.activeOnly,
      placement: options?.benefitPlacement,
    }),
  ]);

  return { banners, benefits };
}

export async function createSiteBanner(input?: BannerInput) {
  const banner = await prisma.siteBanner.create({
    data: {
      adminTitle: cleanText(input?.adminTitle, "Новый баннер") || "Новый баннер",
      label: cleanText(input?.label, "Промо"),
      title: cleanText(input?.title, "Новый баннер") || "Новый баннер",
      subtitle: cleanText(input?.subtitle),
      description: cleanText(input?.description),
      buttonText: cleanText(input?.buttonText, "Подробнее"),
      buttonHref: cleanText(input?.buttonHref, "/catalog") || "/catalog",
      secondaryButtonText: cleanText(input?.secondaryButtonText, "Каталог"),
      secondaryButtonHref: cleanText(input?.secondaryButtonHref, "/catalog"),
      imageLight: cleanText(input?.imageLight),
      imageDark: cleanText(input?.imageDark),
      imageMobile: cleanText(input?.imageMobile),
      placement: cleanText(input?.placement, "manual") || "manual",
      tone: cleanText(input?.tone, "blue") || "blue",
      layout: cleanText(input?.layout, "split") || "split",
      titleSize: cleanText(input?.titleSize, "lg") || "lg",
      textSize: cleanText(input?.textSize, "md") || "md",
      enabled: cleanBoolean(input?.enabled, true),
      sortOrder: cleanNumber(input?.sortOrder, 100),
    },
  });

  return toBanner(banner);
}

export async function updateSiteBanner(id: string, input: BannerInput) {
  const banner = await prisma.siteBanner.update({
    where: { id },
    data: {
      ...(input.adminTitle !== undefined ? { adminTitle: cleanText(input.adminTitle, "Новый баннер") || "Новый баннер" } : {}),
      ...(input.label !== undefined ? { label: cleanText(input.label) } : {}),
      ...(input.title !== undefined ? { title: cleanText(input.title, "Новый баннер") || "Новый баннер" } : {}),
      ...(input.subtitle !== undefined ? { subtitle: cleanText(input.subtitle) } : {}),
      ...(input.description !== undefined ? { description: cleanText(input.description) } : {}),
      ...(input.buttonText !== undefined ? { buttonText: cleanText(input.buttonText) } : {}),
      ...(input.buttonHref !== undefined ? { buttonHref: cleanText(input.buttonHref, "/catalog") || "/catalog" } : {}),
      ...(input.secondaryButtonText !== undefined ? { secondaryButtonText: cleanText(input.secondaryButtonText) } : {}),
      ...(input.secondaryButtonHref !== undefined ? { secondaryButtonHref: cleanText(input.secondaryButtonHref) } : {}),
      ...(input.imageLight !== undefined ? { imageLight: cleanText(input.imageLight) } : {}),
      ...(input.imageDark !== undefined ? { imageDark: cleanText(input.imageDark) } : {}),
      ...(input.imageMobile !== undefined ? { imageMobile: cleanText(input.imageMobile) } : {}),
      ...(input.placement !== undefined ? { placement: cleanText(input.placement, "manual") || "manual" } : {}),
      ...(input.tone !== undefined ? { tone: cleanText(input.tone, "blue") || "blue" } : {}),
      ...(input.layout !== undefined ? { layout: cleanText(input.layout, "split") || "split" } : {}),
      ...(input.titleSize !== undefined ? { titleSize: cleanText(input.titleSize, "lg") || "lg" } : {}),
      ...(input.textSize !== undefined ? { textSize: cleanText(input.textSize, "md") || "md" } : {}),
      ...(input.enabled !== undefined ? { enabled: cleanBoolean(input.enabled) } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: cleanNumber(input.sortOrder) } : {}),
    },
  });

  return toBanner(banner);
}

export async function deleteSiteBanner(id: string) {
  await prisma.siteBanner.delete({ where: { id } });
}

export async function createSiteBenefit(input?: BenefitInput) {
  const benefit = await prisma.siteBenefit.create({
    data: {
      title: cleanText(input?.title, "Новое преимущество") || "Новое преимущество",
      description: cleanText(input?.description),
      icon: cleanText(input?.icon, "✓") || "✓",
      image: cleanText(input?.image),
      href: cleanText(input?.href),
      placement: input?.placement === "product" ? "product" : "store",
      enabled: cleanBoolean(input?.enabled, true),
      sortOrder: cleanNumber(input?.sortOrder, 100),
    },
  });

  return toRawBenefit(benefit);
}

export async function updateSiteBenefit(id: string, input: BenefitInput) {
  const benefit = await prisma.siteBenefit.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: cleanText(input.title, "Новое преимущество") || "Новое преимущество" } : {}),
      ...(input.description !== undefined ? { description: cleanText(input.description) } : {}),
      ...(input.icon !== undefined ? { icon: cleanText(input.icon, "✓") || "✓" } : {}),
      ...(input.image !== undefined &&
      !cleanText(input.image).startsWith(`/api/public-image/benefit/${id}/image`)
        ? { image: cleanText(input.image) }
        : {}),
      ...(input.href !== undefined ? { href: cleanText(input.href) } : {}),
      ...(input.placement !== undefined
        ? { placement: input.placement === "product" ? "product" : "store" }
        : {}),
      ...(input.enabled !== undefined ? { enabled: cleanBoolean(input.enabled) } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: cleanNumber(input.sortOrder) } : {}),
    },
  });

  return toRawBenefit(benefit);
}

export async function deleteSiteBenefit(id: string) {
  await prisma.siteBenefit.delete({ where: { id } });
}
