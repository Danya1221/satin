import "server-only";

import { prisma } from "@/lib/db";

export type AdminCategoryStatus = "active" | "draft" | "hidden" | "out_of_stock";


export type AdminCategoryProductItem = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  status: AdminCategoryStatus;
  variantsCount: number;
};

export type AdminCategoryItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  status: AdminCategoryStatus;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  productsCount: number;
};

const statusLabels: Record<AdminCategoryStatus, string> = {
  active: "Активна",
  draft: "Черновик",
  hidden: "Скрыта",
  out_of_stock: "Нет в наличии",
};

export function getAdminCategoryStatusLabel(status: string) {
  return statusLabels[status as AdminCategoryStatus] ?? status;
}

export function getAdminCategoryStatusClass(status: string) {
  if (status === "active") {
    return "border-green-500/30 bg-green-500/10 text-green-300";
  }

  if (status === "draft") {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }

  if (status === "hidden") {
    return "border-white/10 bg-white/[0.03] text-white/45";
  }

  return "border-red-500/30 bg-red-500/10 text-red-300";
}

function toAdminCategory(category: {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  status: string;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  _count?: { products?: number };
}): AdminCategoryItem {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    image: category.image ?? "",
    status: category.status as AdminCategoryStatus,
    sortOrder: category.sortOrder,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    productsCount: category._count?.products ?? 0,
  };
}

export async function getAdminCategoriesDetailed(): Promise<AdminCategoryItem[]> {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map(toAdminCategory);
}

export async function getAdminCategoryByIdOrSlug(idOrSlug: string): Promise<AdminCategoryItem | null> {
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return category ? toAdminCategory(category) : null;
}

export async function getAdminProductsForCategory(
  categoryId: string,
  categorySlug: string,
): Promise<AdminCategoryProductItem[]> {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { categoryId },
        { categorySlug },
      ],
    },
    include: {
      _count: {
        select: { variants: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categorySlug: product.categorySlug,
    status: product.status as AdminCategoryStatus,
    variantsCount: product._count.variants,
  }));
}
