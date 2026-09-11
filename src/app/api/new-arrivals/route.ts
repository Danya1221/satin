import { NextResponse } from "next/server";

import { getPublicCatalogData } from "@/lib/public-catalog-db";
import { getPublicPageBlocks } from "@/lib/page-builder-db";
import { getSiteEditorSettings } from "@/lib/site-settings-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [catalog, siteSettings, homeBlocks] = await Promise.all([
      getPublicCatalogData(),
      getSiteEditorSettings(),
      getPublicPageBlocks("new"),
    ]);

    const products = catalog.productCards.filter((product) => product.slug !== "catalog");
    const explicitNewArrivals = products.filter((product) => product.isNew);
    const pageBlocks = homeBlocks;

    return NextResponse.json({
      products,
      newArrivals: explicitNewArrivals,
      pageBlocks,
      siteSettings,
    });
  } catch (error) {
    console.error("New arrivals data loading failed", error);

    return NextResponse.json({ error: "Не удалось загрузить новинки. Попробуйте ещё раз." }, {status:503});
  }
}
