import Link from "next/link";
import { StoreIcon } from "@/components/store-icon";
import { getAdminDashboardData } from "@/lib/admin-dashboard-db";
import { getCurrentAdminRoles } from "@/lib/admin-access";
import { allowedAdminNavigation } from "@/lib/admin-navigation";
export const dynamic = "force-dynamic";
export default async function AdminDashboardPage() {
  const [dashboard, roles] = await Promise.all([getAdminDashboardData(), getCurrentAdminRoles()]);
  const navigation = allowedAdminNavigation(roles);
  const permitted = (href: string) => navigation.some(item => item.href !== "/nz-console" && (href === item.href || href.startsWith(item.href + "/")));
  return <>
    <div className="admin-page-heading"><div><p className="admin-eyebrow">Ваш магазин · сегодня</p><h1>Всё под контролем</h1><p>Заказы, каталог и забота о покупателях — в одном месте.</p></div><Link className="admin-secondary-button" href="/" target="_blank">Открыть магазин <StoreIcon name="arrow" /></Link></div>
    <div className="admin-metrics">{dashboard.metrics.map(metric => <article className="admin-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><span className="admin-muted">На текущий момент</span></article>)}</div>
    <div className="admin-dashboard-grid">
      <section className="admin-panel"><div className="admin-panel-heading"><h2>Рабочие разделы</h2><span className="admin-muted">Быстрый переход</span></div><div className="admin-shortcuts">{navigation.filter(item => item.href !== "/nz-console").map(item => <Link key={item.href} href={item.href}><span className="admin-shortcut-icon"><StoreIcon name={item.icon} /></span><span><strong>{item.title}</strong><small>{item.group}</small></span><StoreIcon name="arrow" /></Link>)}</div></section>
      <section className="admin-panel"><div className="admin-panel-heading"><h2>Последние события</h2><span className="admin-status-dot" /></div><div className="admin-activity">{dashboard.recentActions.filter(action => permitted(action.href)).map((action, index) => <Link key={action.href + index} href={action.href}><span className="admin-activity-dot"/><span><strong>{action.title}</strong><p>{action.text}</p><small>{action.time}</small></span><StoreIcon name="arrow" /></Link>)}{!dashboard.recentActions.some(action => permitted(action.href)) && <p className="admin-empty">Здесь появятся новые заказы и обращения.</p>}</div></section>
    </div>
  </>;
}
