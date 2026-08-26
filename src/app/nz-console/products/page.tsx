import { BackLink } from "@/components/back-link";
import type { ReactNode } from "react";
import Link from "next/link";

import { CommunityAdminClient } from "@/components/admin/community-admin-client";
import { ProductVisibilityButton } from "@/components/admin/product-visibility-button";
import { SortOrderInput } from "@/components/admin/sort-order-input";
import {
  getAdminProducts,
  getAdminStatusClass,
  getAdminStatusLabel,
  type AdminProductListItem,
  type AdminProductStatus,
} from "@/lib/admin-products-db";

export const dynamic = "force-dynamic";

type ProductStatusFilter = "all" | AdminProductStatus;

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
  brand?: string | string[];
  status?: string | string[];
  section?: string | string[];
};

type AdminProductsPageProps = {
  searchParams?: Promise<SearchParams>;
};

type ProductsSection = "cards" | "reviews" | "questions";

function normalizeProductsSection(value: string): ProductsSection {
  if (value === "reviews" || value === "questions") {
    return value;
  }

  return "cards";
}

const statusTabs: Array<{ label: string; value: ProductStatusFilter }> = [
  { label: "Все", value: "all" },
  { label: "Активные", value: "active" },
  { label: "Черновики", value: "draft" },
  { label: "Скрытые", value: "hidden" },
];

function formatPrice(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${value.toLocaleString("ru-RU")} ₽`;
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeStatusFilter(value: string): ProductStatusFilter {
  if (value === "active" || value === "draft" || value === "hidden" || value === "out_of_stock") {
    return value;
  }

  return "all";
}

function productMatchesBaseFilters(
  product: AdminProductListItem,
  filters: { query: string; category: string; brand: string },
) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  if (normalizedQuery) {
    const searchableText = [
      product.name,
      product.slug,
      product.brand,
      product.categoryName,
      product.categorySlug,
      product.shortDescription,
    ]
      .join(" ")
      .toLowerCase();

    if (!searchableText.includes(normalizedQuery)) {
      return false;
    }
  }

  if (filters.category !== "all" && product.categorySlug !== filters.category) {
    return false;
  }

  if (filters.brand !== "all" && product.brand !== filters.brand) {
    return false;
  }

  return true;
}

function productMatchesStatus(product: AdminProductListItem, status: ProductStatusFilter) {
  if (status === "all") {
    return true;
  }

  return product.status === status;
}

function getTabCount(products: AdminProductListItem[], status: ProductStatusFilter) {
  if (status === "all") {
    return products.length;
  }

  return products.filter((product) => product.status === status).length;
}

function createProductsHref(params: {
  query: string;
  category: string;
  brand: string;
  status: ProductStatusFilter;
}) {
  const queryParams = new URLSearchParams();

  if (params.query.trim()) {
    queryParams.set("q", params.query.trim());
  }

  if (params.category !== "all") {
    queryParams.set("category", params.category);
  }

  if (params.brand !== "all") {
    queryParams.set("brand", params.brand);
  }

  if (params.status !== "all") {
    queryParams.set("status", params.status);
  }

  const queryString = queryParams.toString();
  return queryString ? `/nz-console/products?${queryString}` : "/nz-console/products";
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const rawParams = (await searchParams) ?? {};
  const allProducts = await getAdminProducts();

  const searchQuery = readParam(rawParams.q);
  const selectedCategory = readParam(rawParams.category) || "all";
  const selectedBrand = readParam(rawParams.brand) || "all";
  const selectedStatus = normalizeStatusFilter(readParam(rawParams.status));
  const selectedSection = normalizeProductsSection(readParam(rawParams.section));

  const categoryOptions = Array.from(
    allProducts.reduce((map, product) => {
      if (product.categorySlug) {
        map.set(product.categorySlug, product.categoryName || product.categorySlug);
      }

      return map;
    }, new Map<string, string>()),
  ).sort((a, b) => a[1].localeCompare(b[1], "ru"));

  const brandOptions = Array.from(new Set(allProducts.map((product) => product.brand).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "ru"),
  );

  const baseFilteredProducts = allProducts.filter((product) =>
    productMatchesBaseFilters(product, {
      query: searchQuery,
      category: selectedCategory,
      brand: selectedBrand,
    }),
  );

  const products = baseFilteredProducts.filter((product) => productMatchesStatus(product, selectedStatus));
  const activeCount = allProducts.filter((product) => product.status === "active").length;
  const draftCount = allProducts.filter((product) => product.status === "draft").length;
  const hiddenCount = allProducts.filter((product) => product.status === "hidden").length;
  const skuCount = allProducts.reduce((sum, product) => sum + product.variantsCount, 0);
  const dbCount = allProducts.filter((product) => product.source === "db").length;

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 sm:px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Карточки товаров</span>
            <span>·</span>
            <span>PostgreSQL</span>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 sm:px-5"
          >
            На сайт
          </Link>
        </header>

        <section className="mt-10">
          <BackLink href="/nz-console" label="В админку" variant="admin" />

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
                Данные из БД
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
                {selectedSection === "cards"
                  ? "Карточки товаров"
                  : selectedSection === "reviews"
                    ? "Отзывы о товарах"
                    : "Вопросы о товарах"}
              </h1>

              <p className="mt-3 max-w-[800px] text-sm leading-relaxed text-white/55">
                {selectedSection === "cards"
                  ? "Материнские карточки товаров, позиции и статусы из PostgreSQL."
                  : selectedSection === "reviews"
                    ? "Просмотр фотографий, рейтингов и модерация отзывов покупателей."
                    : "Ответы на вопросы покупателей, видимость и удаление записей."}
              </p>
            </div>

            {selectedSection === "cards" ? (
            <div className="flex flex-wrap gap-3">
              <Link
                href="/nz-console/positions"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Открыть позиции
              </Link>

              <Link
                href="/nz-console/products/new"
                className="rounded-xl bg-blue-600 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Создать карточку
              </Link>
            </div>
            ) : null}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2">
            {[
              { key: "cards", label: "Карточки товаров" },
              { key: "reviews", label: "Отзывы" },
              { key: "questions", label: "Вопросы" },
            ].map((item) => {
              const active = selectedSection === item.key;

              return (
                <a
                  key={item.key}
                  href={
                    item.key === "cards"
                      ? "/nz-console/products"
                      : `/nz-console/products?section=${item.key}`
                  }
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "border border-white/10 bg-black/20 text-white/55 hover:text-white"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </section>

        {selectedSection === "cards" ? (
        <>
        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <MetricCard label="Всего карточек" value={String(allProducts.length)} />
          <MetricCard label="Из БД" value={String(dbCount)} />
          <MetricCard label="Активные" value={String(activeCount)} />
          <MetricCard label="Позиции / SKU" value={String(skuCount)} />
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap gap-2 border-b border-white/10">
            {statusTabs.map((tab) => {
              const tabCount = getTabCount(baseFilteredProducts, tab.value);
              const isActive = selectedStatus === tab.value;

              return (
                <a
                  key={tab.value}
                  href={createProductsHref({
                    query: searchQuery,
                    category: selectedCategory,
                    brand: selectedBrand,
                    status: tab.value,
                  })}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative px-4 py-4 text-sm font-medium transition-colors ${
                    isActive ? "text-white" : "text-white/45 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      isActive ? "bg-blue-600 text-white" : "bg-white/10 text-white/45"
                    }`}
                  >
                    {tabCount}
                  </span>
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-blue-500" />}
                </a>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <form action="/nz-console/products" className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid flex-1 gap-3 md:grid-cols-[minmax(180px,1fr)_220px_190px_180px]">
              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="Поиск по названию, slug, бренду"
                className="h-12 rounded-xl border border-white/10 bg-black/20 px-5 text-sm text-white outline-none placeholder:text-white/35 focus:border-blue-500/50"
              />

              <select
                name="category"
                defaultValue={selectedCategory}
                className="h-12 rounded-xl border border-white/10 bg-[#050b16] px-4 text-sm text-white/75 outline-none focus:border-blue-500/50"
              >
                <option value="all">Все категории</option>
                {categoryOptions.map(([slug, name]) => (
                  <option key={slug} value={slug}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                name="brand"
                defaultValue={selectedBrand}
                className="h-12 rounded-xl border border-white/10 bg-[#050b16] px-4 text-sm text-white/75 outline-none focus:border-blue-500/50"
              >
                <option value="all">Все бренды</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>

              <select
                name="status"
                defaultValue={selectedStatus}
                className="h-12 rounded-xl border border-white/10 bg-[#050b16] px-4 text-sm text-white/75 outline-none focus:border-blue-500/50"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="draft">Черновики</option>
                <option value="hidden">Скрытые</option>
                <option value="out_of_stock">Нет в наличии</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Применить
              </button>

              <Link
                href="/nz-console/products"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white/65 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
              >
                Сбросить
              </Link>

              <Link
                href="/nz-console/products/new"
                className="rounded-xl border border-blue-500/35 bg-blue-500/10 px-6 py-3 text-center text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20"
              >
                Создать карточку
              </Link>
            </div>
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035]">
          <div className="hidden grid-cols-[90px_1.3fr_0.8fr_0.7fr_0.55fr_0.65fr_0.65fr_0.55fr_220px] border-b border-white/10 bg-black/25 px-5 py-4 text-sm text-white/45 xl:grid">
            <div>Фото</div>
            <div>Карточка</div>
            <div>Категория</div>
            <div>Бренд</div>
            <div>SKU</div>
            <div>Цена от</div>
            <div>Статус</div>
            <div>Порядок</div>
            <div className="text-right">Действия</div>
          </div>

          {products.length > 0 ? (
            <div className="divide-y divide-white/10">
              {products.map((product) => (
                <div
                  key={`${product.source}-${product.id}`}
                  className="grid gap-5 bg-white/[0.015] p-5 transition-colors hover:bg-blue-500/[0.04] xl:grid-cols-[90px_1.3fr_0.8fr_0.7fr_0.55fr_0.65fr_0.65fr_0.55fr_220px] xl:items-center"
                >
                  <Link
                    href={`/product/${product.slug}`}
                    className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] bg-cover bg-center bg-no-repeat text-xs text-white/25"
                    style={product.image ? { backgroundImage: `url(${product.image})` } : undefined}
                  >
                    {product.image ? null : "Фото"}
                  </Link>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/nz-console/products/${product.slug}`}
                        className="block text-lg font-bold transition-colors hover:text-blue-400"
                      >
                        {product.name}
                      </Link>

                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-300">
                        БД
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-white/35">/product/{product.slug}</div>

                    <p className="mt-2 line-clamp-2 text-sm text-white/45">
                      {product.shortDescription || "Описание пока не заполнено."}
                    </p>
                  </div>

                  <AdminCell label="Категория">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-white/65">
                      {product.categoryName}
                    </span>
                  </AdminCell>

                  <AdminCell label="Бренд">{product.brand}</AdminCell>

                  <AdminCell label="SKU">
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
                      {product.variantsCount}
                    </span>
                  </AdminCell>

                  <AdminCell label="Цена от">{formatPrice(product.minPrice)}</AdminCell>

                  <AdminCell label="Статус">
                    <span className={`rounded-full border px-3 py-1 text-sm ${getAdminStatusClass(product.status)}`}>
                      {getAdminStatusLabel(product.status)}
                    </span>
                  </AdminCell>

                  <AdminCell label="Порядок">
                    <SortOrderInput
                      id={product.id}
                      value={product.sortOrder}
                      apiPath="/api/admin/products"
                      extraBody={{ action: "set-sort-order" }}
                    />
                  </AdminCell>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <Link
                      href={`/nz-console/products/${product.slug}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
                    >
                      Открыть
                    </Link>

                    <ProductVisibilityButton productId={product.id} currentStatus={product.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-lg font-bold">Карточки не найдены</div>
              <p className="mx-auto mt-2 max-w-[520px] text-sm leading-relaxed text-white/45">
                По текущим фильтрам ничего нет. Сбрось фильтры или создай новую карточку товара.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link
                  href="/nz-console/products"
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  Сбросить фильтры
                </Link>
                <Link
                  href="/nz-console/products/new"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                  Создать карточку
                </Link>
              </div>
            </div>
          )}
        </section>
        </>
        ) : (
          <section className="mt-8 pb-10">
            <CommunityAdminClient
              key={selectedSection}
              initialTab={selectedSection === "reviews" ? "reviews" : "questions"}
              hideTabs
            />
          </section>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-6">
      <div className="text-sm text-white/45">{label}</div>
      <div className="mt-3 text-4xl font-bold tracking-[-0.05em]">{value}</div>
    </div>
  );
}

function AdminCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/30 xl:hidden">
        {label}
      </div>
      <div className="text-sm text-white/70">{children}</div>
    </div>
  );
}
