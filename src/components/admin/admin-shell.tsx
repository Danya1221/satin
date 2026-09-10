"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { StoreIcon } from "@/components/store-icon";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { allowedAdminNavigation } from "@/lib/admin-navigation";
import type { AdminRole } from "@/lib/auth";

export function AdminShell({ children, name, roles }: { children: ReactNode; name: string; roles: AdminRole[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);
  const links = allowedAdminNavigation(roles);
  const current = [...links].reverse().find(item => pathname === item.href || (item.href !== "/nz-console" && pathname.startsWith(item.href + "/")));
  useEffect(() => { try { setDark(localStorage.getItem("netizen-admin-theme") === "dark"); } catch {} }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  function toggleTheme() { setDark(value => { try { localStorage.setItem("netizen-admin-theme", value ? "light" : "dark"); } catch {} return !value; }); }
  const visible = links.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
  return <div className="admin-app" data-admin-theme={dark ? "dark" : "light"}>
    {open && <button className="admin-nav-scrim" aria-label="Закрыть меню" onClick={() => setOpen(false)} />}
    <aside className={`admin-sidebar ${open ? "is-open" : ""}`} aria-label="Управление магазином">
      <Link className="admin-wordmark" href="/nz-console"><span className="admin-symbol">S</span><span>Управление<span>Ваш магазин</span></span></Link>
      <label className="admin-nav-search"><StoreIcon name="search" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти раздел" aria-label="Найти раздел админки" /></label>
      <nav>{[...new Set(visible.map(item => item.group))].map(group => <div className="admin-nav-group" key={group}><p>{group}</p>{visible.filter(item => item.group === group).map(item => <Link key={item.href} href={item.href} aria-current={current?.href === item.href ? "page" : undefined}><StoreIcon name={item.icon} /><span>{item.title}</span></Link>)}</div>)}{!visible.length && <p className="admin-muted">Раздел не найден</p>}</nav>
      <div className="admin-sidebar-bottom"><Link href="/" target="_blank" rel="noopener noreferrer"><StoreIcon name="arrow" />Открыть магазин</Link><span>Панель управления</span></div>
    </aside>
    <div className="admin-workspace">
      <header className="admin-topbar"><div className="admin-topbar-title"><button className="admin-icon-button admin-mobile-toggle" aria-label="Открыть меню" aria-expanded={open} onClick={() => setOpen(!open)}><StoreIcon name="menu" /></button><span>Магазин</span><span className="admin-breadcrumb-slash">/</span><strong>{current?.title || "Управление"}</strong></div><div className="admin-topbar-actions"><button className="admin-icon-button" aria-label={dark ? "Светлая тема" : "Тёмная тема"} onClick={toggleTheme}><StoreIcon name={dark ? "sun" : "moon"} /></button><span className="admin-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span><span className="admin-user-name">{name}</span><AdminLogoutButton /></div></header>
      <div className="admin-page-content">{children}</div>
    </div>
  </div>;
}
