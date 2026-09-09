import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/product-pricing";
import { publicImageUrl } from "@/lib/public-image-urls";
import { buildCatalogSearch, scoreCatalogSearchTarget } from "@/lib/search-v2";

export const dynamic = "force-dynamic";

function getDiscount(price: number, oldPrice: number | null) {
  if (!oldPrice || oldPrice <= price || price <= 0) {
    return 0;
  }

  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

type SearchDbProduct = Awaited<ReturnType<typeof getSearchProducts>>[number];

async function getSearchProducts(query: string) {
  return prisma.product.findMany({
    where: {
      status: "active",
      ...(query
        ? {}
        : {
            OR: [{ isPopular: true }, { isNew: true }],
          }),
    },
    include: {
      category: true,
      variants: {
        where: {
          status: {
            in: ["active", "out_of_stock"],
          },
        },
        orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: query
      ? [{ sortOrder: "asc" }, { createdAt: "desc" }]
      : [{ isPopular: "desc" }, { isNew: "desc" }, { sortOrder: "asc" }],
    take: query ? 120 : 8,
  });
}

function getProductSearchValues(product: SearchDbProduct) {
  return [
    product.name,
    product.brand,
    product.categorySlug,
    product.category?.name,
    product.description,
    product.shortDescription,
    ...product.colors,
    ...product.variants.flatMap((variant) => [
      variant.title,
      variant.sku,
      variant.slug,
      variant.memory,
      variant.color,
      variant.sim,
      variant.seoTitle,
      variant.seoDescription,
      variant.seoKeywords,
    ]),
  ];
}

function getProductSearchScore(product: SearchDbProduct, query: string) {
  const search = buildCatalogSearch(query);

  if (!search.hasQuery) {
    return Number(product.isPopular) * 20 + Number(product.isNew) * 10 - Number(product.sortOrder ?? 100) / 100;
  }

  return scoreCatalogSearchTarget(search, {
    values: getProductSearchValues(product),
    category: product.categorySlug,
    sortOrder: product.sortOrder,
  });
}

function getBestVariant(product: SearchDbProduct, query: string) {
  if (!query.trim()) {
    return product.variants.find((item) => item.price > 0) ?? product.variants[0];
  }

  const search = buildCatalogSearch(query);

  return [...product.variants]
    .map((variant) => ({
      variant,
      score: scoreCatalogSearchTarget(search, {
        values: [
          product.name,
          product.brand,
          product.categorySlug,
          product.category?.name,
          product.shortDescription,
          variant.title,
          variant.sku,
          variant.slug,
          variant.memory,
          variant.color,
          variant.sim,
          variant.seoTitle,
          variant.seoDescription,
          variant.seoKeywords,
        ],
        category: product.categorySlug,
        sortOrder: product.sortOrder,
      }),
    }))
    .sort((a, b) => b.score - a.score || a.variant.price - b.variant.price)[0]?.variant;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();

  try {
    const products = await getSearchProducts(query);
    const search = buildCatalogSearch(query);

    const rankedProducts = products
      .map((product) => ({ product, score: getProductSearchScore(product, query) }))
      .filter((item) => !search.hasQuery || item.score > Number.NEGATIVE_INFINITY)
      .sort((a, b) => b.score - a.score || Number(a.product.sortOrder ?? 100) - Number(b.product.sortOrder ?? 100))
      .slice(0, 8);

    const result = rankedProducts.map(({ product }) => {
      const variant = getBestVariant(product, query);
      const price = variant?.price ?? 0;
      const oldPrice = variant?.oldPrice ?? null;
      const variantImage = variant && Array.isArray(variant.images) ? variant.images[0] : "";
      const productImage = (Array.isArray(product.images) && product.images[0]) || product.image || "";
      const image = variantImage
        ? publicImageUrl("variant", variant?.sku ?? product.slug, "images", String(variantImage), 0)
        : publicImageUrl("product", product.slug, "images", String(productImage), 0);

      return {
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        image,
        price: price > 0 ? formatPrice(price) : "Цена по запросу",
        oldPrice: oldPrice ? formatPrice(oldPrice) : "",
        discount: getDiscount(price, oldPrice),
      };
    });

    return NextResponse.json(
      { products: result },
      {
        headers: {
          "Cache-Control": query
            ? "private, max-age=15"
            : "public, max-age=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Catalog search failed", error);
    return NextResponse.json({ products: [] }, { status: 200 });
  }
}
