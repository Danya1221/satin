import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";


function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeDescriptionBlocks(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const title = toStringValue(record.title).trim();
      const text = toStringValue(record.text).trim();
      const image = toStringValue(record.image).trim();

      if (!title && !text && !image) {
        return null;
      }

      return {
        id: toStringValue(record.id).trim() || `block-${index}`,
        eyebrow: toStringValue(record.eyebrow).trim(),
        title,
        text,
        image,
        imageAlt: toStringValue(record.imageAlt).trim(),
        imageSide: record.imageSide === "left" ? "left" : "right",
        tone: record.tone === "dark" ? "dark" : "light",
      };
    })
    .filter(Boolean);
}

function normalizeImages(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function normalizeStatus(value: unknown) {
  if (value === "draft" || value === "hidden" || value === "out_of_stock") {
    return value;
  }

  return "active";
}

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: {
        orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body?.slug || !body?.name || !body?.brand || !body?.categorySlug) {
    return NextResponse.json(
      {
        error: "slug, name, brand and categorySlug are required",
      },
      { status: 400 },
    );
  }

  const category = await prisma.category.findUnique({
    where: { slug: String(body.categorySlug) },
  });

  if (!category) {
    return NextResponse.json(
      {
        error: "Категория не найдена. Сначала создайте её в админке или выберите существующую.",
      },
      { status: 400 },
    );
  }

  const images = normalizeImages(body.images);
  const mainImage = String(body.image ?? "").trim() || images[0] || "";

  const product = await prisma.product.create({
    data: {
      slug: String(body.slug),
      name: String(body.name),
      brand: String(body.brand),
      categorySlug: String(body.categorySlug),
      categoryId: category?.id ?? null,
      description: String(body.description ?? ""),
      shortDescription: String(body.shortDescription ?? ""),
      descriptionBlocks: normalizeDescriptionBlocks(body.descriptionBlocks),
      characteristics: String(body.characteristics ?? ""),
      image: mainImage,
      promoImage: String(body.promoImage ?? "").trim(),
      images,
      colors: Array.isArray(body.colors) ? body.colors.map(String) : [],
      status: normalizeStatus(body.status),
      isNew: Boolean(body.isNew),
      isPopular: Boolean(body.isPopular),
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 100,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
