import { getAuthSession } from "@/lib/auth";
import { canAccessAdminSection } from "@/lib/admin-access";
import Link from "next/link";
import { CustomerStatusSettingsForm } from "@/components/admin/customer-status-settings-form";
import { getCustomerStatusRules } from "@/lib/customer-status-db";
import {
  getAdminCustomers,
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
  searchParams?: Promise<{ q?: string; status?: string; page?: string }>;
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

  const page=Math.max(1,Number(params?.page)||1);
  const canManageRules=canAccessAdminSection(await getAuthSession(),"settings");
  return <main><div className="admin-page-heading"><div><p className="admin-eyebrow">Покупатели</p><h1>Клиенты</h1><p>Контакты, покупки и история общения.</p></div><Link href="/nz-console/orders" className="admin-primary-button">Открыть заказы</Link></div>
    <div className="admin-metrics">{[["Всего",metrics.total],["Новые",metrics.new],["Постоянные",metrics.regular],["VIP",metrics.vip]].map(([label,value])=><div className="admin-metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <section className="admin-panel"><form className="admin-search-row"><input name="q" defaultValue={query} placeholder="Имя, телефон или почта" aria-label="Поиск клиента"/><select name="status" defaultValue={statusFilter} aria-label="Статус клиента">{statusTabs.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select><button className="admin-primary-button">Найти</button><Link href="/nz-console/users" className="admin-secondary-button">Сбросить</Link></form>
    <div className="admin-editor-tabs">{tabs.map(t=><Link key={t.value} className="admin-secondary-button" aria-current={t.active?"page":undefined} href={`/nz-console/users?status=${t.value}&q=${encodeURIComponent(query)}`}>{t.label} <span className="admin-count">{t.count}</span></Link>)}</div>
    <div className="admin-customer-list">{filteredCustomers.slice((page-1)*50,page*50).map(c=><Link className="admin-customer-row" key={c.id} href={`/nz-console/users/${c.id}`}><div><strong>{c.fullName}</strong><small>{c.phone}{c.email?` · ${c.email}`:""}</small></div><span className="admin-status-pill">{c.status}</span><div><strong>{c.totalSpentLabel}</strong><small>{c.completedOrdersCount} завершённых заказов</small></div><span aria-hidden="true">→</span></Link>)}{filteredCustomers.length===0&&<p className="admin-empty">Клиенты не найдены. Измените поиск или фильтр.</p>}</div>
    {filteredCustomers.length>50&&<div className="admin-search-row">{page>1&&<Link className="admin-secondary-button" href={`?page=${page-1}&q=${encodeURIComponent(query)}&status=${statusFilter}`}>Назад</Link>}<span>Страница {page}</span>{page*50<filteredCustomers.length&&<Link className="admin-secondary-button" href={`?page=${page+1}&q=${encodeURIComponent(query)}&status=${statusFilter}`}>Далее</Link>}</div>}</section>
    {canManageRules&&<details className="admin-panel admin-loyalty"><summary><strong>Правила лояльности и скидок</strong><span className="admin-muted">Настроить условия перехода в Постоянный / VIP</span></summary><CustomerStatusSettingsForm initialRules={statusRules}/></details>}
  </main>;
}
