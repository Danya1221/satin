"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import { useTheme } from "@/components/theme-provider";

type AuthMode = "login" | "register";

type HeaderAuthUser = {
 role: "customer" | "admin";
 profile?: {
 name?: string;
 lastName?: string;
 phone?: string;
 email?: string;
 };
};

type MeResponse = {
 authenticated?: boolean;
 user?: HeaderAuthUser;
};

type SearchProduct = {
 slug: string;
 name: string;
 brand: string;
 image: string;
 price: string;
 oldPrice: string;
 discount: number;
};

type SearchResponse = {
 products?: SearchProduct[];
};

type HeaderSiteSettings = {
 contacts?: {
 phone?: string;
 phoneText?: string;
 workingHours?: string;
 };
 branding?: {
 storeName?: string;
 logoLight?: string;
 logoDark?: string;
 mobileLogo?: string;
 favicon?: string;
 navIconHome?: string;
 navIconCatalog?: string;
 navIconNew?: string;
 navIconSupport?: string;
 navIconCart?: string;
 };
};

type BottomNavItem = {
 key: "home" | "catalog" | "new" | "support" | "cart";
 label: string;
 href: string;
 fallbackIcon: string;
};

const bottomNavItems: BottomNavItem[] = [
 { key: "home", label: "Главная", href: "/", fallbackIcon: "__home__" },
 { key: "catalog", label: "Каталог", href: "/catalog", fallbackIcon: "__catalog__" },
 { key: "new", label: "Новинки", href: "/new", fallbackIcon: "__new__" },
 { key: "support", label: "Поддержка", href: "/help", fallbackIcon: "__support__" },
 { key: "cart", label: "Корзина", href: "/cart", fallbackIcon: "__cart__" },
];

function isImageIcon(value: string) {
 return /^(\/|https?:\/\/|data:image\/)/i.test(value.trim());
}

function cssMaskUrl(value: string) {
 return `url("${value.replace(/"/g, "\\\"")}")`;
}

function PhoneHeaderIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      <path
        d="M18.2 10.8h6.2c1.8 0 3.35 1.24 3.7 2.98l1.42 7.1a3.9 3.9 0 0 1-1.15 3.74l-4.1 4.1a30.44 30.44 0 0 0 11 11l4.1-4.1a3.9 3.9 0 0 1 3.74-1.15l7.1 1.42a3.78 3.78 0 0 1 2.98 3.7v6.2A4.63 4.63 0 0 1 48.6 50.4C29.73 50.4 13.6 34.27 13.6 15.4a4.63 4.63 0 0 1 4.6-4.6Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M39.4 17.8a14.4 14.4 0 0 1 6.8 6.8"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M40.3 10.8a21.7 21.7 0 0 1 12.9 12.9"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartHeaderIcon({ className = "" }: { className?: string }) {
 return (
 <svg
 viewBox="0 0 64 64"
 fill="none"
 className={className}
 aria-hidden="true"
 focusable="false"
 shapeRendering="geometricPrecision"
 >
 <path
 d="M4.8 8h10.4l7.2 34.6c.45 2.2 2.4 3.8 4.65 3.8H51.7c2.3 0 4.3-1.65 4.72-3.92L62 16.7H17.05"
 stroke="currentColor"
 strokeWidth="5.6"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 <path
 d="M20.6 26.2h37.2M22.8 36.1h32.9M31.4 17l2.3 29M46.2 17l-2.35 29"
 stroke="currentColor"
 strokeWidth="4.45"
 strokeLinecap="round"
 />
 <circle cx="29" cy="55.2" r="4.7" stroke="currentColor" strokeWidth="5" />
 <circle cx="51.8" cy="55.2" r="4.7" stroke="currentColor" strokeWidth="5" />
 </svg>
 );
}

function UserHeaderIcon({ className = "" }: { className?: string }) {
 return (
 <svg
 viewBox="0 0 64 64"
 fill="none"
 className={className}
 aria-hidden="true"
 focusable="false"
 shapeRendering="geometricPrecision"
 >
 <circle
 cx="32"
 cy="18.2"
 r="13.2"
 stroke="currentColor"
 strokeWidth="5.8"
 />
 <path
 d="M8.2 59.1c.9-15.6 10.1-24.3 23.8-24.3s22.9 8.7 23.8 24.3"
 stroke="currentColor"
 strokeWidth="5.8"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 </svg>
 );
}

function HomeBottomNavIcon({ className = "" }: { className?: string }) {
 return (
 <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
 <path
 d="M3.5 10.8 12 3.8l8.5 7"
 stroke="currentColor"
 strokeWidth="2.1"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 <path
 d="M5.5 9.8V20h13V9.8M9.5 20v-5.4h5V20"
 stroke="currentColor"
 strokeWidth="2.1"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 </svg>
 );
}

function CatalogBottomNavIcon({ className = "" }: { className?: string }) {
 return (
 <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
 <rect x="3.8" y="3.8" width="6.2" height="6.2" rx="1" stroke="currentColor" strokeWidth="2" />
 <rect x="14" y="3.8" width="6.2" height="6.2" rx="1" stroke="currentColor" strokeWidth="2" />
 <rect x="3.8" y="14" width="6.2" height="6.2" rx="1" stroke="currentColor" strokeWidth="2" />
 <rect x="14" y="14" width="6.2" height="6.2" rx="1" stroke="currentColor" strokeWidth="2" />
 </svg>
 );
}

function NewBottomNavIcon({ className = "" }: { className?: string }) {
 return (
 <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
 <path
 d="m12 2.8 1.75 6.05L20 10.75l-6.25 1.9L12 18.8l-1.75-6.15L4 10.75l6.25-1.9L12 2.8Z"
 stroke="currentColor"
 strokeWidth="1.95"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 <path d="m18.4 16.4.65 2.15 2.15.65-2.15.65-.65 2.15-.65-2.15-2.15-.65 2.15-.65.65-2.15Z" fill="currentColor" />
 </svg>
 );
}

function SupportBottomNavIcon({ className = "" }: { className?: string }) {
 return (
 <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
 <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
 <path
 d="M9.55 9.1a2.7 2.7 0 1 1 4.45 2.05c-1.15.95-2 1.65-2 3.1"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 />
 <circle cx="12" cy="17.85" r="1.05" fill="currentColor" />
 </svg>
 );
}

function DefaultBottomNavIcon({
 itemKey,
 className = "",
}: {
 itemKey: BottomNavItem["key"];
 className?: string;
}) {
 if (itemKey === "home") return <HomeBottomNavIcon className={className} />;
 if (itemKey === "catalog") return <CatalogBottomNavIcon className={className} />;
 if (itemKey === "new") return <NewBottomNavIcon className={className} />;
 if (itemKey === "support") return <SupportBottomNavIcon className={className} />;
 return <CartHeaderIcon className={className} />;
}

function BottomNavIcon({
 icon,
 itemKey,
 label,
 active,
}: {
 icon: string;
 itemKey: BottomNavItem["key"];
 label: string;
 active: boolean;
}) {
 const [imageFailed, setImageFailed] = useState(false);
 const value = icon.trim();

 useEffect(() => {
 setImageFailed(false);

 if (!value || !isImageIcon(value) || typeof window === "undefined") {
 return;
 }

 let cancelled = false;
 const image = new window.Image();
 image.onload = () => {
 if (!cancelled) setImageFailed(false);
 };
 image.onerror = () => {
 if (!cancelled) setImageFailed(true);
 };
 image.src = value;

 return () => {
 cancelled = true;
 };
 }, [value]);

 const isDefaultMarker = value.startsWith("__") && value.endsWith("__");
 const iconClassName = `netizen-bottom-nav-icon h-5 w-5 shrink-0 overflow-visible ${
 active ? "text-white" : "text-blue-500"
 }`;

 if (value && isImageIcon(value) && !imageFailed) {
 const maskUrl = cssMaskUrl(value);
 const maskStyle: CSSProperties = {
 WebkitMaskImage: maskUrl,
 maskImage: maskUrl,
 WebkitMaskRepeat: "no-repeat",
 maskRepeat: "no-repeat",
 WebkitMaskPosition: "center",
 maskPosition: "center",
 WebkitMaskSize: "contain",
 maskSize: "contain",
 backgroundColor: "currentColor",
 };

 return (
 <span
 className={`netizen-bottom-nav-icon h-5 w-5 shrink-0 ${active ? "text-white" : "text-blue-500"}`}
 style={maskStyle}
 aria-hidden="true"
 />
 );
 }

 if (!value || isDefaultMarker || imageFailed || ["⌂", "▦", "✦", "?", "🛒"].includes(value)) {
 return <DefaultBottomNavIcon itemKey={itemKey} className={iconClassName} />;
 }

 return (
 <span className={`text-[17px] leading-none ${active ? "text-white" : "text-blue-500"}`}>
 {value || label[0]}
 </span>
 );
}

function isActivePath(pathname: string, item: BottomNavItem) {
 if (item.href === "/") {
 return pathname === "/";
 }

 return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function SiteHeader() {
 const { dark, toggleTheme } = useTheme();
 const pathname = usePathname() || "/";
 const [cartCount, setCartCount] = useState(0);
 const [authUser, setAuthUser] = useState<HeaderAuthUser | null>(null);
 const [authMode, setAuthMode] = useState<AuthMode>("login");
 const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
 const [siteSettings, setSiteSettings] = useState<HeaderSiteSettings | null>(null);
 const [searchQuery, setSearchQuery] = useState("");
 const [isSearchOpen, setIsSearchOpen] = useState(false);
 const [searchHistory, setSearchHistory] = useState<string[]>([]);
 const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
 const [isSearchLoading, setIsSearchLoading] = useState(false);
 const [isPhoneOpen, setIsPhoneOpen] = useState(false);
 const searchRootRef = useRef<HTMLDivElement | null>(null);
 const phoneRootRef = useRef<HTMLDivElement | null>(null);

 useEffect(() => {
 document.body.classList.add("has-mobile-bottom-nav");

 return () => {
 document.body.classList.remove("has-mobile-bottom-nav");
 };
 }, []);

 useEffect(() => {
 const currentSearch = new URLSearchParams(window.location.search).get("search") ?? "";
 setSearchQuery(currentSearch);
 }, [pathname]);

 useEffect(() => {
 try {
 const stored = JSON.parse(localStorage.getItem("netizen-search-history") || "[]");
 setSearchHistory(Array.isArray(stored) ? stored.filter((item) => typeof item === "string").slice(0, 8) : []);
 } catch {
 setSearchHistory([]);
 }
 }, []);

 useEffect(() => {
 function handlePointerDown(event: MouseEvent) {
 const target = event.target as Node;

 if (searchRootRef.current && !searchRootRef.current.contains(target)) {
 setIsSearchOpen(false);
 }

 if (phoneRootRef.current && !phoneRootRef.current.contains(target)) {
 setIsPhoneOpen(false);
 }
 }

 document.addEventListener("mousedown", handlePointerDown);

 return () => document.removeEventListener("mousedown", handlePointerDown);
 }, []);

 useEffect(() => {
 if (!isSearchOpen) {
 return;
 }

 const controller = new AbortController();
 const timer = window.setTimeout(async () => {
 setIsSearchLoading(true);

 try {
 const query = searchQuery.trim();
 const response = await fetch(
 `/api/catalog-search${query ? `?q=${encodeURIComponent(query)}` : ""}`,
 { signal: controller.signal },
 );
 const payload = (await response.json().catch(() => ({}))) as SearchResponse;
 setSearchProducts(Array.isArray(payload.products) ? payload.products : []);
 } catch (error) {
 if ((error as Error).name !== "AbortError") {
 setSearchProducts([]);
 }
 } finally {
 if (!controller.signal.aborted) {
 setIsSearchLoading(false);
 }
 }
 }, searchQuery.trim() ? 220 : 0);

 return () => {
 window.clearTimeout(timer);
 controller.abort();
 };
 }, [isSearchOpen, searchQuery]);

 useEffect(() => {
 const updateCartCount = () => {
 const count = Number(localStorage.getItem("netizen-cart-count") || "0");
 setCartCount(count);
 };

 const updateAuthUser = async () => {
 try {
 const response = await fetch("/api/auth/me", { cache: "no-store" });
 const data = (await response.json().catch(() => ({}))) as MeResponse;

 setAuthUser(data.authenticated && data.user ? data.user : null);
 } catch {
 setAuthUser(null);
 }
 };

 const updateSiteSettings = async () => {
 try {
 const response = await fetch("/api/site-settings", { cache: "no-store" });
 const data = (await response.json().catch(() => ({}))) as {
 site?: HeaderSiteSettings;
 };

 setSiteSettings(data.site ?? null);
 } catch {
 setSiteSettings(null);
 }
 };

 const openAuthModal = (event: Event) => {
 const customEvent = event as CustomEvent<AuthMode | undefined>;
 setAuthMode(customEvent.detail ?? "login");
 setIsAuthModalOpen(true);
 };

 const handleAuthUpdate = () => {
 void updateAuthUser();
 };

 updateCartCount();
 handleAuthUpdate();
 void updateSiteSettings();

 window.addEventListener("storage", updateCartCount);
 window.addEventListener("storage", handleAuthUpdate);
 window.addEventListener("netizen-cart-updated", updateCartCount);
 window.addEventListener("netizen-auth-updated", handleAuthUpdate);
 window.addEventListener("netizen-open-auth", openAuthModal);

 return () => {
 window.removeEventListener("storage", updateCartCount);
 window.removeEventListener("storage", handleAuthUpdate);
 window.removeEventListener("netizen-cart-updated", updateCartCount);
 window.removeEventListener("netizen-auth-updated", handleAuthUpdate);
 window.removeEventListener("netizen-open-auth", openAuthModal);
 };
 }, []);

 useEffect(() => {
 if (typeof document === "undefined") {
 return;
 }

 const normalizeBrandText = (value: string) =>
 value
 .replace(/Neontech/g, "Neontech")
 .replace(/Neontech/g, "Neontech")
 .replace(/netizen\.store/g, "neontech.ru")
 .replace(/@netizen_store/g, "@neontech_store");

 document.title = normalizeBrandText(document.title || "Neontech");
 if (!document.title.trim()) {
 document.title = "Neontech";
 }

 const setIcon = (selector: string, rel: string, href: string, type?: string, sizes?: string) => {
 let link = document.querySelector<HTMLLinkElement>(selector);

 if (!link) {
 link = document.createElement("link");
 link.rel = rel;
 document.head.appendChild(link);
 }

 link.href = href;
 if (type) link.type = type;
 if (sizes) link.setAttribute("sizes", sizes);
 };

 setIcon('link[rel="icon"][type="image/svg+xml"]', "icon", "/favicon.svg?v=neontech-4", "image/svg+xml");
 setIcon('link[rel="icon"]:not([type])', "icon", "/favicon.ico?v=neontech-4", undefined, "any");
 setIcon('link[rel="shortcut icon"]', "shortcut icon", "/favicon.ico?v=neontech-4");
 setIcon('link[rel="apple-touch-icon"]', "apple-touch-icon", "/apple-touch-icon.png?v=neontech-4", "image/png");
 }, [pathname]);

 const navItems = [
 { label: "Каталог", href: "/catalog" },
 { label: "Новинки", href: "/new" },
 { label: "FAQ", href: "/faq" },
 { label: "Поддержка", href: "/help" },
 ];

 const iconMap: Record<BottomNavItem["key"], string> = {
 home: "__home__",
 catalog: "__catalog__",
 new: "__new__",
 support: "__support__",
 cart: "__cart__",
 };

 function saveSearchHistory(query: string) {
 const nextHistory = [query, ...searchHistory.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 8);
 setSearchHistory(nextHistory);
 localStorage.setItem("netizen-search-history", JSON.stringify(nextHistory));
 }

 function clearSearchHistory() {
 setSearchHistory([]);
 localStorage.removeItem("netizen-search-history");
 }

 function openHistoryQuery(query: string) {
 setSearchQuery(query);
 saveSearchHistory(query);
 window.location.href = `/catalog?search=${encodeURIComponent(query)}`;
 }

 function submitSearch(event: FormEvent<HTMLFormElement>) {
 event.preventDefault();

 const query = searchQuery.trim();

 if (!query) {
 window.location.href = "/catalog";
 return;
 }

 saveSearchHistory(query);
 setIsSearchOpen(false);
 window.location.href = `/catalog?search=${encodeURIComponent(query)}`;
 }

 const accountHref = authUser?.role === "admin" ? "/nz-console" : "/profile";
 const accountLabel = authUser?.role === "admin" ? "Админ-панель" : "Личный кабинет";
 const isSearchVisible = pathname === "/" || pathname === "/catalog" || pathname.startsWith("/catalog/");
 const logoLight = "/logo-light.webp";
 const logoDark = "/logo-dark.webp";
 const mobileLogo = "";
 const storeName = (siteSettings?.branding?.storeName?.trim() || "Neontech")
 .replace(/Neontech/g, "Neontech")
 .replace(/Neontech/g, "Neontech");
 const storePhone = siteSettings?.contacts?.phone?.trim() || "8 (800) 123-45-67";
 const storePhoneText =
 siteSettings?.contacts?.phoneText?.trim() ||
 siteSettings?.contacts?.workingHours?.trim() ||
 "Связаться с магазином";
 const phoneHref = `tel:${storePhone.replace(/[^\d+]/g, "")}`;
 const logoSrc = dark ? logoLight : logoDark;

 const forceNavigate = (href: string) => {
 if (typeof window !== "undefined" && window.location.pathname !== href) {
 window.location.href = href;
 }
 };

 return (
 <>
 <header
 className={`sticky top-2 z-[100] flex h-[58px] items-center justify-between rounded-2xl border px-3 backdrop-blur-xl transition-all duration-700 sm:top-3 sm:h-[64px] sm:px-5 lg:h-[76px] lg:px-8 ${
 dark
 ? "border-white/10 bg-white/[0.035] "
 : "border-black/10 bg-white "
 }`}
 >
 <Link
 href="/"
 prefetch={false}
 onClick={(event) => {
 if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
 event.preventDefault();
 forceNavigate("/");
 }}
 className="relative flex h-10 w-[108px] shrink-0 items-center justify-start overflow-hidden sm:w-[128px] lg:h-12 lg:w-[150px]"
 aria-label={storeName}
 >
 {mobileLogo ? (
 <>
 <img
 src={mobileLogo}
 alt={storeName}
 width={128}
 height={36}
 loading="eager"
 decoding="async"
 className="h-auto max-h-7 w-auto object-contain sm:max-h-8 lg:hidden"
 />
 <img
 src={logoSrc}
 alt={storeName}
 width={150}
 height={54}
 loading="eager"
 decoding="async"
 className="hidden h-auto max-h-9 w-auto object-contain lg:block"
 />
 </>
 ) : (
 <img
 src={logoSrc}
 alt={storeName}
 width={150}
 height={54}
 loading="eager"
 decoding="async"
 className="h-auto max-h-7 w-auto object-contain sm:max-h-8 lg:max-h-9"
 />
 )}
 </Link>

 <nav
 className={`hidden items-center gap-3 text-sm font-medium lg:flex ${
 dark ? "text-white" : "text-[#07111f]"
 }`}
 >
 {navItems.map((item) => (
 <Link
 key={item.label}
 href={item.href}
 prefetch={false}
 onClick={(event) => {
 if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
 event.preventDefault();
 forceNavigate(item.href);
 }}
 className={`rounded-xl border px-4 py-2.5 outline-none focus:outline-none transition-all duration-200 ${
 pathname === item.href || pathname.startsWith(`${item.href}/`)
 ? "border-transparent bg-blue-600 text-white "
 : dark
 ? "border-white/10 bg-transparent text-white hover:border-white/10 hover:bg-blue-600 hover:text-white"
 : "border-transparent bg-transparent text-[#07111f] hover:border-transparent hover:bg-blue-600 hover:text-white"
 }`}
 >
 {item.label}
 </Link>
 ))}
 </nav>

 <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
 {isSearchVisible && (
 <div ref={searchRootRef} className="relative hidden lg:block">
 <form
 onSubmit={submitSearch}
 className={`flex h-11 w-[400px] items-center rounded-xl border px-4 text-sm transition-all duration-300 ${
 dark
 ? "border-white/10 bg-black/20 text-white/70 focus-within:border-blue-500/55"
 : "border-black/10 bg-[#f6f8fb] text-black/70 focus-within:border-blue-500/55"
 }`}
 >
 <input
 value={searchQuery}
 onFocus={() => setIsSearchOpen(true)}
 onChange={(event) => {
 setSearchQuery(event.target.value);
 setIsSearchOpen(true);
 }}
 placeholder="Поиск по каталогу"
 className="h-full min-w-0 flex-1 bg-transparent pr-2 text-sm outline-none placeholder:text-current/50 font-medium text-current"
 />

 {searchQuery ? (
 <button
 type="button"
 onClick={() => {
 setSearchQuery("");
 setIsSearchOpen(true);
 }}
 className={`mr-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors ${
 dark ? "text-white/55 hover:bg-white/10 hover:text-white" : "text-black/45 hover:bg-black/5 hover:text-black"
 }`}
 aria-label="Очистить поиск"
 title="Очистить"
 >
 ×
 </button>
 ) : null}

 <button
 type="submit"
 className="ml-2 inline-flex h-9 w-9 items-center justify-center text-blue-600 transition-colors hover:text-blue-500"
 aria-label="Найти"
>
 <img src="/icons/search-blue.svg" alt="" className="h-6 w-6" />
</button>
 </form>

 {isSearchOpen ? (
 <div
 className={`absolute right-0 top-[calc(100%+12px)] z-[80] max-h-[82vh] w-[820px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[28px] border p-6 ${
 dark
 ? "border-white/10 bg-[#07101d] text-white"
 : "border-black/10 bg-white text-[#07111f]"
 }`}
 >
 {!searchQuery.trim() ? (
 <>
 <div className="flex items-center justify-between gap-3">
 <h3 className="text-base font-bold">История</h3>
 {searchHistory.length > 0 ? (
 <button
 type="button"
 onClick={clearSearchHistory}
 className="text-xs font-medium text-blue-500 transition-colors hover:text-blue-400"
 >
 Очистить
 </button>
 ) : null}
 </div>

 {searchHistory.length > 0 ? (
 <div className="mt-4 grid gap-1.5">
 {searchHistory.map((item) => (
 <button
 key={item}
 type="button"
 onClick={() => openHistoryQuery(item)}
 className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors ${
 dark ? "hover:bg-white/[0.05]" : "hover:bg-slate-100"
 }`}
 >
 <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs text-blue-500">
 ↶
 </span>
 <span className="truncate">{item}</span>
 </button>
 ))}
 </div>
 ) : (
 <p className={`mt-3 text-xs ${dark ? "text-white/45" : "text-black/45"}`}>
 Здесь появятся ваши последние запросы.
 </p>
 )}

 <div className={`my-4 h-px ${dark ? "bg-white/10" : "bg-black/10"}`} />

 <h3 className="text-base font-bold">Рекомендуем для вас</h3>
 </>
 ) : (
 <div className="flex items-center justify-between gap-3">
 <h3 className="text-base font-bold">Результаты поиска</h3>
 <span className={`text-xs ${dark ? "text-white/45" : "text-black/45"}`}>
 {isSearchLoading ? "Ищем…" : `${searchProducts.length} найдено`}
 </span>
 </div>
 )}

 <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(180px,220px))] gap-4">
 {searchProducts.map((product) => (
 <Link
 key={product.slug}
 href={`/product/${product.slug}`}
 onClick={() => {
 const query = searchQuery.trim();
 if (query) saveSearchHistory(query);
 setIsSearchOpen(false);
 }}
 className={`group rounded-[20px] border p-3 transition-all hover:-translate-y-0.5 ${
 dark
 ? "border-white/10 bg-white/[0.03] hover:border-blue-500/35"
 : "border-black/10 bg-white hover:border-blue-500/35 hover:"
 }`}
 >
 <div className="photo-white-box aspect-[16/10] overflow-hidden rounded-[20px] bg-white dark:bg-white">
 {product.image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={product.image}
 alt=""
 loading="lazy"
 decoding="async"
 className="h-full w-full object-contain p-2"
 />
 ) : null}
 </div>

 <div className="px-1 pb-1 pt-2">
 <div className={`truncate text-[10px] ${dark ? "text-white/45" : "text-black/45"}`}>
 {product.brand}
 </div>
 <div className="mt-2 line-clamp-2 min-h-[40px] text-sm font-semibold leading-snug">
 {product.name}
 </div>

 <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
 <span className="text-base font-bold text-blue-500">{product.price}</span>
 {product.oldPrice ? (
 <span className={`text-[10px] line-through ${dark ? "text-white/35" : "text-black/35"}`}>
 {product.oldPrice}
 </span>
 ) : null}
 {product.discount > 0 ? (
 <span className="text-[10px] font-semibold text-rose-500">−{product.discount}%</span>
 ) : null}
 </div>
 </div>
 </Link>
 ))}
 </div>

 {!isSearchLoading && searchProducts.length === 0 ? (
 <div className={`py-8 text-center text-sm ${dark ? "text-white/45" : "text-black/45"}`}>
 {searchQuery.trim() ? "Ничего не найдено" : "Рекомендации пока не выбраны"}
 </div>
 ) : null}

 {isSearchLoading ? (
 <div className={`py-8 text-center text-sm ${dark ? "text-white/45" : "text-black/45"}`}>
 Загружаем товары…
 </div>
 ) : null}
 </div>
 ) : null}
 </div>
 )}

 <button
 type="button"
 onClick={toggleTheme}
 aria-label="Переключить тему"
 className={`relative h-9 w-12 rounded-xl border transition-all duration-700 sm:h-10 sm:w-14 lg:h-11 lg:w-16 ${
 dark
 ? "border-white/10 bg-blue-600/15"
 : "border-black/10 bg-blue-50"
 }`}
 >
 <span
 className={`absolute top-1/2 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center rounded-lg bg-blue-600 text-xs text-white transition-all duration-500 ease-in-out sm:h-7 sm:w-7 lg:h-8 lg:w-8 lg:text-sm ${
 dark ? "left-5 sm:left-6 lg:left-7" : "left-1"
 }`}
 >
 {dark ? "☾" : "☀"}
 </span>
 </button>

 <div ref={phoneRootRef} className="relative">
 <button
 type="button"
 onClick={() => setIsPhoneOpen((current) => !current)}
 aria-label="Телефон магазина"
 aria-expanded={isPhoneOpen}
 className={`group flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border text-sm font-bold outline-none focus:outline-none transition-all duration-300 sm:h-10 sm:w-10 lg:h-11 lg:w-11 ${
 isPhoneOpen
 ? "border-transparent bg-blue-600 text-white "
 : dark
 ? "border-white/20 bg-white/[0.08] text-white hover:border-transparent hover:bg-blue-600"
 : "border-black/15 bg-white text-[#07111f] hover:border-transparent hover:bg-blue-50"
 }`}
 >
 <PhoneHeaderIcon
 className={`netizen-header-action-icon block h-6 w-6 shrink-0 ${
 isPhoneOpen
 ? "text-white"
 : "text-blue-500 transition-colors group-hover:text-white"
 }`}
 />
 </button>

 {isPhoneOpen ? (
 <div
 className={`absolute right-0 top-[calc(100%+10px)] z-[130] w-[280px] rounded-2xl border p-4 ${
 dark
 ? "border-white/20 bg-[#0a1424] text-white"
 : "border-black/10 bg-white text-[#07111f]"
 }`}
 >
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-500">
 Связь с магазином
 </div>
 <a
 href={phoneHref}
 className="mt-2 block text-lg font-bold transition-colors hover:text-blue-500"
 >
 {storePhone}
 </a>
 <p className={`mt-1 text-xs leading-relaxed ${dark ? "text-white/65" : "text-black/55"}`}>
 {storePhoneText}
 </p>
 <a
 href={phoneHref}
 className="mt-4 flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
 >
 Позвонить
 </a>
 </div>
 ) : null}
 </div>

 <Link
 href="/cart"
 className={`group relative hidden h-11 w-11 items-center justify-center overflow-visible rounded-xl border outline-none focus:outline-none transition-all duration-300 lg:flex ${
 dark
 ? "border-white/10 bg-white/[0.03] text-white hover:border-transparent hover:bg-blue-600"
 : "border-black/10 bg-white text-[#07111f] hover:border-transparent hover:bg-blue-50"
 }`}
 >
 <CartHeaderIcon className="netizen-header-action-icon h-[25px] w-[25px] shrink-0 overflow-visible text-blue-500 transition-colors group-hover:text-white" />

 {cartCount > 0 && (
 <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white ">
 {cartCount}
 </span>
 )}
 </Link>

 {authUser ? (
 <div className="flex items-center gap-2">
 <Link
 href={accountHref}
 aria-label={accountLabel}
 title={accountLabel}
 className={`group flex h-10 w-10 items-center justify-center overflow-visible rounded-xl border text-sm font-bold outline-none focus:outline-none transition-all duration-300 sm:h-10 sm:w-10 lg:h-11 lg:w-11 ${
 dark
 ? "border-white/10 bg-white/[0.03] text-white hover:border-transparent hover:bg-blue-600"
 : "border-black/10 bg-white text-[#07111f] hover:border-transparent hover:bg-blue-50"
 }`}
 >
 <UserHeaderIcon className="netizen-header-action-icon h-6 w-6 shrink-0 overflow-visible text-blue-500 transition-colors group-hover:text-white" />
 </Link>
 </div>
 ) : (
 <button
 type="button"
 onClick={() => {
 setAuthMode("login");
 setIsAuthModalOpen(true);
 }}
 className="rounded-xl border border-theme bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:border-theme hover:bg-blue-soft sm:px-4 sm:py-2.5 lg:px-5 lg:py-3"
 >
 Войти
 </button>
 )}
 </div>
 </header>

 {isSearchVisible && (
 <form
 onSubmit={submitSearch}
 className={`mt-2 flex h-10 items-center rounded-xl border px-3 text-sm transition-all duration-700 lg:hidden ${
 dark
 ? "border-white/10 bg-white/[0.035] text-white/70 focus-within:border-blue-500/55"
 : "border-black/10 bg-white text-black/65 focus-within:border-blue-500/55"
 }`}
 >
 <img src="/icons/search-blue.svg" alt="" className="mr-3 h-6 w-6 shrink-0" aria-hidden="true" />
 <input
 value={searchQuery}
 onChange={(event) => setSearchQuery(event.target.value)}
 placeholder="Поиск по каталогу"
 className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-current/50"
 />
 <button type="submit" className="ml-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
 Найти
 </button>
 </form>
 )}

 <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] lg:hidden">
 <div
 className={`pointer-events-auto grid w-full max-w-[420px] grid-cols-5 gap-1 rounded-[22px] border p-1.5 backdrop-blur-xl ${
 dark ? "border-white/10 bg-[#07111f]/90" : "border-black/10 bg-white/95"
 }`}
 >
 {bottomNavItems.map((item) => {
 const active = isActivePath(pathname, item);
 const icon = iconMap[item.key] || item.fallbackIcon;

 return (
 <Link
 key={item.key}
 href={item.href}
 prefetch={false}
 aria-label={item.label}
 onClick={(event) => {
 if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
 event.preventDefault();
 forceNavigate(item.href);
 }}
 className={`netizen-bottom-nav-link relative flex h-[50px] min-h-[50px] max-h-[50px] flex-col items-center justify-center gap-1 rounded-[16px] text-[9px] font-semibold transition-colors ${
 active
 ? "bg-blue-600 text-white "
 : dark
 ? "text-white/60 hover:bg-white/[0.06] hover:text-white"
 : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
 }`}
 >
 <span className="netizen-bottom-nav-icon-wrap flex h-5 w-5 shrink-0 items-center justify-center"><BottomNavIcon icon={icon} itemKey={item.key} label={item.label} active={active} /></span>
 <span className="max-w-full truncate leading-none">{item.label}</span>

 {item.key === "cart" && cartCount > 0 && (
 <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
 {cartCount}
 </span>
 )}
 </Link>
 );
 })}
 </div>
 </nav>

 {isAuthModalOpen && (
 <AuthModal
 initialMode={authMode}
 onClose={() => setIsAuthModalOpen(false)}
 onSuccess={(user) => setAuthUser(user)}
 />
 )}
 </>
 );
}
