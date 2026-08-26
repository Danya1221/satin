import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { CustomerStatusSettingsForm } from "@/components/admin/customer-status-settings-form";
import { getCustomerStatusRules } from "@/lib/customer-status-db";
import {
  getAdminCustomers,
  getClientStatusClass,
  getCustomerMetrics,
} from "@/lib/admin-customers-db";

export const dynamic = "force-dynamic";

const statusTabs = [
  { label: "Все", value: "all" },
  { label: "Новые", value: "new" },
  { label: "Постоянные", value: "regular" },
  { label: "VIP", value: "vip" },
];

function normalize(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function matchesStatus(status: string, filter: string) {
  if (filter === "new") return status === "Новый клиент";
  if (filter === "regular") return status === "Постоянный клиент";
  if (filter === "vip") return status === "VIP";
  return true;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const statusFilter = params?.status ?? "all";
  const [customers, metrics, statusRules] = await Promise.all([
    getAdminCustomers(),
    getCustomerMetrics(),
    getCustomerStatusRules(),
  ]);
  const normalizedQuery = normalize(query);

  const filteredCustomers = customers.filter((customer) => {
    const queryMatch = normalizedQuery
      ? [customer.fullName, customer.name, customer.lastName, customer.phone, customer.email, customer.city, customer.crmId]
          .some((value) => normalize(value).includes(normalizedQuery))
      : true;

    return queryMatch && matchesStatus(customer.status, statusFilter);
  });

  const tabs = statusTabs.map((tab) => ({
    ...tab,
    active: statusFilter === tab.value,
    count:
      tab.value === "all"
        ? customers.length
        : customers.filter((customer) => matchesStatus(customer.status, tab.value)).length,
  }));

  return (
    <main className="min-h-screen bg-[#020814] px-6 py-6 text-white">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Клиенты</span>
            <span>·</span>
            <span>PostgreSQL + заказы + поддержка</span>
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
                Клиентская база из БД
              </div>

              <h1 className="mt-5 text-5xl font-bold tracking-[-0.055em]">
                Клиенты
              </h1>

              <p className="mt-4 max-w-[820px] text-sm leading-relaxed text-white/55">
                Клиенты больше не макет: они создаются при регистрации, заказе или обращении. Админка показывает реальные контакты,
                историю покупок, сумму заказов, обращения и дату создания аккаунта.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/nz-console/orders"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-7 py-4 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Перейти к заявкам
              </Link>

              <Link
                href="/catalog"
                className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Создать клиента через заказ
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <MetricCard label="Всего клиентов" value={String(metrics.total)} />
          <MetricCard label="Новые" value={String(metrics.new)} />
          <MetricCard label="Постоянные" value={String(metrics.regular)} />
          <MetricCard label="VIP" value={String(metrics.vip)} />
        </section>

        <div className="mt-8">
          <CustomerStatusSettingsForm initialRules={statusRules} />
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap gap-2 border-b border-white/10">
            {tabs.map((tab) => {
              const href = query
                ? `/nz-console/users?status=${tab.value}&q=${encodeURIComponent(query)}`
                : `/nz-console/users?status=${tab.value}`;

              return (
                <Link
                  key={tab.value}
                  href={href}
                  className={`relative px-4 py-4 text-sm font-medium transition-colors ${
                    tab.active ? "text-white" : "text-white/45 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>

                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      tab.active ? "bg-blue-600 text-white" : "bg-white/10 text-white/45"
                    }`}
                  >
                    {tab.count}
                  </span>

                  {tab.active && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-blue-500" />}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <form className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row">
              <input
                name="q"
                defaultValue={query}
                placeholder="Поиск по имени / фамилии / телефону / e-mail / городу"
                className="h-12 flex-1 rounded-xl border border-white/10 bg-black/20 px-5 text-sm text-white outline-none placeholder:text-white/35 focus:border-blue-500/50"
              />

              <select
                name="status"
                defaultValue={statusFilter}
                className="h-12 rounded-xl border border-white/10 bg-[#06101f] px-5 text-sm font-medium text-white outline-none focus:border-blue-500/50"
              >
                {statusTabs.map((tab) => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label}
                  </option>
                ))}
              </select>

              <button className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500">
                Найти
              </button>

              <Link
                href="/nz-console/users"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-center text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Сбросить
              </Link>
            </div>
          </form>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="grid gap-4">
            {filteredCustomers.length === 0 ? (
              <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-10 text-center text-sm text-white/45">
                Клиентов пока нет. Зарегистрируйте клиента, оформите заказ или создайте обращение с телефоном.
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/nz-console/users/${customer.id}`}
                  className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/35 hover:bg-blue-500/[0.04]"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
                        {customer.initial}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-bold tracking-[-0.035em]">
                            {customer.fullName}
                          </h2>

                          <span className={`rounded-full border px-3 py-1 text-sm ${getClientStatusClass(customer.status)}`}>
                            {customer.status}
                          </span>
                          {customer.statusProgress.isManual ? (
                            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300">
                              вручную
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 text-sm text-white/45">
                          {customer.authLabel} · {customer.city || "Город не указан"}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/55">
                          <span>{customer.phone}</span>
                          {customer.email ? (
                            <>
                              <span>·</span>
                              <span>{customer.email}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[560px]">
                      <MiniStat label="Завершено" value={String(customer.completedOrdersCount)} />
                      <MiniStat label="Учтено" value={String(customer.countedOrdersCount)} />
                      <MiniStat label="Покупки" value={customer.totalSpentLabel} />
                      <MiniStat label="До уровня" value={`${customer.statusProgress.progressPercent}%`} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <aside className="space-y-5">
            <section className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6">
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                CRM-lite
              </div>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
                Что хранит клиент
              </h2>

              <div className="mt-6 grid gap-3">
                <InfoLine label="Контакты" value="телефон, e-mail" />
                <InfoLine label="Заявки" value="история покупок" />
                <InfoLine label="Обращения" value="чаты и темы" />
                <InfoLine label="Доставка" value="адреса / ПВЗ" />
                <InfoLine label="Статусы" value="Новый / Постоянный / VIP" />
                <InfoLine label="Расчёт" value="автоматически или вручную" />
              </div>
            </section>

            <section className="rounded-[30px] border border-blue-500/25 bg-blue-500/10 p-6">
              <div className="font-semibold text-blue-400">
                Как попадает клиент
              </div>

              <p className="mt-3 text-sm leading-relaxed text-white/55">
                Клиент появляется сразу после регистрации на сайте. Заказы, адреса и обращения потом подтягиваются
                в эту же карточку по привязке к Customer в базе.
              </p>
            </section>
          </aside>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs text-white/35">{label}</div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
      <span className="text-white/45">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
