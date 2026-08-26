import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Body = {
  entity?: "review" | "question";
  id?: string;
  answer?: string;
  isVisible?: boolean;
};

async function requireAdmin() {
  const session = await getAuthSession();
  return session?.role === "admin";
}

function clean(value: unknown, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawEntity = url.searchParams.get("entity") || "all";
  const entity =
    rawEntity === "question" || rawEntity === "questions"
      ? "question"
      : rawEntity === "review" || rawEntity === "reviews"
        ? "review"
        : "all";
  const search = clean(url.searchParams.get("search"), 200);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 300);

  const productWhere = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { brand: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [reviews, questions] = await Promise.all([
    entity === "question"
      ? Promise.resolve([])
      : prisma.productReview.findMany({
          where: productWhere ? { product: productWhere } : undefined,
          include: {
            product: { select: { id: true, name: true, brand: true, slug: true } },
            customer: { select: { id: true, name: true, lastName: true, email: true, phone: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
    entity === "review"
      ? Promise.resolve([])
      : prisma.productQuestion.findMany({
          where: productWhere ? { product: productWhere } : undefined,
          include: {
            product: { select: { id: true, name: true, brand: true, slug: true } },
            customer: { select: { id: true, name: true, lastName: true, email: true, phone: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
  ]);

  return NextResponse.json({ reviews, questions });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const id = clean(body.id, 100);

  if (!id || !body.entity) {
    return NextResponse.json({ error: "Не указан элемент." }, { status: 400 });
  }

  if (body.entity === "question") {
    const answer = clean(body.answer);
    const item = await prisma.productQuestion.update({
      where: { id },
      data: {
        ...(typeof body.isVisible === "boolean" ? { isVisible: body.isVisible } : {}),
        ...(body.answer !== undefined
          ? {
              answer,
              answeredAt: answer ? new Date() : null,
            }
          : {}),
      },
    });

    return NextResponse.json({ item });
  }

  const item = await prisma.productReview.update({
    where: { id },
    data: {
      ...(typeof body.isVisible === "boolean" ? { isVisible: body.isVisible } : {}),
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity");
  const id = clean(url.searchParams.get("id"), 100);

  if (!id || (entity !== "review" && entity !== "question")) {
    return NextResponse.json({ error: "Не указан элемент." }, { status: 400 });
  }

  if (entity === "question") {
    await prisma.productQuestion.delete({ where: { id } });
  } else {
    await prisma.productReview.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}
