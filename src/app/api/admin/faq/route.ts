import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Body = {
  entity?: "category" | "question" | "highlight";
  id?: string;
  categoryId?: string;
  slug?: string;
  eyebrow?: string;
  title?: string;
  icon?: string;
  image?: string;
  description?: string;
  question?: string;
  answer?: string;
  isActive?: boolean;
  sortOrder?: number;
};

function text(value: unknown, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function order(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : 100;
}

async function requireAdmin() {
  const session = await getAuthSession();
  return session?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const [categories, highlights] = await Promise.all([
    prisma.faqCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        questions: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      },
    }),
    prisma.faqHighlight.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return NextResponse.json({ categories, highlights });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const body = (await request.json()) as Body;

  if (body.entity === "question") {
    const categoryId = text(body.categoryId, 100);
    const question = text(body.question, 500);
    const answer = text(body.answer);
    if (!categoryId || !question || !answer) {
      return NextResponse.json({ error: "Укажите вопрос и ответ." }, { status: 400 });
    }
    const item = await prisma.faqQuestion.create({
      data: {
        categoryId,
        question,
        answer,
        image: text(body.image, 2_800_000),
        isActive: body.isActive !== false,
        sortOrder: order(body.sortOrder),
      },
    });
    return NextResponse.json({ item });
  }

  if (body.entity === "highlight") {
    const title = text(body.title, 160);
    if (!title) return NextResponse.json({ error: "Укажите название карточки." }, { status: 400 });
    const item = await prisma.faqHighlight.create({
      data: {
        eyebrow: text(body.eyebrow, 100),
        title,
        description: text(body.description, 1000),
        image: text(body.image, 2_800_000),
        isActive: body.isActive !== false,
        sortOrder: order(body.sortOrder),
      },
    });
    return NextResponse.json({ item });
  }

  const title = text(body.title, 160);
  const slug = text(body.slug, 100).toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "");
  if (!title || !slug) {
    return NextResponse.json({ error: "Укажите название и slug раздела." }, { status: 400 });
  }

  try {
    const item = await prisma.faqCategory.create({
      data: {
        slug,
        eyebrow: text(body.eyebrow, 100),
        title,
        icon: text(body.icon, 10) || "?",
        image: text(body.image, 2_800_000),
        description: text(body.description, 500),
        isActive: body.isActive !== false,
        sortOrder: order(body.sortOrder),
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Раздел с таким slug уже существует." }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const id = text(body.id, 100);
  if (!id) return NextResponse.json({ error: "Не указан ID." }, { status: 400 });

  if (body.entity === "question") {
    const item = await prisma.faqQuestion.update({
      where: { id },
      data: {
        question: text(body.question, 500),
        answer: text(body.answer),
        image: text(body.image, 2_800_000),
        isActive: body.isActive !== false,
        sortOrder: order(body.sortOrder),
      },
    });
    return NextResponse.json({ item });
  }

  if (body.entity === "highlight") {
    const item = await prisma.faqHighlight.update({
      where: { id },
      data: {
        eyebrow: text(body.eyebrow, 100),
        title: text(body.title, 160),
        description: text(body.description, 1000),
        image: text(body.image, 2_800_000),
        isActive: body.isActive !== false,
        sortOrder: order(body.sortOrder),
      },
    });
    return NextResponse.json({ item });
  }

  const slug = text(body.slug, 100).toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "");
  try {
    const item = await prisma.faqCategory.update({
      where: { id },
      data: {
        slug,
        eyebrow: text(body.eyebrow, 100),
        title: text(body.title, 160),
        icon: text(body.icon, 10) || "?",
        image: text(body.image, 2_800_000),
        description: text(body.description, 500),
        isActive: body.isActive !== false,
        sortOrder: order(body.sortOrder),
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить раздел. Проверьте уникальность slug." }, { status: 409 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }
  const url = new URL(request.url);
  const entity = url.searchParams.get("entity");
  const id = url.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Не указан ID." }, { status: 400 });
  if (entity === "question") await prisma.faqQuestion.delete({ where: { id } });
  else if (entity === "highlight") await prisma.faqHighlight.delete({ where: { id } });
  else await prisma.faqCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
