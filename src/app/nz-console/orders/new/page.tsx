import Link from "next/link";

import { OrderEditorForm } from "@/components/admin/order-editor-form";
import { getAuthSession } from "@/lib/auth";
import { getOrderEditorOptions } from "@/lib/admin-orders-db";
import { prisma } from "@/lib/db";
import { getOrderWorkflowSettings } from "@/lib/order-workflow-db";

export const dynamic = "force-dynamic";

export default async function NewAdminOrderPage() {
  const [options, session, workflow] = await Promise.all([
    getOrderEditorOptions(),
    getAuthSession(),
    getOrderWorkflowSettings(),
  ]);
  const currentAdmin = session?.login
    ? await prisma.adminUser.findUnique({ where: { login: session.login }, select: { id: true, name: true, login: true } })
    : null;

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-5 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-5">
          <Link href="/nz-console" className="text-xl font-bold">Neontech Console</Link>
          <Link href="/nz-console/orders" className="rounded-xl border border-white/10 px-4 py-3 text-sm">К заявкам</Link>
        </header>
        <section className="mt-8">
          <OrderEditorForm
            mode="create"
            customers={options.customers}
            positions={options.positions}
            staff={options.staff}
            workflow={workflow}
            defaultAssigneeId={currentAdmin?.id || ""}
            defaultAssigneeName={currentAdmin?.name || currentAdmin?.login || session?.name || session?.login || ""}
          />
        </section>
      </div>
    </main>
  );
}
