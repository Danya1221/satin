import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { CategoryStatusToggle } from "@/components/admin/category-status-toggle";
import { SortOrderInput } from "@/components/admin/sort-order-input";

import {
  getAdminCategoriesDetailed,
  getAdminCategoryStatusClass,
  getAdminCategoryStatusLabel,
} from "@/lib/admin-categories-db";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategoriesDetailed();
  const activeCount = categories.filter((category) => category.status === "active").length;
  const productsCount = categories.reduce((sum, category) => sum + category.productsCount, 0);

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
            <span>структура каталога из БД</span>
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
              <div className="inline-flex rounded-full border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
                Каталог
              </div>

              <h1 className="mt-5 text-5xl font-bold tracking-[-0.055em]">
                Категории
              </h1>

              <p className="mt-4 max-w-[760px] text-sm leading-relaxed text-white/55">
                Здесь категории уже не макет: список приходит из PostgreSQL, а публичный каталог показывает только активные категории из этой же таблицы.
              </p>
            </div>

            <Link
              href="/nz-console/categories/new"
              className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Добавить категорию
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <MetricCard label="Всего категорий" value={String(categories.length)} />
          <MetricCard label="Активные" value={String(activeCount)} />
          <MetricCard label="Товаров в категориях" value={String(productsCount)} />
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <p className="text-sm leading-relaxed text-white/55">
              Поиск и фильтры на этой странице можно добавить следующим шагом. Сейчас главное — рабочий CRUD и связь с БД.
            </p>

            <Link
              href="/nz-console/categories/new"
              className="rounded-xl bg-blue-600 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Добавить категорию
            </Link>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035]">
          <div className="hidden grid-cols-[1fr_0.75fr_1.25fr_0.55fr_0.55fr_0.45fr_160px] border-b border-white/10 bg-black/25 px-5 py-4 text-sm text-white/45 lg:grid">
            <div>Название</div>
            <div>Slug</div>
            <div>Описание</div>
            <div>Товаров</div>
            <div>Статус</div>
            <div>Порядок</div>
            <div className="text-right">Действия</div>
          </div>

          <div className="divide-y divide-white/10">
            {categories.length === 0 ? (
              <div className="p-8 text-sm leading-relaxed text-white/55">
                Категорий в базе пока нет. Создай первую категорию или запусти seed: <span className="font-semibold text-white">npm run db:seed</span>.
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="grid gap-5 bg-white/[0.015] p-5 transition-colors hover:bg-blue-500/[0.04] lg:grid-cols-[1fr_0.75fr_1.25fr_0.55fr_0.55fr_0.45fr_160px] lg:items-center"
                >
                  <div>
                    <div className="text-lg font-bold">{category.name}</div>
                    <div className="mt-1 text-sm text-white/35">/catalog/{category.slug}</div>
                  </div>

                  <AdminCell label="Slug">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-white/65">
                      {category.slug}
                    </span>
                  </AdminCell>

                  <AdminCell label="Описание">
                    <span className="text-white/55">
                      {category.description || "Описание пока не задано"}
                    </span>
                  </AdminCell>

                  <AdminCell label="Товаров">
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
                      {category.productsCount}
                    </span>
                  </AdminCell>

                  <AdminCell label="Статус">
                    <span className={`rounded-full border px-3 py-1 text-sm ${getAdminCategoryStatusClass(category.status)}`}>
                      {getAdminCategoryStatusLabel(category.status)}
                    </span>
                  </AdminCell>

                  <AdminCell label="Порядок">
                    <SortOrderInput id={category.id} value={category.sortOrder} apiPath="/api/admin/categories" extraBody={{ name: category.name, slug: category.slug }} />
                  </AdminCell>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      href={`/nz-console/categories/${category.id}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
                    >
                      Изменить
                    </Link>
                    <Link
                      href={`/catalog/${category.slug}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/55 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
                    >
                      На сайте
                    </Link>
                    <CategoryStatusToggle id={category.id} status={category.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="my-8 rounded-[28px] border border-blue-500/25 bg-blue-500/10 p-6">
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            Готово к БД
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-[-0.035em]">
            Категории теперь управляются из админки
          </h2>

          <p className="mt-3 max-w-[980px] text-sm leading-relaxed text-white/55">
            Создание, редактирование и скрытие идут через API /api/admin/categories. На публичной части используются только категории со статусом «Активна».
          </p>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.035] p-6">
      <div className="text-sm text-white/45">{label}</div>
      <div className="mt-3 text-4xl font-bold">{value}</div>
    </div>
  );
}

function AdminCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs text-white/35 lg:hidden">{label}</div>
      <div className="text-sm text-white/70">{children}</div>
    </div>
  );
}
