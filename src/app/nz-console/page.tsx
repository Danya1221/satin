import Link from "next/link";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { getAdminDashboardData } from "@/lib/admin-dashboard-db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex min-h-[76px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 sm:px-6">
          <Link
            href="/nz-console"
            className="text-xl font-bold tracking-[-0.04em]"
          >
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Панель управления</span>
            <span>·</span>
            <span>данные из PostgreSQL</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
            >
              На сайт
            </Link>
            <AdminLogoutButton />
          </div>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <div className="inline-flex rounded-full border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
              Админ-панель
            </div>

            <h1 className="mt-6 max-w-[760px] text-4xl font-bold tracking-[-0.055em] sm:text-5xl md:text-6xl">
              Управление магазином
            </h1>

            <p className="mt-5 max-w-[720px] text-sm leading-relaxed text-white/55">
              Здесь собраны реальные данные магазина: карточки товаров, SKU,
              категории, клиенты, заявки и обращения. Цифры на главной панели
              больше не захардкожены и считаются из базы.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dashboard.metrics.map((metric) => (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                />
              ))}
            </div>
          </div>

          <aside className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
              Быстрые действия
            </div>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
              Что делаем
            </h2>

            <div className="mt-6 grid gap-3">
              <Link
                href="/nz-console/products/new"
                className="rounded-xl bg-blue-600 px-5 py-4 text-center text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Создать карточку
              </Link>

              <Link
                href="/nz-console/positions/new"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Добавить позицию
              </Link>

              <Link
                href="/nz-console/categories/new"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Создать категорию
              </Link>

              <Link
                href="/nz-console/orders"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Смотреть заявки
              </Link>

              <Link
                href="/nz-console/promocodes"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Промокоды и скидки
              </Link>

            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-[30px] border border-white/10 bg-white/[0.035] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/35 hover:bg-blue-500/[0.05]"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-[-0.035em]">
                    {section.title}
                  </h2>

                  <p className="mt-3 min-h-[72px] text-sm leading-relaxed text-white/55">
                    {section.description}
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {section.value}
                  </div>

                  <div className="mt-1 text-xs text-white/45">
                    {section.label}
                  </div>
                </div>
              </div>

              <div className="mt-7 inline-flex text-sm font-medium text-blue-400 transition-transform duration-300 group-hover:translate-x-1">
                Открыть раздел
              </div>
            </Link>
          ))}
        </section>

        <section className="my-10 rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                Активность
              </div>

              <h2 className="mt-3 text-4xl font-bold tracking-[-0.045em]">
                Последние события
              </h2>
            </div>

            <Link
              href="/nz-console/orders"
              className="w-fit rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
            >
              Смотреть заявки
            </Link>
          </div>

          {dashboard.recentActions.length > 0 ? (
            <div className="mt-8 grid gap-4">
              {dashboard.recentActions.map((action) => (
                <Link
                  key={`${action.title}-${action.href}-${action.createdAt.toISOString()}`}
                  href={action.href}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-blue-500/35 hover:bg-blue-500/[0.06]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{action.title}</h3>

                      <p className="mt-1 text-sm text-white/55">
                        {action.text}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-white/10 px-4 py-2 text-sm text-white/45">
                      {action.time}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm leading-relaxed text-white/55">
              Пока событий нет. Создай категорию, карточку товара или тестовую
              заявку — они появятся здесь автоматически.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="text-sm text-white/45">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}
