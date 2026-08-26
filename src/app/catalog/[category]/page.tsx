import { notFound } from "next/navigation";

import { CatalogView } from "@/components/catalog-view";
import { getPublicCatalogData } from "@/lib/public-catalog-db";
import {
  getPublicCategoryBySlug,
  getPublicCategorySlugs,
} from "@/lib/public-categories-db";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const slugs = await getPublicCategorySlugs();

    return slugs.map((category) => ({ category }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const activeCategory = await getPublicCategoryBySlug(category);

  if (!activeCategory) {
    return {
      title: "Категория не найдена — Neontech",
    };
  }

  return {
    title: activeCategory.seoTitle || `${activeCategory.name} — каталог Neontech`,
    description: activeCategory.seoDescription || activeCategory.description,
  };
}

export default async function CatalogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  const [activeCategory, catalog] = await Promise.all([
    getPublicCategoryBySlug(category),
    getPublicCatalogData(),
  ]);

  if (!activeCategory) {
    notFound();
  }

  return (
    <CatalogView
      categoryId={category}
      productsData={catalog.products}
      positionsData={catalog.positions}
      categoriesData={catalog.categories}
    />
  );
}
