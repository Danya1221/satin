import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type CommunityBody = {
  type?: "review" | "question" | "vote";
  rating?: number;
  text?: string;
  images?: string[];
  reviewId?: string;
  vote?: "helpful" | "unhelpful";
  authorName?: string;
  authorEmail?: string;
};

function normalizeText(value: unknown, maxLength = 2000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeReviewImages(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.startsWith("data:image/") || item.startsWith("/uploads/"))
    .slice(0, 4);
}

async function findProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
}

async function hasCompletedPurchase(customerId: string, productId: string) {
  const order = await prisma.order.findFirst({
    where: {
      customerId,
      status: "completed",
      items: {
        some: {
          productId,
        },
      },
    },
    select: { id: true },
  });

  return Boolean(order);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const product = await findProduct(slug);

  if (!product) {
    return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
  }

  const session = await getAuthSession();

  const [reviews, questions, reviewAggregate, ratingGroups, existingReview] = await Promise.all([
    prisma.productReview.findMany({
      where: { productId: product.id, isVisible: true },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        customer: {
          select: { name: true, lastName: true },
        },
        votes: session?.role === "customer" && session.customerId
          ? {
              where: { customerId: session.customerId },
              select: { value: true },
              take: 1,
            }
          : false,
      },
    }),
    prisma.productQuestion.findMany({
      where: { productId: product.id, isVisible: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.productReview.aggregate({
      where: { productId: product.id, isVisible: true },
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.productReview.groupBy({
      by: ["rating"],
      where: { productId: product.id, isVisible: true },
      _count: { rating: true },
    }),
    session?.role === "customer" && session.customerId
      ? prisma.productReview.findUnique({
          where: {
            productId_customerId: {
              productId: product.id,
              customerId: session.customerId,
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const canReview =
    session?.role === "customer" && session.customerId
      ? !existingReview &&
        (await hasCompletedPurchase(session.customerId, product.id))
      : false;

  return NextResponse.json({
    summary: {
      rating: Number(reviewAggregate._avg.rating ?? 0),
      reviewsCount: reviewAggregate._count.id,
      questionsCount: questions.length,
      distribution: [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count:
          ratingGroups.find((group) => group.rating === rating)?._count.rating ?? 0,
      })),
    },
    authenticated: Boolean(session?.role === "customer" && session.customerId),
    canReview,
    hasReview: Boolean(existingReview),
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      text: review.text,
      verifiedPurchase: review.verifiedPurchase,
      images: review.images,
      helpfulCount: review.helpfulCount,
      unhelpfulCount: review.unhelpfulCount,
      userVote:
        "votes" in review && Array.isArray(review.votes) && review.votes[0]
          ? review.votes[0].value
          : 0,
      author:
        [review.customer.name, review.customer.lastName].filter(Boolean).join(" ") ||
        "Покупатель",
      createdAt: review.createdAt.toISOString(),
    })),
    questions: questions.map((question) => ({
      id: question.id,
      authorName: question.authorName,
      text: question.text,
      answer: question.answer,
      createdAt: question.createdAt.toISOString(),
    })),
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const product = await findProduct(slug);

  if (!product) {
    return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as CommunityBody;
  const session = await getAuthSession();

  if (body.type === "vote") {
    if (session?.role !== "customer" || !session.customerId) {
      return NextResponse.json(
        { error: "Чтобы оценить отзыв, войдите в аккаунт." },
        { status: 401 },
      );
    }

    const customerId: string = session.customerId;
    const reviewId = normalizeText(body.reviewId, 100);
    const value = body.vote === "helpful" ? 1 : body.vote === "unhelpful" ? -1 : 0;

    if (!reviewId || value === 0) {
      return NextResponse.json({ error: "Некорректный голос." }, { status: 400 });
    }

    const review = await prisma.productReview.findFirst({
      where: { id: reviewId, productId: product.id },
      select: { id: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Отзыв не найден." }, { status: 404 });
    }

    const existingVote = await prisma.productReviewVote.findUnique({
      where: {
        reviewId_customerId: {
          reviewId,
          customerId: customerId,
        },
      },
    });

    await prisma.$transaction(async (tx) => {
      if (existingVote?.value === value) {
        await tx.productReviewVote.delete({ where: { id: existingVote.id } });
      } else if (existingVote) {
        await tx.productReviewVote.update({
          where: { id: existingVote.id },
          data: { value },
        });
      } else {
        await tx.productReviewVote.create({
          data: { reviewId, customerId: customerId, value },
        });
      }

      const counts = await tx.productReviewVote.groupBy({
        by: ["value"],
        where: { reviewId },
        _count: { value: true },
      });

      await tx.productReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount:
            counts.find((item) => item.value === 1)?._count.value ?? 0,
          unhelpfulCount:
            counts.find((item) => item.value === -1)?._count.value ?? 0,
        },
      });
    });

    return NextResponse.json({ ok: true });
  }

  const text = normalizeText(body.text);

  if (text.length < 3) {
    return NextResponse.json(
      { error: "Напишите сообщение длиной хотя бы 3 символа." },
      { status: 400 },
    );
  }

  if (body.type === "review") {
    if (session?.role !== "customer" || !session.customerId) {
      return NextResponse.json(
        { error: "Чтобы оставить отзыв, войдите в аккаунт." },
        { status: 401 },
      );
    }

    const rating = Math.round(Number(body.rating));

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Выберите оценку от 1 до 5." },
        { status: 400 },
      );
    }

    const purchased = await hasCompletedPurchase(session.customerId, product.id);

    if (!purchased) {
      return NextResponse.json(
        { error: "Отзыв можно оставить только после завершённой покупки этого товара." },
        { status: 403 },
      );
    }

    const existing = await prisma.productReview.findUnique({
      where: {
        productId_customerId: {
          productId: product.id,
          customerId: session.customerId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Вы уже оставили отзыв об этом товаре." },
        { status: 409 },
      );
    }

    await prisma.productReview.create({
      data: {
        productId: product.id,
        customerId: session.customerId,
        rating,
        text,
        images: normalizeReviewImages(body.images),
        verifiedPurchase: true,
      },
    });

    return NextResponse.json({ ok: true });
  }

  const customer =
    session?.role === "customer" && session.customerId
      ? await prisma.customer.findUnique({
          where: { id: session.customerId },
          select: { id: true, name: true, lastName: true, email: true },
        })
      : null;

  const authorName =
    [customer?.name, customer?.lastName].filter(Boolean).join(" ") ||
    normalizeText(body.authorName, 80);
  const authorEmail = customer?.email || normalizeText(body.authorEmail, 120);

  if (!authorName) {
    return NextResponse.json(
      { error: "Укажите имя." },
      { status: 400 },
    );
  }

  await prisma.productQuestion.create({
    data: {
      productId: product.id,
      customerId: customer?.id,
      authorName,
      authorEmail,
      text,
    },
  });

  return NextResponse.json({ ok: true });
}
