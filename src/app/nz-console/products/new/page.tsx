import { BackLink } from "@/components/back-link";
import Link from "next/link";

import { ProductCreateForm } from "@/components/admin/product-create-form";
import { getAdminCategories, getAdminProductFormSuggestions } from "@/lib/admin-products-db";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const [categories, suggestions] = await Promise.all([
    getAdminCategories(),
    getAdminProductFormSuggestions(),
  ]);

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 sm:px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Новая карточка</span>
            <span>·</span>
            <span>PostgreSQL</span>
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

          <div className="mt-8">
            <div className="inline-flex rounded-full border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
              Создание в БД
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
              Товарная карточка
            </h1>

            <p className="mt-4 max-w-[820px] text-sm leading-relaxed text-white/55">
              Создаём материнскую карточку и при необходимости первую SKU-позицию. Это уже не тестовый массив в файле — данные сохраняются через API в PostgreSQL.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <ProductCreateForm categories={categories} initialCategorySlug={resolvedSearchParams?.category} suggestions={suggestions} />
        </section>
      </div>
    </main>
  );
}
