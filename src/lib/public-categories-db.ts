import "server-only";

import { prisma } from "@/lib/db";

export type PublicCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  href: string;
  seoTitle: string;
  seoDescription: string;
};

export async function getPublicCategoriesFromDb(): Promise<PublicCategory[]> {
  const categories = await prisma.category.findMany({
    where: {
      status: "active",
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    id: category.slug,
    slug: category.slug,
    name: category.name,
    description: category.description,
    image: category.image ?? "",
    href: `/catalog/${category.slug}`,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
  }));
}

export async function getPublicCategoryBySlug(slug: string): Promise<PublicCategory | null> {
  const category = await prisma.category.findFirst({
    where: {
      slug,
      status: "active",
    },
  });

  if (!category) {
    return null;
  }

  return {
    id: category.slug,
    slug: category.slug,
    name: category.name,
    description: category.description,
    image: category.image ?? "",
    href: `/catalog/${category.slug}`,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
  };
}

export async function getPublicCategorySlugs() {
  const categories = await prisma.category.findMany({
    where: { status: "active" },
    select: { slug: true },
  });

  return categories.map((category) => category.slug);
}
