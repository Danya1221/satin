import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

type VariantStatus = "active" | "draft" | "hidden" | "out_of_stock";

const allowedStatuses = new Set<VariantStatus>(["active", "draft", "hidden", "out_of_stock"]);

function toNullableInt(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : null;
}

function toRequiredInt(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : null;
}

function normalizeStatus(value: unknown, stock: number): VariantStatus {
  if (typeof value === "string" && allowedStatuses.has(value as VariantStatus)) {
    return value as VariantStatus;
  }

  return stock > 0 ? "active" : "out_of_stock";
}

function normalizeImages(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 12);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Неизвестная ошибка.";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const variants = await prisma.productVariant.findMany({
    where: { productId: id },
    orderBy: [{ price: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ variants });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const price = toRequiredInt(body?.price);
  const stock = toRequiredInt(body?.stock) ?? 0;

  if (!body?.sku || !body?.slug || !body?.title || price === null) {
    return NextResponse.json(
      {
        error: "Укажите SKU, slug, название позиции и цену.",
      },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json(
      {
        error: "Карточка товара не найдена.",
      },
      { status: 404 },
    );
  }

  try {
    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        sku: String(body.sku),
        slug: String(body.slug),
        title: String(body.title),
        memory: String(body.memory ?? ""),
        color: String(body.color ?? ""),
        colorHex: String(body.colorHex ?? ""),
        sim: String(body.sim ?? ""),
        images: normalizeImages(body.images),
        price,
        oldPrice: toNullableInt(body.oldPrice),
        stock,
        status: normalizeStatus(body.status, stock),
        seoTitle: String(body.seoTitle ?? ""),
        seoDescription: String(body.seoDescription ?? ""),
        seoKeywords: String(body.seoKeywords ?? ""),
      },
    });

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);

    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          error: "Такая SKU или такой slug позиции уже есть у товара.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Не удалось создать позицию.",
        details: message,
      },
      { status: 500 },
    );
  }
}
