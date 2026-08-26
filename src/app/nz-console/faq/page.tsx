import Link from "next/link";

import { FaqAdminClient } from "@/components/admin/faq-admin-client";

export const dynamic = "force-dynamic";

export default function AdminFaqPage() {
  return (
    <main className="min-h-screen bg-[#020814] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex min-h-[76px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 sm:px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden text-sm text-white/50 md:block">
            FAQ · разделы, вопросы и ответы
          </div>

          <div className="flex gap-2">
            <Link
              href="/faq"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium hover:border-blue-500/40 hover:bg-blue-500/10"
            >
              Открыть FAQ
            </Link>
            <Link
              href="/nz-console"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium hover:border-blue-500/40 hover:bg-blue-500/10"
            >
              В админку
            </Link>
          </div>
        </header>

        <section className="mt-8">
          <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">
            Управление FAQ
          </h1>
          <p className="mt-3 max-w-[800px] text-sm leading-relaxed text-white/55">
            Создавайте дополнительные разделы, добавляйте вопросы, меняйте
            порядок и временно скрывайте материалы без удаления.
          </p>
        </section>

        <section className="mt-8 pb-10">
          <FaqAdminClient />
        </section>
      </div>
    </main>
  );
}
