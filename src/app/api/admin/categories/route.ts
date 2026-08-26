import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

type EntityStatus = "active" | "draft" | "hidden" | "out_of_stock";

const allowedStatuses = new Set<EntityStatus>(["active", "draft", "hidden", "out_of_stock"]);

function normalizeStatus(value: unknown): EntityStatus {
  if (typeof value === "string" && allowedStatuses.has(value as EntityStatus)) {
    return value as EntityStatus;
  }

  return "active";
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toSortOrder(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.round(numericValue) : 100;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Неизвестная ошибка.";
}

export async function GET() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const name = toStringValue(body?.name);
  const slug = toStringValue(body?.slug);

  if (!name || !slug) {
    return NextResponse.json(
      {
        error: "Заполните название и slug категории.",
      },
      { status: 400 },
    );
  }

  try {
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: toStringValue(body?.description),
        image: toStringValue(body?.image),
        status: normalizeStatus(body?.status),
        sortOrder: toSortOrder(body?.sortOrder),
        seoTitle: toStringValue(body?.seoTitle),
        seoDescription: toStringValue(body?.seoDescription),
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);

    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          error: "Категория с таким slug уже есть.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Не удалось создать категорию.",
        details: message,
      },
      { status: 500 },
    );
  }
}
