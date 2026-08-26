import { BackLink } from "@/components/back-link";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/category-form";
import {
  getAdminCategoryByIdOrSlug,
  getAdminCategoryStatusClass,
  getAdminCategoryStatusLabel,
  getAdminProductsForCategory,
} from "@/lib/admin-categories-db";

export const dynamic = "force-dynamic";

export default async function AdminCategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getAdminCategoryByIdOrSlug(id);

  if (!category) {
    notFound();
  }

  const products = await getAdminProductsForCategory(category.id, category.slug);

  return (
    <main className="min-h-screen bg-[#020814] px-6 py-6 text-white">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Категории</span>
            <span>·</span>
            <span>{category.name}</span>
          </div>

          <Link
            href="/nz-console/categories"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            К категориям
          </Link>
        </header>

        <section className="mt-10">
          <BackLink href="/nz-console/categories" label="Назад к категориям" variant="admin" />

          <div className="mt-8">
            <div className="inline-flex rounded-full border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
              Редактирование категории
            </div>

            <h1 className="mt-5 text-5xl font-bold tracking-[-0.055em]">
              {category.name}
            </h1>

            <p className="mt-4 max-w-[760px] text-sm leading-relaxed text-white/55">
              Меняем данные категории в БД. Публичный сайт использует этот же slug, название, описание и SEO-поля.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/nz-console/products/new?category=${category.slug}`}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                Добавить карточку в категорию
              </Link>

              <Link
                href={`/nz-console/positions/new?category=${category.slug}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Добавить SKU в категорию
              </Link>

              <Link
                href={`/catalog/${category.slug}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Открыть на сайте
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                Связанные товары
              </div>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
                Карточки в категории
              </h2>

              <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-white/55">
                Здесь видно, какие материнские карточки уже привязаны к этой категории. SKU-позиции создаются внутри выбранной карточки, поэтому категорию они наследуют автоматически.
              </p>
            </div>

            <Link
              href={`/nz-console/products/new?category=${category.slug}`}
              className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Добавить карточку
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
            <div className="hidden grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr_160px] border-b border-white/10 bg-black/25 px-5 py-4 text-sm text-white/45 lg:grid">
              <div>Карточка</div>
              <div>Бренд</div>
              <div>SKU</div>
              <div>Статус</div>
              <div className="text-right">Действия</div>
            </div>

            <div className="divide-y divide-white/10">
              {products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="grid gap-4 bg-white/[0.015] p-5 lg:grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr_160px] lg:items-center"
                  >
                    <AdminCell label="Карточка">
                      <Link href={`/nz-console/products/${product.slug}`} className="font-semibold text-blue-300 transition-colors hover:text-blue-200">
                        {product.name}
                      </Link>
                    </AdminCell>

                    <AdminCell label="Бренд">{product.brand}</AdminCell>
                    <AdminCell label="SKU">{product.variantsCount}</AdminCell>
                    <AdminCell label="Статус">
                      <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${getAdminCategoryStatusClass(product.status)}`}>
                        {getAdminCategoryStatusLabel(product.status)}
                      </span>
                    </AdminCell>

                    <AdminCell label="Действия">
                      <div className="flex justify-start gap-2 lg:justify-end">
                        <Link
                          href={`/nz-console/positions/new?product=${product.slug}`}
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
                        >
                          + SKU
                        </Link>
                      </div>
                    </AdminCell>
                  </div>
                ))
              ) : (
                <div className="p-6 text-sm leading-relaxed text-white/50">
                  В этой категории пока нет карточек. Нажмите «Добавить карточку», чтобы создать первый товар сразу с выбранной категорией.
                </div>
              )}
            </div>
          </div>
        </section>

        <CategoryForm category={category} />
      </div>
    </main>
  );
}

function AdminCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs text-white/35 lg:hidden">{label}</div>
      <div className="text-sm text-white/70">{children}</div>
    </div>
  );
}
