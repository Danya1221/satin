import { NextResponse } from "next/server";

import { getPublicCatalogData } from "@/lib/public-catalog-db";
import { getPublicPageBlocks } from "@/lib/page-builder-db";
import { getSiteEditorSettings } from "@/lib/site-settings-db";
import {
  getSiteBanners,
  getSiteBenefits,
} from "@/lib/site-content-library-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const [
    catalogResult,
    siteSettingsResult,
    pageBlocksResult,
    bannersResult,
    benefitsResult,
  ] = await Promise.allSettled([
    getPublicCatalogData(),
    getSiteEditorSettings(),
    getPublicPageBlocks("home"),
    getSiteBanners({ activeOnly: true }),
    getSiteBenefits({ activeOnly: true, placement: "store" }),
  ]);

  const catalog =
    catalogResult.status === "fulfilled"
      ? catalogResult.value
      : { categories: [], productCards: [] };

  const siteSettings =
    siteSettingsResult.status === "fulfilled"
      ? siteSettingsResult.value
      : undefined;

  const pageBlocks =
    pageBlocksResult.status === "fulfilled"
      ? pageBlocksResult.value
      : [];

  const banners =
    bannersResult.status === "fulfilled"
      ? bannersResult.value
      : [];

  const benefits =
    benefitsResult.status === "fulfilled"
      ? benefitsResult.value
      : [];

  const configuredProducts = catalog.productCards.filter((product) => {
    const images = [
      product.image,
      ...(Array.isArray(product.images) ? product.images : []),
    ]
      .map((image) => String(image ?? "").trim())
      .filter(Boolean);

    return product.slug !== "catalog" && images.length > 0;
  });

  const dbProducts = catalog.productCards.filter(
    (product) => product.slug !== "catalog"
  );
  const explicitNewArrivals = dbProducts.filter((product) => product.isNew);

  return NextResponse.json(
    {
      categories: catalog.categories.map((category) => ({
        ...category,
        image: category.image || "",
      })),
      products: configuredProducts,
      popularProducts: configuredProducts.filter(
        (product) => product.isPopular
      ),
      newArrivals:
        explicitNewArrivals.length > 0
          ? explicitNewArrivals
          : dbProducts.slice(0, 3),
      pageBlocks,
      siteSettings,
      banners,
      benefits,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
