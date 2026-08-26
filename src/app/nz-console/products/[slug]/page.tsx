import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductEditForm } from "@/components/admin/product-edit-form";
import {
  getAdminCategories,
  getAdminProductBySlug,
  getAdminProductFormSuggestions,
  getAdminStatusClass,
  getAdminStatusLabel,
} from "@/lib/admin-products-db";

export const dynamic = "force-dynamic";

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toLocaleString("ru-RU")} ₽`;
}

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, categories, suggestions] = await Promise.all([
    getAdminProductBySlug(slug),
    getAdminCategories(),
    getAdminProductFormSuggestions(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 sm:px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Карточка товара</span>
            <span>·</span>
            <span>{product.name}</span>
          </div>

          <Link
            href="/nz-console/products"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            К карточкам
          </Link>
        </header>

        <section className="mt-10">
          <BackLink href="/nz-console/products" label="Назад к карточкам" variant="admin" />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-5">
                  <div
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.045] bg-cover bg-center bg-no-repeat text-xs text-white/25"
                    style={product.image ? { backgroundImage: `url(${product.image})` } : undefined}
                  >
                    {product.image ? null : "Фото"}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                        Материнская карточка
                      </div>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] ${
                          "border-blue-500/30 bg-blue-500/10 text-blue-300"
                        }`}
                      >
                        БД
                      </span>
                    </div>

                    <h1 className="mt-3 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
                      {product.name}
                    </h1>

                    <p className="mt-4 max-w-[720px] text-sm leading-relaxed text-white/55">
                      {product.description || product.shortDescription || "Описание пока не заполнено."}
                    </p>
                  </div>
                </div>

                <span className={`inline-flex w-fit whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${getAdminStatusClass(product.status)}`}>
                  {getAdminStatusLabel(product.status)}
                </span>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <InfoCard label="Категория" value={product.categoryName} />
                <InfoCard label="Бренд" value={product.brand} />
                <InfoCard label="Позиций / SKU" value={String(product.variantsCount)} />
                <InfoCard label="Цена от" value={formatPrice(product.minPrice)} />
              </div>
            </div>

            <aside className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                Действия
              </div>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
                Управление
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-white/55">
                Здесь редактируется только материнская карточка. Позиции, цены, наличие и SKU ведём отдельно в разделе «Позиции / SKU».
              </p>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/nz-console/products/new"
                  className="rounded-xl bg-blue-600 px-5 py-4 text-center text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                  Создать ещё товар
                </Link>

                <a
                  href="#edit-product"
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
                >
                  Редактировать карточку
                </a>

                <Link
                  href={`/nz-console/positions/new?product=${product.slug}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
                >
                  Добавить позицию в SKU
                </Link>
              </div>
            </aside>
          </div>
        </section>


        <section id="edit-product" className="mt-8">
          <ProductEditForm product={product} categories={categories} suggestions={suggestions} />
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-2 text-lg font-bold text-white">{value}</div>
    </div>
  );
}