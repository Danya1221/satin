import Link from "next/link";
import { notFound } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrderWorkflowSettings } from "@/lib/order-workflow-db";

import { OrderChatButton } from "@/components/admin/order-chat-button";
import { OrderEditorForm } from "@/components/admin/order-editor-form";
import {
  formatAdminDate,
  formatAdminPrice,
  getAdminOrder,
  getDeliveryLabel,
  getOrderEditorOptions,
  getOrderStatusClass,
  getOrderStatusLabel,
} from "@/lib/admin-orders-db";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const deliveryValue = order.deliveryType === "pickup"
    ? order.pickupPoint || "ПВЗ не указан"
    : order.address || "Адрес не указан";
  const discountData = order as typeof order & {
    subtotal?: number;
    statusDiscount?: number;
    promoDiscount?: number;
    promoCode?: string;
    discountTotal?: number;
  };

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-5 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-5">
          <Link href="/nz-console" className="text-xl font-bold">Neontech Console</Link>
          <div className="hidden text-sm text-white/50 md:block">Заявка · {order.publicId}</div>
          <div className="flex items-center gap-2">
            <Link href={`/nz-console/orders/${order.publicId}/edit`} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold hover:bg-blue-500">Редактировать</Link>
            <Link href="/nz-console/orders" className="rounded-xl border border-white/10 px-4 py-3 text-sm">К заявкам</Link>
          </div>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">Заявка</div>
                <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{order.publicId}</h1>
                <p className="mt-2 text-sm text-white/45">Создана: {formatAdminDate(order.createdAt)}</p>
              </div>
              <span className={`rounded-full border px-4 py-2 text-sm ${getOrderStatusClass(order.status, workflow, order.deliveryType)}`}>
                {getOrderStatusLabel(order.status, order.deliveryType, workflow)}
              </span>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="Клиент" value={order.customerName} hint={order.phone} />
              <InfoCard label="Получение" value={getDeliveryLabel(order.deliveryType)} hint={deliveryValue} />
              <InfoCard label="Ответственный" value={order.assignedToName || "Не назначен"} />
              <InfoCard
                label="Сумма"
                value={formatAdminPrice(order.total)}
                hint={
                  discountData.discountTotal
                    ? `До скидок: ${formatAdminPrice(discountData.subtotal || order.total)}`
                    : undefined
                }
              />
              {discountData.discountTotal ? (
                <InfoCard
                  label="Скидки"
                  value={`−${formatAdminPrice(discountData.discountTotal)}`}
                  hint={
                    discountData.promoCode
                      ? `Промокод: ${discountData.promoCode}`
                      : discountData.statusDiscount
                        ? "Скидка по статусу клиента"
                        : undefined
                  }
                />
              ) : null}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">Связь с клиентом</div>
            <h2 className="mt-2 text-2xl font-bold">Чат по заявке</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              Создаёт или открывает диалог, привязанный именно к этой заявке.
            </p>
            <div className="mt-5"><OrderChatButton orderId={order.publicId} /></div>
            {order.supportRequests[0] ? (
              <Link href={`/nz-console/support/${order.supportRequests[0].publicId}`} className="mt-3 block text-center text-sm text-blue-400">
                Открыть существующий чат {order.supportRequests[0].publicId}
              </Link>
            ) : null}
          </div>
        </section>

        <section className="mt-6">
          <OrderEditorForm
            mode="edit"
            customers={options.customers}
            positions={options.positions}
            staff={options.staff}
            workflow={workflow}
            defaultAssigneeId={currentAdmin?.id || ""}
            defaultAssigneeName={currentAdmin?.name || currentAdmin?.login || session?.name || session?.login || ""}
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
                variantId:
                  item.variantId || options.positions.find((position) => position.sku === item.sku)?.id || "",
                quantity: item.quantity,
                price: item.price,
              })),
            }}
          />
        </section>

        <section className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.035] p-6 sm:p-7">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">История</div>
          <h2 className="mt-2 text-3xl font-bold">Журнал изменений</h2>
          <div className="mt-5 grid gap-3">
            {order.changes.map((change) => (
              <div key={change.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold">{change.action}</div>
                  <div className="text-xs text-white/40">{formatAdminDate(change.createdAt)}</div>
                </div>
                <div className="mt-1 text-sm text-white/55">{change.adminName}</div>
                {change.details ? <div className="mt-2 text-sm text-white/70">{change.details}</div> : null}
              </div>
            ))}
            {!order.changes.length ? <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/40">Изменений пока нет.</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-xs uppercase tracking-[0.16em] text-white/40">{label}</div><div className="mt-2 font-bold">{value}</div>{hint ? <div className="mt-1 text-sm text-white/45">{hint}</div> : null}</div>;
}
