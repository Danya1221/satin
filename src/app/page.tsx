import { getPublicCatalogData } from "@/lib/public-catalog-db";
import { getPublicPageBlocks } from "@/lib/page-builder-db";
import { getSiteEditorSettings } from "@/lib/site-settings-db";
import {
  getSiteBanners,
  getSiteBenefits,
} from "@/lib/site-content-library-db";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
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

  const allProducts = catalog.productCards.filter(
    (product) => product.slug !== "catalog"
  );

  const configuredProducts = allProducts.filter((product) => {
    const images = [
      product.image,
      ...(Array.isArray(product.images) ? product.images : []),
    ]
      .map((image) => String(image ?? "").trim())
      .filter(Boolean);

    return images.length > 0;
  });

  const explicitNew = allProducts.filter((product) => product.isNew);

  const initialData = {
    categories: catalog.categories.map((category) => ({
      ...category,
      image: category.image || "",
    })),
    products: configuredProducts,
    popularProducts: configuredProducts.filter(
      (product) => product.isPopular
    ),
    newArrivals:
      explicitNew.length > 0 ? explicitNew : allProducts.slice(0, 3),
    pageBlocks:
      pageBlocksResult.status === "fulfilled"
        ? pageBlocksResult.value
        : [],
    siteSettings:
      siteSettingsResult.status === "fulfilled"
        ? siteSettingsResult.value
        : undefined,
    banners:
      bannersResult.status === "fulfilled"
        ? bannersResult.value
        : [],
    benefits:
      benefitsResult.status === "fulfilled"
        ? benefitsResult.value
        : [],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <HomeClient initialData={initialData as any} />;
}
