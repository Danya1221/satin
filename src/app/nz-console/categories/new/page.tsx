import { BackLink } from "@/components/back-link";
import Link from "next/link";

import { CategoryForm } from "@/components/admin/category-form";

export const dynamic = "force-dynamic";

export default function AdminNewCategoryPage() {
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
            <span>новая категория</span>
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
              Новая категория
            </div>

            <h1 className="mt-5 text-5xl font-bold tracking-[-0.055em]">
              Создание категории
            </h1>

            <p className="mt-4 max-w-[760px] text-sm leading-relaxed text-white/55">
              После сохранения категория появится в PostgreSQL. Если статус «Активна», она сразу будет доступна в каталоге сайта.
            </p>
          </div>
        </section>

        <CategoryForm />
      </div>
    </main>
  );
}
