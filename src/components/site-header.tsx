"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AuthModal } from "@/components/auth-modal";
import { useTheme } from "@/components/theme-provider";
import { StoreIcon, type StoreIconName } from "@/components/store-icon";
import { useStoreSettings, storeContact } from "@/components/store-settings";

type AuthMode = "login" | "register";
type HeaderAuthUser = { role: "customer" | "admin"; profile?: { name?: string; lastName?: string; phone?: string; email?: string } };
type SearchProduct = { slug: string; name: string; brand: string; image: string; price: string };
type HeaderCategory = { id: string; name: string; slug?: string; href?: string };
const bottomNav: { key: "Home" | "Catalog" | "New" | "Support" | "Cart"; label: string; href: string; icon: StoreIconName }[] = [
  { key: "Home", label: "Главная", href: "/", icon: "home" },
  { key: "Catalog", label: "Каталог", href: "/catalog", icon: "grid" },
  { key: "New", label: "Новинки", href: "/new", icon: "sparkles" },
  { key: "Support", label: "Помощь", href: "/help", icon: "help" },
  { key: "Cart", label: "Корзина", href: "/cart", icon: "bag" },
];

export function SiteHeader() {
  const { dark, toggleTheme } = useTheme();
  const pathname = usePathname() || "/";
  const site = useStoreSettings();
  const [categories, setCategories] = useState<HeaderCategory[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [authUser, setAuthUser] = useState<HeaderAuthUser | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authOpen, setAuthOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const phoneRoot = useRef<HTMLDivElement>(null);
  const phoneButton = useRef<HTMLButtonElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const searchRoot = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const name = site?.branding?.storeName?.trim() || "Магазин техники";
  const logo = dark ? site?.branding?.logoLight : site?.branding?.logoDark;
  const phone = storeContact(site?.contacts?.phone);
  const contactPhone = site?.contacts?.phone?.trim() || "";
  const phoneHref = `tel:${contactPhone.replace(/[^\d+]/g, "")}`;
  const phoneText = site?.contacts?.phoneText?.trim() || site?.contacts?.workingHours?.trim() || "";
  const accountHref = authUser?.role === "admin" ? "/nz-console" : "/profile";

  useEffect(() => {
    document.body.classList.add("has-mobile-bottom-nav");
    return () => document.body.classList.remove("has-mobile-bottom-nav");
  }, []);

  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("search") ?? "");
    setSearchOpen(false);
    setPhoneOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("netizen-search-history") || "[]");
      setHistory(Array.isArray(saved) ? saved.filter((value): value is string => typeof value === "string").slice(0, 8) : []);
    } catch { setHistory([]); }
    const controller = new AbortController();
    fetch("/api/categories", { signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then(data => { if (Array.isArray(data?.categories)) setCategories(data.categories); })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const updateCart = () => {
      try { const count = Number(localStorage.getItem("netizen-cart-count") || "0"); setCartCount(Number.isFinite(count) ? Math.max(0, count) : 0); }
      catch { setCartCount(0); }
    };
    let active = true;
    const updateAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (active) setAuthUser(data.authenticated && data.user ? data.user : null);
      } catch { if (active) setAuthUser(null); }
    };
    const openAuth = (event: Event) => { setAuthMode((event as CustomEvent<AuthMode>).detail ?? "login"); setAuthOpen(true); };
    updateCart(); void updateAuth();
    window.addEventListener("storage", updateCart);
    window.addEventListener("storage", updateAuth);
    window.addEventListener("netizen-cart-updated", updateCart);
    window.addEventListener("netizen-auth-updated", updateAuth);
    window.addEventListener("netizen-open-auth", openAuth);
    return () => {
      active = false;
      window.removeEventListener("storage", updateCart);
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("netizen-cart-updated", updateCart);
      window.removeEventListener("netizen-auth-updated", updateAuth);
      window.removeEventListener("netizen-open-auth", openAuth);
    };
  }, []);

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!searchRoot.current?.contains(event.target as Node)) setSearchOpen(false);
      if (!phoneRoot.current?.contains(event.target as Node)) setPhoneOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const controller = new AbortController();
    setLoading(true); setSearchError(false);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/catalog-search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("search unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) setResults(Array.isArray(data.products) ? data.products : []);
      } catch {
        if (!controller.signal.aborted) { setResults([]); setSearchError(true); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, query.trim() ? 220 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, searchOpen]);

  function saveQuery(value: string) {
    const next = [value, ...history.filter(item => item.toLowerCase() !== value.toLowerCase())].slice(0, 8);
    setHistory(next);
    try { localStorage.setItem("netizen-search-history", JSON.stringify(next)); } catch { /* Search still works without storage. */ }
  }
  function search(value: string) {
    const clean = value.trim();
    if (clean) saveQuery(clean);
    window.location.href = clean ? `/catalog?search=${encodeURIComponent(clean)}` : "/catalog";
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); search(query); }
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return <>
    <header className="store-header">
      <div className="store-utility">
        <span className="store-utility-tag">Техника для вашего ритма жизни</span>
        <div className="store-utility-links">
          <Link href="/faq">Вопросы и ответы</Link>
          {phone ? <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a> : <Link href="/help">Связаться с нами</Link>}
        </div>
      </div>
      <div className="store-header-main">
        <Link href="/" className="store-brand" aria-label={`${name} — главная`}>
          {logo ? <img src={logo} alt={name} width={170} height={40} decoding="async" /> : <><span className="store-brand-mark" aria-hidden="true" /><span className="store-brand-word">{name}</span></>}
        </Link>
        <Link href="/catalog" className="store-catalog-button"><StoreIcon name="grid" /> Каталог</Link>
        <div className="store-search-root" ref={searchRoot} onKeyDown={event => {
          if (event.key === "Escape") { searchInput.current?.focus(); setSearchOpen(false); }
          if (event.key === "ArrowDown" && event.target === searchInput.current) { event.preventDefault(); searchRoot.current?.querySelector<HTMLAnchorElement>(".store-search-result")?.focus(); }
        }} onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
          <form className="store-search" role="search" onSubmit={submit}>
            <StoreIcon name="search" />
            <input ref={searchInput} value={query} onChange={event => { setQuery(event.target.value); setSearchOpen(true); setPhoneOpen(false); }} onFocus={() => { setSearchOpen(true); setPhoneOpen(false); }} aria-label="Поиск товаров" aria-controls={searchOpen ? "store-search-results" : undefined} placeholder="Найти то самое" autoComplete="off" type="search" />
            {query && <button type="button" aria-label="Очистить поиск" onClick={() => { setQuery(""); searchInput.current?.focus(); }}><StoreIcon name="close" /></button>}
            <button type="submit" aria-label="Найти товары"><StoreIcon name="arrow" /></button>
          </form>
          {searchOpen && <div className="store-search-results" id="store-search-results" role="region" aria-label="Результаты поиска">
            {!query.trim() && history.length > 0 && <>
              <div className="store-search-meta"><span>Недавно искали</span><button type="button" onClick={() => { setHistory([]); try { localStorage.removeItem("netizen-search-history"); } catch {} }}>Очистить</button></div>
              <div className="store-search-history">{history.map(item => <button type="button" key={item} onClick={() => search(item)}>{item}</button>)}</div>
            </>}
            <div className="store-search-meta"><span>{query.trim() ? "Найденные товары" : "Из каталога"}</span></div>
            <div role="status" aria-live="polite" className={loading || searchError || !results.length ? "store-search-status" : undefined}>
              {loading ? "Ищем товары…" : searchError ? "Не удалось загрузить подсказки. Попробуйте открыть каталог." : !results.length ? query.trim() ? "Пока ничего не нашли. Попробуйте другое название." : "Введите название модели или бренда." : null}
            </div>
            {!loading && results.slice(0, 6).map(product => <Link key={product.slug} href={`/product/${product.slug}`} className="store-search-result" onClick={() => { if (query.trim()) saveQuery(query.trim()); setSearchOpen(false); }}>
              {product.image ? <img src={product.image} alt="" width={54} height={60} /> : <StoreIcon name="grid" />}
              <div><strong>{product.name}</strong><small>{product.price}</small></div><StoreIcon name="arrow" />
            </Link>)}
            <button className="store-text-link" type="button" onClick={() => search(query)}>Открыть каталог <StoreIcon name="arrow" /></button>
          </div>}
        </div>
        <div className="store-header-actions">
          <button type="button" className="store-header-action" onClick={toggleTheme} aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}><StoreIcon name={dark ? "sun" : "moon"} /><span>Тема</span></button>
          <div ref={phoneRoot} className="store-phone" onBlur={event => {
            if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setPhoneOpen(false);
          }} onKeyDown={event => {
            if (event.key === "Escape" && phoneOpen) { event.preventDefault(); setPhoneOpen(false); phoneButton.current?.focus(); }
          }}>
            <button ref={phoneButton} type="button" className="store-header-action store-phone-button" aria-label="Телефон магазина" aria-expanded={phoneOpen} aria-controls="store-phone-contact" onClick={() => { setPhoneOpen(open => !open); setSearchOpen(false); }}>
              <StoreIcon name="phone" /><span>Позвонить</span>
            </button>
            {phoneOpen && <section className="store-phone-panel" id="store-phone-contact" aria-label="Связь с магазином">
              <div className="store-phone-panel-heading"><strong>Связь с магазином</strong><button type="button" className="store-phone-close" aria-label="Закрыть номер телефона" onClick={() => { setPhoneOpen(false); phoneButton.current?.focus(); }}><StoreIcon name="close" /></button></div>
              {contactPhone ? <><a className="store-phone-number" href={phoneHref}>{contactPhone}</a>{phoneText && <p>{phoneText}</p>}<a className="store-button store-phone-call" href={phoneHref}><StoreIcon name="phone" />Позвонить</a></> : <><p>Номер телефона пока не опубликован. Напишите нам в поддержку.</p><Link className="store-button store-phone-call" href="/help" onClick={() => setPhoneOpen(false)}>Написать в поддержку</Link></>}
            </section>}
          </div>
          <Link href="/favorites" className="store-header-action store-header-favorite" aria-label="Избранное"><StoreIcon name="heart" /><span>Избранное</span></Link>
          {authUser ? <Link href={accountHref} className="store-header-action" aria-label={authUser.role === "admin" ? "Админ-панель" : "Личный кабинет"}><StoreIcon name="user" /><span>Кабинет</span></Link> : <button type="button" className="store-header-action" onClick={() => { setAuthMode("login"); setAuthOpen(true); }} aria-label="Войти в аккаунт"><StoreIcon name="user" /><span>Войти</span></button>}
          <Link href="/cart" className="store-header-action store-header-cart" aria-label={`Корзина${cartCount ? `, товаров: ${cartCount}` : ""}`}><StoreIcon name="bag" /><span>Корзина</span>{cartCount > 0 && <span className="store-count">{cartCount > 99 ? "99+" : cartCount}</span>}</Link>
        </div>
      </div>
      <nav className="store-nav" aria-label="Разделы магазина">
        <Link href="/new" aria-current={isActive("/new") ? "page" : undefined}>Новинки</Link><span className="store-nav-separator" aria-hidden="true" />
        {categories.length ? categories.slice(0, 7).map(category => <Link key={category.id} href={category.href || `/catalog/${category.slug || category.id}`} aria-current={isActive(category.href || `/catalog/${category.slug || category.id}`) ? "page" : undefined}>{category.name}</Link>) : <Link href="/catalog">Все товары</Link>}
        <Link href="/help" aria-current={isActive("/help") ? "page" : undefined}>Помощь с выбором</Link>
      </nav>
    </header>
    <nav className="store-bottom-nav" aria-label="Мобильное меню">
      {bottomNav.map(item => {
        const custom = site?.branding?.[`navIcon${item.key}`];
        return <Link key={item.key} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
          {custom && /^(\/|https?:\/\/|data:image\/)/i.test(custom) ? <img className="store-bottom-custom-icon" src={custom} alt="" width={22} height={22} /> : <StoreIcon name={item.icon} />}
          <span>{item.label}</span>{item.key === "Cart" && cartCount > 0 && <span className="store-count">{cartCount > 99 ? "99+" : cartCount}</span>}
        </Link>;
      })}
    </nav>
    {authOpen && <AuthModal initialMode={authMode} onClose={() => setAuthOpen(false)} onSuccess={user => setAuthUser(user)} />}
  </>;
}
