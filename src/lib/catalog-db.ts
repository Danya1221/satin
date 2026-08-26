import "server-only";

import { prisma } from "@/lib/db";

export type DbProductCard = Awaited<ReturnType<typeof getProductCardsFromDb>>[number];

export async function getProductCardsFromDb() {
  return prisma.product.findMany({
    where: {
      status: "active",
    },
    include: {
      variants: {
        orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function getProductBySlugFromDb(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      variants: {
        orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      },
      category: true,
    },
  });
}

export async function getCategoriesFromDb() {
  return prisma.category.findMany({
    where: {
      status: "active",
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}
