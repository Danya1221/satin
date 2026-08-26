import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { canAccessAdminSection } from "@/lib/admin-access";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  formatAdminDate,
  formatAdminPrice,
  getAdminOrders,
  getDeliveryLabel,
  getOrderMetrics,
} from "@/lib/admin-orders-db";
import { getOrderWorkflowSettings } from "@/lib/order-workflow-db";
import {
  getCombinedOrderStatuses,
  getOrderStatusClass,
  getOrderStatusLabel,
  type OrderWorkflowSettings,
} from "@/lib/order-status";

export const dynamic = "force-dynamic";

type OrderStatusFilter = string;
type DateFilter = "all" | "today" | "week" | "month";
type ResponsibleFilter = "all" | "mine" | "unassigned";

type SearchParams = {
  q?: string | string[];
  status?: string | string[];
  date?: string | string[];
  responsible?: string | string[];
};

type AdminOrdersPageProps = {
  searchParams?: Promise<SearchParams>;
};

const dateOptions: Array<{ label: string; value: DateFilter }> = [
  { label: "За всё время", value: "all" },
  { label: "Сегодня", value: "today" },
  { label: "7 дней", value: "week" },
  { label: "30 дней", value: "month" },
];

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeDateFilter(value: string): DateFilter {
  if (value === "today" || value === "week" || value === "month") {
    return value;
  }

  return "all";
}

function normalizeResponsibleFilter(value: string): ResponsibleFilter {
  if (value === "mine" || value === "unassigned") return value;
  return "all";
}

function getDateStart(filter: DateFilter) {
  const now = new Date();

  if (filter === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (filter === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (filter === "month") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  return null;
}

function orderMatchesBaseFilters(
  order: Awaited<ReturnType<typeof getAdminOrders>>[number],
  filters: { query: string; date: DateFilter },
  workflow: OrderWorkflowSettings,
) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  if (normalizedQuery) {
    const itemsText = order.items
      .map((item) =>
        [
          item.title,
          item.productTitle,
          item.sku,
          item.brand,
          item.memory,
          item.color,
          item.sim,
        ].join(" "),
      )
      .join(" ");

    const searchableText = [
      order.publicId,
      order.customerName,
      order.phone,
      order.email,
      order.address,
      order.pickupPoint,
      order.assignedToName,
      getDeliveryLabel(order.deliveryType),
      getOrderStatusLabel(order.status, order.deliveryType, workflow),
      itemsText,
    ]
      .join(" ")
      .toLowerCase();

    if (!searchableText.includes(normalizedQuery)) {
      return false;
    }
  }

  const dateStart = getDateStart(filters.date);

  if (dateStart && order.createdAt < dateStart) {
    return false;
  }

  return true;
}

function orderMatchesStatus(
  order: Awaited<ReturnType<typeof getAdminOrders>>[number],
  status: OrderStatusFilter,
) {
  if (status === "all") {
    return true;
  }

  return order.status === status;
}

function getTabCount(
  orders: Awaited<ReturnType<typeof getAdminOrders>>,
  status: OrderStatusFilter,
) {
  if (status === "all") {
    return orders.length;
  }

  return orders.filter((order) => order.status === status).length;
}

function createOrdersHref(params: {
  query: string;
  status: OrderStatusFilter;
  date: DateFilter;
  responsible: ResponsibleFilter;
}) {
  const queryParams = new URLSearchParams();

  if (params.query.trim()) {
    queryParams.set("q", params.query.trim());
  }

  if (params.status !== "all") {
    queryParams.set("status", params.status);
  }

  if (params.date !== "all") queryParams.set("date", params.date);
  if (params.responsible !== "all")
    queryParams.set("responsible", params.responsible);

  const queryString = queryParams.toString();
  return queryString
    ? `/nz-console/orders?${queryString}`
    : "/nz-console/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const rawParams = (await searchParams) ?? {};
  const [allOrders, metrics, session, workflow] = await Promise.all([
    getAdminOrders(),
    getOrderMetrics(),
    getAuthSession(),
    getOrderWorkflowSettings(),
  ]);
  const currentAdmin = session?.login
    ? await prisma.adminUser.findUnique({
        where: { login: session.login },
        select: { id: true, name: true },
      })
    : null;

  const configuredStatuses = getCombinedOrderStatuses(workflow);
  const statusTabs: Array<{ label: string; value: string }> = [
    { label: "Все", value: "all" },
    ...configuredStatuses,
  ];
  const requestedStatus = readParam(rawParams.status);
  const selectedStatus = configuredStatuses.some(
    (status) => status.value === requestedStatus,
  )
    ? requestedStatus
    : "all";
  const canManageOrderSettings = canAccessAdminSection(
    session,
    "order-settings",
  );

  const searchQuery = readParam(rawParams.q);
  const selectedDate = normalizeDateFilter(readParam(rawParams.date));
  const selectedResponsible = normalizeResponsibleFilter(
    readParam(rawParams.responsible),
  );

  const baseFilteredOrders = allOrders.filter((order) =>
    orderMatchesBaseFilters(
      order,
      {
        query: searchQuery,
        date: selectedDate,
      },
      workflow,
    ),
  );

  const responsibleOrders = baseFilteredOrders.filter((order) => {
    if (selectedResponsible === "unassigned") return !order.assignedToId;
    if (selectedResponsible === "mine")
      return Boolean(
        currentAdmin?.id && order.assignedToId === currentAdmin.id,
      );
    return true;
  });
  const orders = responsibleOrders.filter((order) =>
    orderMatchesStatus(order, selectedStatus),
  );

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 sm:px-6">
          <Link
            href="/nz-console"
            className="text-xl font-bold tracking-[-0.04em]"
          >
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Заявки</span>
            <span>·</span>
            <span>PostgreSQL</span>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 sm:px-5"
          >
            На сайт
          </Link>
        </header>

        <section className="mt-10">
          <BackLink href="/nz-console" label="В админку" variant="admin" />

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
                Заявки из БД
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
                Заявки
              </h1>

              <p className="mt-4 max-w-[780px] text-sm leading-relaxed text-white/55">
                Здесь появляются реальные заявки из корзины. В заявке
                сохраняется конкретная позиция / SKU, цена на момент оформления,
                данные клиента и способ получения.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {canManageOrderSettings ? (
                <Link
                  href="/nz-console/orders/settings"
                  className="rounded-xl border border-blue-500/35 bg-blue-500/10 px-6 py-4 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
                >
                  Настройки заявок
                </Link>
              ) : null}
              <Link
                href="/nz-console/orders/new"
                className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                + Создать заявку
              </Link>
              <Link
                href="/catalog"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-7 py-4 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Создать через сайт
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <MetricCard label="Всего заявок" value={String(metrics.total)} />
          <MetricCard label="Новые" value={String(metrics.new)} />
          <MetricCard label="В работе" value={String(metrics.inWork)} />
          <MetricCard
            label="Сумма сегодня"
            value={formatAdminPrice(metrics.todayTotal)}
          />
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap gap-2 border-b border-white/10">
            {statusTabs.map((tab) => {
              const active = tab.value === selectedStatus;
              const href = createOrdersHref({
                query: searchQuery,
                status: tab.value,
                date: selectedDate,
                responsible: selectedResponsible,
              });

              return (
                <Link
                  key={tab.value}
                  href={href}
                  className={`relative px-4 py-4 text-sm font-medium transition-colors ${
                    active ? "text-white" : "text-white/45 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-white/45"
                    }`}
                  >
                    {getTabCount(responsibleOrders, tab.value)}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-blue-500" />
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <form
            className="flex flex-col gap-3 lg:flex-row"
            action="/nz-console/orders"
          >
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Поиск по заявке, клиенту, телефону, товару или SKU"
              className="h-12 flex-1 rounded-xl border border-white/10 bg-black/20 px-5 text-sm text-white outline-none placeholder:text-white/35 focus:border-blue-500/50"
            />

            <select
              name="status"
              defaultValue={selectedStatus}
              className="h-12 rounded-xl border border-white/10 bg-[#07101d] px-5 text-sm font-medium text-white outline-none transition-colors focus:border-blue-500/50"
            >
              {statusTabs.map((tab) => (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              ))}
            </select>

            <select
              name="date"
              defaultValue={selectedDate}
              className="h-12 rounded-xl border border-white/10 bg-[#07101d] px-5 text-sm font-medium text-white outline-none transition-colors focus:border-blue-500/50"
            >
              {dateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              name="responsible"
              defaultValue={selectedResponsible}
              className="h-12 rounded-xl border border-white/10 bg-[#07101d] px-5 text-sm font-medium text-white outline-none focus:border-blue-500/50"
            >
              <option value="all">Все ответственные</option>
              <option value="mine">Мои заявки</option>
              <option value="unassigned">Без ответственного</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Применить
            </button>

            {(searchQuery ||
              selectedStatus !== "all" ||
              selectedDate !== "all" ||
              selectedResponsible !== "all") && (
              <Link
                href="/nz-console/orders"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
              >
                Сбросить
              </Link>
            )}
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035]">
          <div className="hidden grid-cols-[0.65fr_0.9fr_1.35fr_0.65fr_0.75fr_0.75fr_0.85fr_110px] border-b border-white/10 bg-black/25 px-5 py-4 text-sm text-white/45 xl:grid">
            <div>Заявка</div>
            <div>Клиент</div>
            <div>Товары</div>
            <div>Сумма</div>
            <div>Получение</div>
            <div>Статус</div>
            <div>Ответственный</div>
            <div className="text-right">Открыть</div>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center text-sm text-white/45">
              По текущим фильтрам заявок нет.
            </div>
          ) : (
            orders.map((order) => {
              const firstItem = order.items[0];
              const itemsLabel = order.items
                .map((item) => `${item.title} × ${item.quantity}`)
                .join(", ");

              return (
                <div
                  key={order.id}
                  className="grid gap-4 border-b border-white/10 px-5 py-5 last:border-b-0 xl:grid-cols-[0.65fr_0.9fr_1.35fr_0.65fr_0.75fr_0.75fr_0.85fr_110px] xl:items-center"
                >
                  <div>
                    <div className="font-bold">{order.publicId}</div>
                    <div className="mt-1 text-xs text-white/45">
                      {formatAdminDate(order.createdAt)}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold">{order.customerName}</div>
                    <div className="mt-1 text-xs text-white/45">
                      {order.phone}
                    </div>
                    {order.email && (
                      <div className="mt-1 text-xs text-white/35">
                        {order.email}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold">
                      {itemsLabel || "Без товаров"}
                    </div>
                    <div className="mt-1 text-xs text-white/45">
                      {firstItem?.sku ?? "SKU не указан"}
                    </div>
                  </div>

                  <div className="font-bold">
                    {formatAdminPrice(order.total)}
                  </div>

                  <div className="text-sm text-white/70">
                    {getDeliveryLabel(order.deliveryType)}
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs ${getOrderStatusClass(order.status, workflow, order.deliveryType)}`}
                    >
                      {getOrderStatusLabel(
                        order.status,
                        order.deliveryType,
                        workflow,
                      )}
                    </span>
                  </div>

                  <div className="text-sm text-white/60">
                    {order.assignedToName || "Не назначен"}
                  </div>

                  <div className="xl:text-right">
                    <Link
                      href={`/nz-console/orders/${order.publicId}`}
                      className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
                    >
                      Открыть
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.035] p-6">
      <div className="text-sm text-white/45">{label}</div>
      <div className="mt-3 text-4xl font-bold tracking-[-0.05em]">{value}</div>
    </div>
  );
}
