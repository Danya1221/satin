import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImageKind = "category" | "product" | "variant" | "banner" | "benefit" | "setting" | "faq-category" | "faq-question" | "faq-highlight";

function parseDataImage(value: string) {
  const marker = ";base64,";
  const trimmed = value.trim();

  if (!trimmed.startsWith("data:")) {
    return null;
  }

  const markerIndex = trimmed.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const contentType = trimmed.slice("data:".length, markerIndex);
  const base64Body = trimmed.slice(markerIndex + marker.length);

  if (!contentType || !base64Body) {
    return null;
  }

  return {
    contentType,
    body: Buffer.from(base64Body, "base64"),
  };
}

function imageResponse(value: string, cacheControl?: string) {
  const image = parseDataImage(value.trim());

  if (!image) {
    return new NextResponse("Image not found", { status: 404 });
  }

  return new NextResponse(image.body, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control":
        cacheControl ??
        "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

function svgResponse(svg: string) {
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

function fallbackSettingIcon(field: string) {
  const common = 'fill="none" stroke="#2563eb" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"';

  if (field === "navIconCart") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path ${common} d="M3 3h2.2l2.1 10.15a2 2 0 0 0 1.96 1.6h7.96a2 2 0 0 0 1.94-1.52L21 6.5H6.05"/><path ${common} stroke-width="1.8" d="M9 9.25h8.9M10 12h7.2"/><circle cx="9.25" cy="19.25" r="1.25" fill="#2563eb"/><circle cx="17.25" cy="19.25" r="1.25" fill="#2563eb"/></svg>`;
  }

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
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path ${common} d="M12 18h.01"/><path ${common} d="M9.5 9a2.6 2.6 0 1 1 4.4 1.85c-1.05.95-1.9 1.55-1.9 3.15"/><circle ${common} cx="12" cy="12" r="9"/></svg>`;
  }

  return "";
}

function pickArrayValue(values: unknown, index: number) {
  if (!Array.isArray(values)) {
    return "";
  }

  const value = values[index];
  return typeof value === "string" ? value : "";
}

function getIndex(request: Request) {
  const url = new URL(request.url);
  const rawIndex = Number(url.searchParams.get("index") ?? "0");

  return Number.isInteger(rawIndex) && rawIndex >= 0 ? rawIndex : 0;
}

async function getImage(kind: ImageKind, id: string, field: string, index: number) {
  if (kind === "category") {
    if (field !== "image") return "";

    const category = await prisma.category.findUnique({
      where: { slug: id },
      select: { image: true },
    });

    return category?.image ?? "";
  }

  if (kind === "product") {
    if (!["image", "promoImage", "images"].includes(field) && !field.startsWith("descriptionBlocks.")) return "";

    const product = await prisma.product.findUnique({
      where: { slug: id },
      select: { image: true, promoImage: true, images: true, descriptionBlocks: true },
    });

    if (!product) return "";

    if (field === "images") {
      const image = pickArrayValue(product.images, index);
      return image || (index === 0 ? product.image : "");
    }

    if (field.startsWith("descriptionBlocks.")) {
      const match = field.match(/^descriptionBlocks\.(\d+)\.image$/);
      const blockIndex = match ? Number(match[1]) : -1;
      const blocks = Array.isArray(product.descriptionBlocks) ? product.descriptionBlocks : [];
      const block = blocks[blockIndex];

      if (!block || typeof block !== "object") return "";

      const image = (block as Record<string, unknown>).image;
      return typeof image === "string" ? image : "";
    }

    if (field === "promoImage") return product.promoImage;
    return product.image;
  }

  if (kind === "variant") {
    if (field !== "images") return "";

    const variant = await prisma.productVariant.findUnique({
      where: { sku: id },
      select: { images: true },
    });

    return pickArrayValue(variant?.images, index);
  }

  if (kind === "banner") {
    if (!["imageLight", "imageDark", "imageMobile"].includes(field)) return "";

    const banner = await prisma.siteBanner.findUnique({
      where: { id },
      select: { imageLight: true, imageDark: true, imageMobile: true },
    });

    if (!banner) return "";
    if (field === "imageDark") return banner.imageDark;
    if (field === "imageMobile") return banner.imageMobile;
    return banner.imageLight;
  }

  if (kind === "benefit") {
    if (field !== "image") return "";

    const benefit = await prisma.siteBenefit.findUnique({
      where: { id },
      select: { image: true },
    });

    return benefit?.image ?? "";
  }

  if (kind === "faq-category") {
    if (field !== "image") return "";
    const item = await prisma.faqCategory.findUnique({ where: { id }, select: { image: true } });
    return item?.image ?? "";
  }

  if (kind === "faq-question") {
    if (field !== "image") return "";
    const item = await prisma.faqQuestion.findUnique({ where: { id }, select: { image: true } });
    return item?.image ?? "";
  }

  if (kind === "faq-highlight") {
    if (field !== "image") return "";
    const item = await prisma.faqHighlight.findUnique({ where: { id }, select: { image: true } });
    return item?.image ?? "";
  }

  if (kind === "setting") {
    if (id !== "branding") return "";

    const allowedFields = new Set([
      "logoLight",
      "logoDark",
      "mobileLogo",
      "favicon",
      "navIconHome",
      "navIconCatalog",
      "navIconNew",
      "navIconSupport",
      "navIconCart",
    ]);

    if (!allowedFields.has(field)) return "";

    const setting = await prisma.siteSetting.findUnique({
      where: { key: "site" },
      select: { value: true },
    });

    const value = setting?.value;

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return "";
    }

    const branding = (value as Record<string, unknown>).branding;

    if (!branding || typeof branding !== "object" || Array.isArray(branding)) {
      return "";
    }

    const image = (branding as Record<string, unknown>)[field];

    return typeof image === "string" ? image : "";
  }

  return "";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ parts?: string[] }> },
) {
  const { parts = [] } = await context.params;
  const [kind, rawId, rawField] = parts;

  if (!kind || !rawId || !rawField) {
    return new NextResponse("Image not found", { status: 404 });
  }

  if (!["category", "product", "variant", "banner", "benefit", "setting", "faq-category", "faq-question", "faq-highlight"].includes(kind)) {
    return new NextResponse("Image not found", { status: 404 });
  }

  try {
    const id = decodeURIComponent(rawId);
    const field = decodeURIComponent(rawField);
    const index = getIndex(request);
    const value = await getImage(kind as ImageKind, id, field, index);

    const fallbackSvg =
      kind === "setting" &&
      id === "branding" &&
      field.startsWith("navIcon") &&
      (!value || value.startsWith("/api/public-image/"))
        ? fallbackSettingIcon(field)
        : "";

    if (fallbackSvg) {
      return svgResponse(fallbackSvg);
    }

    return imageResponse(
      value,
      kind === "setting"
        ? "private, no-cache, no-store, max-age=0, must-revalidate"
        : undefined,
    );
  } catch (error) {
    console.error("Public image loading failed", error);
    return new NextResponse("Image loading failed", { status: 500 });
  }
}
