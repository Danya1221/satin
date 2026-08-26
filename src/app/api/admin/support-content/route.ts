import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEditableSupportTopics, updateEditableSupportTopic } from "@/lib/support-topics-db";

export const dynamic = "force-dynamic";

type Body = {
  entity?: "feature" | "question" | "topic";
  id?: string;
  title?: string;
  text?: string;
  icon?: string;
  image?: string;
  question?: string;
  answer?: string;
  intro?: string;
  placeholder?: string;
  quickMessages?: string[];
  isActive?: boolean;
  sortOrder?: number;
};

function clean(value: unknown, max = 4000) {
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

  const [features, questions, topics] = await Promise.all([
    prisma.supportFeature.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.supportFaqItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    getEditableSupportTopics(),
  ]);

  return NextResponse.json(
    { features, questions, topics },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const body = (await request.json()) as Body;

  if (body.entity === "question") {
    const item = await prisma.supportFaqItem.create({
      data: {
        question: clean(body.question, 500) || "Новый вопрос",
        answer: clean(body.answer) || "Введите ответ.",
        isActive: body.isActive !== false,
        sortOrder: order(body.sortOrder),
      },
    });

    return NextResponse.json({ item });
  }

  const item = await prisma.supportFeature.create({
    data: {
      title: clean(body.title, 160) || "Новое преимущество",
      text: clean(body.text, 500),
      icon: clean(body.icon, 10) || "✓",
      image: clean(body.image, 2_800_000),
      isActive: body.isActive !== false,
      sortOrder: order(body.sortOrder),
    },
  });

  return NextResponse.json({ item });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const id = clean(body.id, 100);

  if (body.entity === "topic") {
    if (!id) {
      return NextResponse.json({ error: "Не указана тема." }, { status: 400 });
    }

    try {
      const item = await updateEditableSupportTopic({
        id,
        intro: body.intro,
        placeholder: body.placeholder,
        quickMessages: body.quickMessages,
      });

      return NextResponse.json({ item });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Не удалось сохранить тему." },
        { status: 400 },
      );
    }
  }

  if (!id) {
    return NextResponse.json({ error: "Не указан ID." }, { status: 400 });
  }

  if (body.entity === "question") {
    const item = await prisma.supportFaqItem.update({
      where: { id },
      data: {
        question: clean(body.question, 500),
        answer: clean(body.answer),
        isActive: body.isActive !== false,
        sortOrder: order(body.sortOrder),
      },
    });

    return NextResponse.json({ item });
  }

  const item = await prisma.supportFeature.update({
    where: { id },
    data: {
      title: clean(body.title, 160),
      text: clean(body.text, 500),
      icon: clean(body.icon, 10) || "✓",
      image: clean(body.image, 2_800_000),
      isActive: body.isActive !== false,
      sortOrder: order(body.sortOrder),
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
  const id = url.searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ error: "Не указан ID." }, { status: 400 });
  }

  if (entity === "question") {
    await prisma.supportFaqItem.delete({ where: { id } });
  } else {
    await prisma.supportFeature.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}
