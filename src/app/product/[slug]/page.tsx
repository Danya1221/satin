import { notFound } from "next/navigation";
import {
  getPublicProductBySlug,
  getPublicProductSlugs,
} from "@/lib/public-catalog-db";
import { ProductDetailView } from "@/components/product-detail-view";
import { getSiteBenefits } from "@/lib/site-content-library-db";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const slugs = await getPublicProductSlugs();

    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicProductBySlug(slug);

  if (!data) {
    return {
      title: "Товар не найден — Neontech",
    };
  }

  return {
    title: `${data.product.name} — купить в Neontech`,
    description: data.product.shortDescription || data.product.description,
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sku?: string }>;
}) {
  const { slug } = await params;
  const { sku } = await searchParams;

  const data = await getPublicProductBySlug(slug);

  if (!data) {
    notFound();
  }

  const selectedPosition = sku
    ? data.positions.find((position) => position.sku === sku)
    : undefined;
  const benefits = await getSiteBenefits({
    activeOnly: true,
    placement: "product",
    fallbackPlacement: "store",
  });

  return (
    <ProductDetailView
      product={data.product}
      positions={data.positions}
      selectedPosition={selectedPosition}
      benefits={benefits}
      relatedProducts={data.relatedProducts}
      similarProducts={data.similarProducts}
    />
  );
}
