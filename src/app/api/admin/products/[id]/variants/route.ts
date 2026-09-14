import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { variantInteger, variantText, variantConflictMessage } from "@/lib/variant-input";

type VariantStatus = "active" | "draft" | "hidden" | "out_of_stock";

const allowedStatuses = new Set<VariantStatus>(["active", "draft", "hidden", "out_of_stock"]);

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
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Не удалось прочитать данные позиции. Повторите сохранение." }, { status: 400 });
  }
  const sku = variantText(body.sku);
  const slug = variantText(body.slug);
  const title = variantText(body.title);
  const price = variantInteger(body.price);
  const stock = variantInteger(body.stock ?? 0);
  const oldPrice = body.oldPrice === undefined || body.oldPrice === null || body.oldPrice === "" ? null : variantInteger(body.oldPrice);
  if (!sku || !slug || !title) {
    return NextResponse.json({ error: "Укажите артикул, ссылку и название позиции." }, { status: 400 });
  }
  if (price === null || stock === null || (body.oldPrice !== undefined && body.oldPrice !== null && body.oldPrice !== "" && oldPrice === null)) {
    return NextResponse.json({ error: "Цена, старая цена и остаток должны быть целыми числами от 0 до 2 147 483 647." }, { status: 400 });
  }
  try {
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) return NextResponse.json({ error: "Модель товара не найдена. Обновите список моделей." }, { status: 404 });
    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        sku,
        slug,
        title,
        memory: variantText(body.memory),
        color: variantText(body.color),
        colorHex: variantText(body.colorHex),
        sim: variantText(body.sim),
        images: normalizeImages(body.images),
        price,
        oldPrice,
        stock,
        status: normalizeStatus(body.status, stock),
        seoTitle: variantText(body.seoTitle),
        seoDescription: variantText(body.seoDescription),
        seoKeywords: variantText(body.seoKeywords),
      },
    });

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    const conflict = variantConflictMessage(error);
    if (conflict) return NextResponse.json({ error: conflict }, { status: 409 });
    console.error("Position creation failed", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Не удалось сохранить позицию. Данные остались в форме — повторите попытку." }, { status: 500 });
  }
}
