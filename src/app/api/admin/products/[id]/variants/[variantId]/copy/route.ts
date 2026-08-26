import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Неизвестная ошибка.";
}

async function getUniqueSku(baseSku: string) {
  const base = String(baseSku || "SKU").trim() || "SKU";

  for (let index = 1; index <= 99; index += 1) {
    const suffix = index === 1 ? "COPY" : `COPY-${index}`;
    const candidate = `${base}-${suffix}`;

    const exists = await prisma.productVariant.findUnique({
      where: { sku: candidate },
      select: { id: true },
    });

    if (!exists) {
      return candidate;
    }
  }

  return `${base}-COPY-${Date.now()}`;
}

async function getUniqueSlug(productId: string, baseSlug: string) {
  const base = String(baseSlug || "copy").trim() || "copy";

  for (let index = 1; index <= 99; index += 1) {
    const suffix = index === 1 ? "copy" : `copy-${index}`;
    const candidate = `${base}-${suffix}`;

    const exists = await prisma.productVariant.findFirst({
      where: {
        productId,
        slug: candidate,
      },
      select: { id: true },
    });

    if (!exists) {
      return candidate;
    }
  }

  return `${base}-copy-${Date.now()}`;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const { id, variantId } = await params;

  const source = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId: id,
    },
  });

  if (!source) {
    return NextResponse.json(
      {
        error: "Позиция не найдена.",
      },
      { status: 404 },
    );
  }

  try {
    const sku = await getUniqueSku(source.sku);
    const slug = await getUniqueSlug(id, source.slug);

    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        sku,
        slug,
        title: `${source.title} копия`,
        memory: source.memory,
        color: source.color,
        colorHex: source.colorHex,
        sim: source.sim,
        images: source.images,
        price: source.price,
        oldPrice: source.oldPrice,
        stock: source.stock,
        status: "draft",
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        seoKeywords: source.seoKeywords,
        relatedProductIds: source.relatedProductIds,
      },
    });

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Не удалось скопировать позицию.",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
