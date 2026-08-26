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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
    const previousCategory = await prisma.category.findUnique({
      where: { id },
      select: { slug: true },
    });

    const category = await prisma.category.update({
      where: { id },
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

    if (previousCategory?.slug && previousCategory.slug !== slug) {
      await prisma.product.updateMany({
        where: { categorySlug: previousCategory.slug },
        data: { categorySlug: slug, categoryId: category.id },
      });
    }

    return NextResponse.json({ category });
  } catch (error) {
    const message = getErrorMessage(error);

    if (message.includes("Record to update not found")) {
      return NextResponse.json(
        {
          error: "Категория не найдена.",
        },
        { status: 404 },
      );
    }

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
        error: "Не удалось сохранить категорию.",
        details: message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.category.update({
      where: { id },
      data: { status: "hidden" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Не удалось скрыть категорию.",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
