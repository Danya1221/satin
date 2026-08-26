import { BackLink } from "@/components/back-link";
import Link from "next/link";

import { PromocodesAdminClient } from "@/components/admin/promocodes-admin-client";

export const dynamic = "force-dynamic";

export default function PromocodesPage() {
  return (
    <main className="min-h-screen bg-[#020814] px-4 py-5 text-white sm:px-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-5">
          <Link href="/nz-console" className="text-xl font-bold">Neontech Console</Link>
          <BackLink href="/nz-console" label="В админку" variant="admin" />
        </header>
        <section className="mt-9">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">Скидки</div>
          <h1 className="mt-3 text-5xl font-bold tracking-[-0.05em]">Промокоды</h1>
          <p className="mt-3 max-w-[900px] text-sm leading-relaxed text-white/55">
            Создавайте промокоды, задавайте сроки, лимиты, минимальную сумму, статусы клиентов и условия по истории покупок.
          </p>
        </section>
        <PromocodesAdminClient />
      </div>
    </main>
  );
}
