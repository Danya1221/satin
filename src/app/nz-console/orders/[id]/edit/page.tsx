import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderEditorForm } from "@/components/admin/order-editor-form";
import { getAdminOrder, getOrderEditorOptions } from "@/lib/admin-orders-db";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrderWorkflowSettings } from "@/lib/order-workflow-db";

export const dynamic = "force-dynamic";

export default async function EditAdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, options, workflow, session] = await Promise.all([
    getAdminOrder(id),
    getOrderEditorOptions(),
    getOrderWorkflowSettings(),
    getAuthSession(),
  ]);

  if (!order) notFound();

  const currentAdmin = session?.login
    ? await prisma.adminUser.findUnique({
        where: { login: session.login },
        select: { id: true, name: true, login: true },
      })
    : null;

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-5 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-5">
          <Link href="/nz-console" className="text-xl font-bold">
            Neontech Console
          </Link>
          <Link
            href={`/nz-console/orders/${order.publicId}`}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm"
          >
            К заявке
          </Link>
        </header>

        <section className="mt-8">
          <OrderEditorForm
            mode="edit"
            customers={options.customers}
            positions={options.positions}
            staff={options.staff}
            workflow={workflow}
            initialOrder={{
              publicId: order.publicId,
              customerId: order.customerId || "",
              customerName: order.customerName,
              phone: order.phone,
              email: order.email,
              deliveryType: order.deliveryType,
              address: order.address,
              pickupPoint: order.pickupPoint,
              paymentMethod: order.paymentMethod,
              status: order.status,
              comment: order.comment,
              managerComment: order.managerComment,
              assignedToId: order.assignedToId || "",
              items: order.items.map((item) => ({
                variantId: item.variantId || "",
                quantity: item.quantity,
                price: item.price,
              })),
            }}
            defaultAssigneeId={currentAdmin?.id || ""}
            defaultAssigneeName={
              currentAdmin?.name || currentAdmin?.login || session?.name || session?.login || ""
            }
          />
        </section>
      </div>
    </main>
  );
}
