import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerStatusCard } from "@/components/admin/customer-status-card";
import {
  getAdminCustomer,
  getClientStatusClass,
} from "@/lib/admin-customers-db";
import { getOrderStatusClass, getOrderStatusLabel } from "@/lib/admin-orders-db";

export const dynamic = "force-dynamic";

function getTicketStatusClass(status: string) {
  if (status === "Новое") {
    return "border-blue-500/35 bg-blue-500/10 text-blue-400";
  }

  if (status === "В работе") {
    return "border-purple-500/35 bg-purple-500/10 text-purple-300";
  }

  if (status === "Ожидает клиента") {
    return "border-orange-500/35 bg-orange-500/10 text-orange-300";
  }

  if (status === "Закрыто") {
    return "border-green-500/35 bg-green-500/10 text-green-300";
  }

  return "border-white/10 bg-white/[0.03] text-white/50";
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getAdminCustomer(id);

  if (!customer) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#020814] px-6 py-6 text-white">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Клиент</span>
            <span>·</span>
            <span>{customer.id}</span>
          </div>

          <Link
            href="/nz-console/users"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            К клиентам
          </Link>
        </header>

        <section className="mt-10">
          <BackLink href="/nz-console/users" label="Назад к клиентам" variant="admin" />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-blue-600 text-3xl font-bold">
                    {customer.initial}
                  </div>

                  <div>
                    <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                      Клиент из БД
                    </div>

                    <h1 className="mt-3 text-5xl font-bold tracking-[-0.055em]">
                      {customer.fullName}
                    </h1>

                    <p className="mt-4 max-w-[720px] text-sm leading-relaxed text-white/55">
                      Карточка клиента собирается из реальной регистрации, заказов, адресов доставки и обращений в поддержку.
                    </p>
                  </div>
                </div>

                <span className={`inline-flex w-fit whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${getClientStatusClass(customer.status)}`}>
                  {customer.status}
                </span>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <InfoCard label="Заявки" value={String(customer.ordersCount)} />
                <InfoCard label="Обращения" value={String(customer.ticketsCount)} />
                <InfoCard label="Покупки" value={customer.totalSpentLabel} />
                <InfoCard label="Регистрация" value={customer.registeredAtLabel} />
              </div>
            </div>

            <aside className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8">
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                Действия
              </div>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
                Управление
              </h2>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/catalog"
                  className="rounded-xl bg-blue-600 px-5 py-4 text-center text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                  Создать заявку
                </Link>

                <Link
                  href="/help"
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
                >
                  Создать обращение
                </Link>

                <Link
                  href="/nz-console/orders"
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
                >
                  Все заявки клиента
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-8">
          <CustomerStatusCard
            customerId={customer.id}
            progress={customer.statusProgress}
            rules={customer.statusRules}
          />
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8">
              <SectionTitle
                label="Заявки"
                title="История заказов"
                text="Все заявки клиента с привязкой к конкретным SKU и статусам."
              />

              <div className="mt-8 grid gap-4">
                {customer.orders.length === 0 ? (
                  <EmptyState text="У клиента пока нет заказов." />
                ) : (
                  customer.orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/nz-console/orders/${order.publicId}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-blue-500/35 hover:bg-blue-500/[0.04]"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-bold text-blue-400">{order.publicId}</div>

                          <h3 className="mt-2 text-lg font-bold">{order.product}</h3>

                          <div className="mt-1 text-sm text-white/35">{order.date}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-bold">{order.total}</span>

                          <span className={`rounded-full border px-3 py-1 text-sm ${getOrderStatusClass(order.status)}`}>
                            {getOrderStatusLabel(order.status, order.deliveryType)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8">
              <SectionTitle
                label="Обращения"
                title="Диалоги клиента"
                text="Все обращения клиента из общего центра поддержки, найденные по телефону или e-mail."
              />

              <div className="mt-8 grid gap-4">
                {customer.tickets.length === 0 ? (
                  <EmptyState text="У клиента пока нет обращений в поддержку." />
                ) : (
                  customer.tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/nz-console/support/${ticket.number}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-colors hover:border-blue-500/35 hover:bg-blue-500/[0.04]"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-bold text-blue-400">{ticket.number}</div>

                          <h3 className="mt-2 text-lg font-bold">{ticket.topic}</h3>

                          <div className="mt-1 text-sm text-white/35">
                            {ticket.linkedOrder} · {ticket.date}
                          </div>
                        </div>

                        <span className={`w-fit rounded-full border px-3 py-1 text-sm ${getTicketStatusClass(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8">
              <SectionTitle
                label="Доставка"
                title="Адреса и ПВЗ"
                text="Адреса, которые клиент использовал в заявках."
              />

              <div className="mt-8 grid gap-4">
                {customer.addresses.length === 0 ? (
                  <EmptyState text="Адреса пока не сохранены." />
                ) : (
                  customer.addresses.map((address) => (
                    <div key={address.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm text-white/40">{address.type}</div>

                          <div className="mt-2 font-bold">{address.value}</div>
                        </div>

                        <span className="w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
                          {address.isDefault ? "Основной" : "Использовался"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8">
              <SectionTitle
                label="Контакты"
                title="Данные клиента"
                text="Основные контактные данные для связи."
              />

              <div className="mt-6 grid gap-3">
                <InfoLine label="ID" value={customer.id} />
                <InfoLine label="Имя" value={customer.name || "Не указано"} />
                <InfoLine label="Фамилия" value={customer.lastName || "Не указана"} />
                <InfoLine label="Телефон" value={customer.phone} />
                <InfoLine label="E-mail" value={customer.email || "Не указан"} />
                <InfoLine label="Город" value={customer.city || "Не указан"} />
              </div>
            </section>

            <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-8">
              <SectionTitle
                label="CRM"
                title="Интеграция"
                text="Технические поля для будущей синхронизации с CRM."
              />

              <div className="mt-6 grid gap-3">
                <InfoLine label="CRM ID" value={customer.crmId || "Не создан"} />
                <InfoLine label="Аккаунт" value={customer.authLabel} />
                <InfoLine label="Дата регистрации" value={customer.registeredAtLabel} />
                <InfoLine label="Статус" value={customer.status} />
                <InfoLine
                  label="Режим статуса"
                  value={customer.statusProgress.isManual ? "Назначен вручную" : "Автоматический"}
                />
                <InfoLine label="Сумма покупок" value={customer.totalSpentLabel} />
                <InfoLine label="Последняя активность" value={customer.lastActivityLabel} />
              </div>
            </section>

            <section className="rounded-[34px] border border-blue-500/25 bg-blue-500/10 p-8">
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                CRM-lite
              </div>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
                Зачем нужна карточка клиента
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-white/55">
                Менеджер сразу видит, зарегистрирован ли клиент, какие заявки были раньше,
                какие обращения открыты и какие адреса использовались.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
        {label}
      </div>

      <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">{title}</h2>

      <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-white/50">
        {text}
      </p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-sm text-white/40">{label}</div>
      <div className="mt-2 font-bold">{value}</div>
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/45">
      {text}
    </div>
  );
}
