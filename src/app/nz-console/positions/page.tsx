import { BackLink } from "@/components/back-link";
import type { ReactNode } from "react";
import Image from 'next/image';
import Link from "next/link";

import { PositionCopyButton } from "@/components/admin/position-copy-button";
import { PositionVisibilityButton } from "@/components/admin/position-visibility-button";
import { PositionsImportForm } from "@/components/admin/positions-import-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = {
  tab?: string;
  q?: string;
  productId?: string;
  brand?: string;
  stock?: string;
  status?: string;
};

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toLocaleString("ru-RU")} ₽`;
}

function getStockLabel(stock: number) {
  return stock > 0 ? `${stock} шт.` : "Нет";
}

function getStatusLabel(status: string) {
  if (status === "active") {
    return "В продаже";
  }

  if (status === "draft") {
    return "Черновик";
  }

  if (status === "hidden") {
    return "Скрыта";
  }

  return "Нет в наличии";
}

function getStatusClass(status: string, stock: number) {
  if (status === "hidden") {
    return "border-white/10 bg-white/[0.03] text-white/45";
  }

  if (status === "draft") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (stock <= 0 || status === "out_of_stock") {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }

  return "border-green-500/30 bg-green-500/10 text-green-300";
}

function buildHref(params: SearchParams, patch: SearchParams) {
  const merged = new URLSearchParams();
  const next = { ...params, ...patch };

  for (const [key, value] of Object.entries(next)) {
    if (value) {
      merged.set(key, value);
    }
  }

  const query = merged.toString();

  return query ? `/nz-console/positions?${query}` : "/nz-console/positions";
}

function matchesTab(variant: { status: string; stock: number }, tab: string) {
  if (tab === "active") {
    return variant.status === "active" && variant.stock > 0;
  }

  if (tab === "out") {
    return variant.stock <= 0 || variant.status === "out_of_stock";
  }

  if (tab === "draft") {
    return variant.status === "draft";
  }

  if (tab === "hidden") {
    return variant.status === "hidden";
  }

  return true;
}

export default async function AdminPositionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const activeTab = params.tab ?? "all";
  const q = (params.q ?? "").trim().toLowerCase();
  const selectedProductId = params.productId ?? "";
  const selectedBrand = params.brand ?? "";
  const selectedStock = params.stock ?? "";
  const selectedStatus = params.status ?? "";

  const [variants, products] = await Promise.all([
    prisma.productVariant.findMany({
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            brand: true,
            image: true,
            sortOrder: true,
          },
        },
      },
      orderBy: [
        { product: { sortOrder: "asc" } },
        { product: { brand: "asc" } },
        { createdAt: "desc" },
      ],
    }),
    prisma.product.findMany({
      select: { id: true, name: true, brand: true, sortOrder: true },
      orderBy: [{ sortOrder: "asc" }, { brand: "asc" }, { name: "asc" }],
    }),
  ]);

  const activeCount = variants.filter((variant) => variant.status === "active" && variant.stock > 0).length;
  const outOfStockCount = variants.filter((variant) => variant.stock <= 0 || variant.status === "out_of_stock").length;
  const draftCount = variants.filter((variant) => variant.status === "draft").length;
  const hiddenCount = variants.filter((variant) => variant.status === "hidden").length;

  const filteredVariants = variants.filter((variant) => {
    if (!matchesTab(variant, activeTab)) {
      return false;
    }

    if (selectedProductId && variant.productId !== selectedProductId) {
      return false;
    }

    if (selectedBrand && variant.product.brand !== selectedBrand) {
      return false;
    }

    if (selectedStatus && variant.status !== selectedStatus) {
      return false;
    }

    if (selectedStock === "in" && variant.stock <= 0) {
      return false;
    }

    if (selectedStock === "out" && variant.stock > 0) {
      return false;
    }

    if (q) {
      const haystack = [
        variant.sku,
        variant.title,
        variant.slug,
        variant.color,
        variant.memory,
        variant.sim,
        variant.product.name,
        variant.product.brand,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    }

    return true;
  });

  const currentParams: SearchParams = {
    tab: activeTab === "all" ? undefined : activeTab,
    q: params.q,
    productId: selectedProductId,
    brand: selectedBrand,
    stock: selectedStock,
    status: selectedStatus,
  };

  const brandOptions = Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "ru"),
  );

  const tabs = [
    { label: "Все", value: "all", count: variants.length },
    { label: "В продаже", value: "active", count: activeCount },
    { label: "Нет в наличии", value: "out", count: outOfStockCount },
    { label: "Черновики", value: "draft", count: draftCount },
    { label: "Скрытые", value: "hidden", count: hiddenCount },
  ];

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 sm:px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Позиции / SKU</span>
            <span>·</span>
            <span>цены и наличие из БД</span>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            На сайт
          </Link>
        </header>

        <section className="mt-10">
          <BackLink href="/nz-console" label="В админку" variant="admin" />

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
                Позиции / SKU
              </h1>

              <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-white/55">
                Здесь лежат конкретные товары, которые реально продаются: конфигурация, цена, цена до акции, наличие и SEO конкретной позиции. Описание остаётся у материнской карточки товара.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="#positions-import" className="rounded-xl border border-blue-500/35 bg-blue-500/10 px-7 py-4 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/15">
                Импорт XLSX
              </a>

              <Link
                href="/nz-console/positions/new"
                className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Добавить позицию
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap gap-2 border-b border-white/10">
            {tabs.map((tab) => {
              const active = activeTab === tab.value || (!activeTab && tab.value === "all");
              return (
                <Link
                  key={tab.value}
                  href={buildHref(currentParams, { tab: tab.value === "all" ? undefined : tab.value })}
                  className={`relative px-4 py-4 text-sm font-medium transition-colors ${
                    active ? "text-white" : "text-white/45 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>

                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active ? "bg-blue-600 text-white" : "bg-white/10 text-white/45"}`}>
                    {tab.count}
                  </span>

                  {active && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-blue-500" />}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <form className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <input type="hidden" name="tab" value={activeTab === "all" ? "" : activeTab} />
            <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_220px_180px_160px_160px]">
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Поиск по названию / модели / SKU"
                className="h-12 flex-1 rounded-xl border border-white/10 bg-black/20 px-5 text-sm text-white outline-none placeholder:text-white/35 focus:border-blue-500/50"
              />

              <select name="productId" defaultValue={selectedProductId} className="h-12 rounded-xl border border-white/10 bg-[#060c16] px-5 text-sm font-medium text-white outline-none transition-colors hover:border-blue-500/40 focus:border-blue-500/50">
                <option value="">Все модели</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.brand}
                  </option>
                ))}
              </select>

              <select name="brand" defaultValue={selectedBrand} className="h-12 rounded-xl border border-white/10 bg-[#060c16] px-5 text-sm font-medium text-white outline-none transition-colors hover:border-blue-500/40 focus:border-blue-500/50">
                <option value="">Все бренды</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>

              <select name="stock" defaultValue={selectedStock} className="h-12 rounded-xl border border-white/10 bg-[#060c16] px-5 text-sm font-medium text-white outline-none transition-colors hover:border-blue-500/40 focus:border-blue-500/50">
                <option value="">Любое наличие</option>
                <option value="in">В наличии</option>
                <option value="out">Нет в наличии</option>
              </select>

              <select name="status" defaultValue={selectedStatus} className="h-12 rounded-xl border border-white/10 bg-[#060c16] px-5 text-sm font-medium text-white outline-none transition-colors hover:border-blue-500/40 focus:border-blue-500/50">
                <option value="">Любой статус</option>
                <option value="active">Активна</option>
                <option value="draft">Черновик</option>
                <option value="hidden">Скрыта</option>
                <option value="out_of_stock">Нет в наличии</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/nz-console/positions" className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:border-blue-500/40 hover:bg-blue-500/10">
                Сбросить
              </Link>
              <button type="submit" className="rounded-xl bg-blue-600 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-blue-500">
                Применить
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035]">
          <div className="hidden grid-cols-[minmax(360px,1.8fr)_0.6fr_0.65fr_0.65fr_0.75fr_0.75fr_0.8fr_0.9fr_160px] border-b border-white/10 bg-black/25 px-5 py-4 text-sm text-white/45 xl:grid">
            <div>Позиция / SKU</div>
            <div>Бренд</div>
            <div>Цвет</div>
            <div>Память</div>
            <div>SIM</div>
            <div>Цена</div>
            <div>Наличие</div>
            <div>Статус</div>
            <div className="text-right">Действия</div>
          </div>

          <div className="divide-y divide-slate-200/90 dark:divide-white/10">
            {filteredVariants.length > 0 ? (
              filteredVariants.map((variant) => {
                const image = variant.images?.[0] ?? variant.product.image;

                return (
                  <div
                    key={variant.id}
                    className="grid gap-4 border-b border-slate-200/90 bg-white p-4 transition-colors last:border-b-0 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.015] dark:hover:bg-blue-500/[0.04] xl:grid-cols-[minmax(360px,1.8fr)_0.6fr_0.65fr_0.65fr_0.75fr_0.75fr_0.8fr_0.9fr_160px] xl:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.045] text-[10px] text-white/25">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <Image quality={75} src={image} alt={variant.title} className="h-full w-full object-cover" />
                        ) : (
                          "Фото"
                        )}
                      </div>
                      <div>
                        <div className="line-clamp-2 font-semibold leading-snug">{variant.title}</div>
                        <div className="mt-1 max-w-[340px] truncate text-xs text-white/35" title={variant.sku}>SKU {variant.sku}</div>
                        <div className="mt-1 text-xs text-white/30">Фото: {variant.images?.length ?? 0}</div>
                      </div>
                    </div>

                    <AdminCell label="Бренд">{variant.product.brand || "—"}</AdminCell>
                    <AdminCell label="Цвет">{variant.color || "—"}</AdminCell>
                    <AdminCell label="Память">{variant.memory || "—"}</AdminCell>
                    <AdminCell label="SIM">{variant.sim || "—"}</AdminCell>
                    <AdminCell label="Цена">{formatPrice(variant.price)}</AdminCell>

                    <div>
                      <div className="mb-1 text-xs text-white/35 xl:hidden">Наличие</div>
                      <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-sm leading-none ${variant.stock > 0 ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-orange-500/30 bg-orange-500/10 text-orange-300"}`}>
                        {getStockLabel(variant.stock)}
                      </span>
                    </div>

                    <div>
                      <div className="mb-1 text-xs text-white/35 xl:hidden">Статус</div>
                      <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-sm leading-none ${getStatusClass(variant.status, variant.stock)}`}>
                        {getStatusLabel(variant.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <Link
                        href={`/nz-console/positions/${encodeURIComponent(variant.sku)}`}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
                      >
                        Изменить
                      </Link>
                      <PositionCopyButton productId={variant.productId} variantId={variant.id} />
                      <PositionVisibilityButton
                        variant={{
                          id: variant.id,
                          productId: variant.productId,
                          sku: variant.sku,
                          slug: variant.slug,
                          title: variant.title,
                          memory: variant.memory,
                          color: variant.color,
                          colorHex: variant.colorHex,
                          sim: variant.sim,
                          images: variant.images,
                          price: variant.price,
                          oldPrice: variant.oldPrice,
                          stock: variant.stock,
                          status: variant.status,
                          seoTitle: variant.seoTitle,
                          seoDescription: variant.seoDescription,
                          seoKeywords: variant.seoKeywords,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-white/45">
                По выбранным фильтрам SKU-позиций нет. Создайте позицию вручную или загрузите XLSX.
              </div>
            )}
          </div>
        </section>

        <section id="positions-import" className="my-8 scroll-mt-6">
          <PositionsImportForm />
        </section>
      </div>
    </main>
  );
}

function AdminCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs text-white/35 xl:hidden">{label}</div>
      <div className="text-sm text-white/70">{children}</div>
    </div>
  );
}
