import Link from "next/link";
import { redirect } from "next/navigation";

import { OrderWorkflowSettingsForm } from "@/components/admin/order-workflow-settings-form";
import { canAccessAdminSection } from "@/lib/admin-access";
import { getAuthSession } from "@/lib/auth";
import { getOrderWorkflowSettings } from "@/lib/order-workflow-db";

export const dynamic = "force-dynamic";

export default async function OrderSettingsPage() {
  const session = await getAuthSession();
  if (session?.role !== "admin" || !canAccessAdminSection(session, "order-settings")) {
    redirect("/nz-console/orders");
  }

  const settings = await getOrderWorkflowSettings();

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 sm:px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>
          <div className="hidden text-sm text-white/55 md:block">Настройки заявок</div>
          <Link
            href="/nz-console/orders"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            К заявкам →
          </Link>
        </header>

        <section className="mt-10">
          <Link href="/nz-console/orders" className="text-sm text-blue-400 transition-colors hover:text-blue-300">
            ← Назад к заявкам
          </Link>
          <div className="mt-7">
            <div className="inline-flex rounded-full border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
              CRM-настройки
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
              Настройки заявок
            </h1>
            <p className="mt-4 max-w-[850px] text-sm leading-relaxed text-white/55">
              Добавляй, скрывай и сортируй статусы отдельно для курьерской доставки и самовывоза. Изменения сразу применяются в карточках и фильтрах заявок.
            </p>
          </div>
        </section>

        <OrderWorkflowSettingsForm initialSettings={settings} />
      </div>
    </main>
  );
}
