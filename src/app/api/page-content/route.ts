import { NextRequest, NextResponse } from "next/server";
import { getPageBlocks, isPageKey } from "@/lib/page-builder-db";
import { getPublicCatalogData } from "@/lib/public-catalog-db";
import { getSiteBanners, getSiteBenefits } from "@/lib/site-content-library-db";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page");
  if (!isPageKey(page)) return NextResponse.json({ error: "Страница не найдена." }, { status: 404 });
  try {
    const blocks = await getPageBlocks(page);
    const needsCatalog = page === "new" || blocks.some(block => block.enabled && ["category-grid", "product-carousel", "popular-products", "new-arrivals"].includes(block.type));
    const [catalog, banners, benefits] = await Promise.all([
      needsCatalog ? getPublicCatalogData() : null,
      getSiteBanners({ activeOnly: true }), getSiteBenefits({ activeOnly: true, placement: "store" }),
    ]);
    return NextResponse.json({ pageBlocks: blocks, products: catalog?.productCards ?? [], newArrivals: catalog?.productCards.filter(product => product.isNew) ?? [], categories: catalog?.categories ?? [], banners, benefits }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить настройки страницы." }, { status: 503 });
  }
}
