import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { publicImageUrl } from "@/lib/public-image-urls";

export const dynamic = "force-dynamic";

function settingsRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export async function GET() {
  try {
    const [categories, highlights, headerBlock] = await Promise.all([
      prisma.faqCategory.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          questions: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      }),
      prisma.faqHighlight.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.pageBlock.findFirst({
        where: { pageKey: "faq", type: "faq-header", enabled: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const settings = settingsRecord(headerBlock?.settings);

    return NextResponse.json({
      header: {
        title: text(settings.title, "Частые вопросы"),
        subtitle: text(settings.subtitle, "Коротко объясняем, как работает выбор техники, корзина, доставка, оплата и связь с менеджером."),
        showSupportButton: bool(settings.showSupportButton, true),
        supportButtonText: text(settings.supportButtonText, "Написать в поддержку"),
        supportButtonHref: text(settings.supportButtonHref, "/help"),
        showCatalogButton: bool(settings.showCatalogButton, true),
        catalogButtonText: text(settings.catalogButtonText, "Перейти в каталог"),
        catalogButtonHref: text(settings.catalogButtonHref, "/catalog"),
      },
      categories: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        eyebrow: category.eyebrow,
        title: category.title,
        icon: category.icon,
        image: publicImageUrl("faq-category", category.id, "image", category.image, undefined, category.updatedAt.getTime()),
        description: category.description,
        questions: category.questions.map((question) => ({
          id: question.id,
          question: question.question,
          answer: question.answer,
          image: publicImageUrl("faq-question", question.id, "image", question.image, undefined, question.updatedAt.getTime()),
        })),
      })),
      highlights: highlights.map((item) => ({
        id: item.id,
        eyebrow: item.eyebrow,
        title: item.title,
        description: item.description,
        image: publicImageUrl("faq-highlight", item.id, "image", item.image, undefined, item.updatedAt.getTime()),
      })),
    });
  } catch (error) {
    console.error("FAQ public load failed", error);
    return NextResponse.json({ categories: [], highlights: [] }, { status: 500 });
  }
}
