"use client";

import { BackLink } from "@/components/back-link";
import Link from "next/link";
import Image from 'next/image';
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import type {
 CustomerStatusProgress,
 StatusDiscountTier,
} from "@/lib/customer-status-types";

type CustomerProfile = {
 id: string;
 name: string;
 lastName: string;
 phone: string;
 email: string;
 createdAt: string;
};

type ProfileOrderItem = {
 id: string;
 title: string;
 productTitle: string;
 brand: string;
 sku: string;
 memory: string;
 color: string;
 sim: string;
 image: string;
 quantity: number;
 price: number;
};

type ProfileOrder = {
 id: string;
 publicId: string;
 createdAt: string;
 total: number;
 status: string;
 delivery: string;
 items: ProfileOrderItem[];
};

type ProfileAddress = {
 id: string;
 value: string;
 type: "courier" | "pickup";
 isDefault: boolean;
};

type ProfileSupportRequest = {
 id: string;
 publicId: string;
 topic: string;
 message: string;
 status: string;
 createdAt: string;
 updatedAt: string;
};

type ProfileFavorite = {
 id: string;
 product: {
 slug: string;
 name: string;
 brand: string;
 image: string;
 };
};

type ProfileData = {
 profile: CustomerProfile;
 statusProgress: CustomerStatusProgress;
 statusDiscount: {
 enabled: boolean;
 tiers: StatusDiscountTier[];
 };
 orders: ProfileOrder[];
 addresses: ProfileAddress[];
 supportRequests: ProfileSupportRequest[];
 favorites: ProfileFavorite[];
};

type ModalType = "profile" | "security" | "address" | null;

const emptyProfile: CustomerProfile = {
 id: "",
 name: "",
 lastName: "",
 phone: "",
 email: "",
 createdAt: "",
};

function formatPrice(value: number) {
 return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

function formatDate(value: string) {
 const date = new Date(value);

 if (Number.isNaN(date.getTime())) {
 return "Дата не указана";
 }

 return date.toLocaleDateString("ru-RU", {
 day: "2-digit",
 month: "long",
 year: "numeric",
 });
}

function getInitialLetter(profile: CustomerProfile) {
 const source = profile.name || profile.lastName || profile.phone || profile.email || "Н";
 return source.trim()[0]?.toUpperCase() ?? "Н";
}

function getFullName(profile: CustomerProfile) {
 return [profile.name, profile.lastName].filter(Boolean).join(" ").trim();
}

function getOrderTitle(order: ProfileOrder) {
 const firstItem = order.items[0];

 if (!firstItem) {
 return "Заявка без товаров";
 }

 return firstItem.productTitle || firstItem.title || `${order.items.length} товар(ов)`;
}

function getOrderStatusLabel(status: string) {
 const labels: Record<string, string> = {
 new: "Ожидает подтверждения",
 confirming: "Подтверждается",
 in_work: "В работе",
 ready: "Готов к выдаче",
 completed: "Завершён",
 cancelled: "Отменён",
 };

 return labels[status] ?? status;
}

function getSupportStatusLabel(status: string) {
 const labels: Record<string, string> = {
 new: "Новое",
 in_work: "В работе",
 waiting_client: "Ожидает клиента",
 closed: "Закрыто",
 };

 return labels[status] ?? status;
}

function getStatusRank(status: CustomerStatusProgress["status"]) {
 if (status === "vip") return 3;
 if (status === "regular") return 2;
 return 1;
}

function formatDiscountValue(tier: StatusDiscountTier) {
 return tier.discountType === "percent"
 ? `${tier.discountValue}%`
 : formatPrice(tier.discountValue);
}

function getHighestDiscountLabel(tiers: StatusDiscountTier[]) {
 if (!tiers.length) return "Пока недоступна";

 const percentValues = tiers
 .filter((tier) => tier.discountType === "percent")
 .map((tier) => tier.discountValue);
 const fixedValues = tiers
 .filter((tier) => tier.discountType === "fixed")
 .map((tier) => tier.discountValue);

 if (percentValues.length && !fixedValues.length) {
 return `до ${Math.max(...percentValues)}%`;
 }

 if (fixedValues.length && !percentValues.length) {
 return `до ${formatPrice(Math.max(...fixedValues))}`;
 }

 return `${tiers.length} уровня`;
}

function formatMemberSince(value: string) {
 if (!value) return "";

 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return "";

 return date.toLocaleDateString("ru-RU", {
 month: "long",
 year: "numeric",
 });
}

export default function ProfilePage() {
 const [isLoaded, setIsLoaded] = useState(false);
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const [profile, setProfile] = useState<CustomerProfile>(emptyProfile);
 const [draftProfile, setDraftProfile] = useState<CustomerProfile>(emptyProfile);
 const [orders, setOrders] = useState<ProfileOrder[]>([]);
 const [addresses, setAddresses] = useState<ProfileAddress[]>([]);
 const [supportRequests, setSupportRequests] = useState<ProfileSupportRequest[]>([]);
 const [favorites, setFavorites] = useState<ProfileFavorite[]>([]);
 const [statusProgress, setStatusProgress] = useState<CustomerStatusProgress | null>(null);
 const [statusDiscount, setStatusDiscount] = useState<{
 enabled: boolean;
 tiers: StatusDiscountTier[];
 }>({ enabled: false, tiers: [] });
 const [securityForm, setSecurityForm] = useState({
 currentPassword: "",
 phone: "",
 email: "",
 newPassword: "",
 confirmPassword: "",
 });
 const [securityMessage, setSecurityMessage] = useState("");
 const [securitySaving, setSecuritySaving] = useState(false);
 const [newAddress, setNewAddress] = useState("");
 const [activeModal, setActiveModal] = useState<ModalType>(null);
 const [isProfileSaved, setIsProfileSaved] = useState(false);
 const [error, setError] = useState("");

 async function loadProfileState() {
 try {
 const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
 const meData = (await meResponse.json().catch(() => ({}))) as {
 authenticated?: boolean;
 user?: { role?: "customer" | "admin" };
 };

 if (meData.authenticated && meData.user?.role === "admin") {
 window.location.href = "/nz-console";
 return;
 }

 if (!meData.authenticated || meData.user?.role !== "customer") {
 setIsAuthenticated(false);
 setProfile(emptyProfile);
 setDraftProfile(emptyProfile);
 setOrders([]);
 setAddresses([]);
 setSupportRequests([]);
 setFavorites([]);
 setStatusProgress(null);
 setStatusDiscount({ enabled: false, tiers: [] });
 return;
 }

 const response = await fetch("/api/auth/profile", { cache: "no-store" });
 const data = (await response.json().catch(() => ({}))) as Partial<ProfileData> & {
 ok?: boolean;
 message?: string;
 };

 if (!response.ok || !data.profile) {
 setIsAuthenticated(false);
 setError(data.message || "Не получилось загрузить личный кабинет.");
 return;
 }

 setIsAuthenticated(true);
 setProfile(data.profile);
 setDraftProfile(data.profile);
 setOrders(data.orders ?? []);
 setAddresses(data.addresses ?? []);
 setSupportRequests(data.supportRequests ?? []);
 setFavorites(data.favorites ?? []);
 setStatusProgress(data.statusProgress ?? null);
 setStatusDiscount(data.statusDiscount ?? { enabled: false, tiers: [] });
 setError("");
 } catch {
 setIsAuthenticated(false);
 setError("Сервер личного кабинета не ответил.");
 } finally {
 setIsLoaded(true);
 }
 }

 useEffect(() => {
 void loadProfileState();

 const handleProfileUpdate = () => {
 void loadProfileState();
 };

 window.addEventListener("netizen-auth-updated", handleProfileUpdate);

 return () => {
 window.removeEventListener("netizen-auth-updated", handleProfileUpdate);
 };
 }, []);

 function openAuthModal(mode: "login" | "register" = "login") {
 window.dispatchEvent(new CustomEvent("netizen-open-auth", { detail: mode }));
 }

 async function saveProfile() {
 const normalizedProfile = {
 name: draftProfile.name.trim(),
 lastName: draftProfile.lastName.trim(),
 };

 const response = await fetch("/api/auth/profile", {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 firstName: normalizedProfile.name,
 lastName: normalizedProfile.lastName,
 }),
 });
 const data = (await response.json().catch(() => ({}))) as {
 message?: string;
 user?: { profile?: Partial<CustomerProfile> };
 };

 if (!response.ok || !data.user?.profile) {
 setError(data.message || "Не получилось сохранить профиль.");
 return;
 }

 setProfile((current) => ({ ...current, ...data.user?.profile }));
 setDraftProfile((current) => ({ ...current, ...data.user?.profile }));
 window.dispatchEvent(new Event("netizen-auth-updated"));
 setIsProfileSaved(true);
 setActiveModal(null);
 setError("");

 window.setTimeout(() => setIsProfileSaved(false), 1800);
 }

 function openSecurityModal() {
 setSecurityForm({
 currentPassword: "",
 phone: profile.phone,
 email: profile.email,
 newPassword: "",
 confirmPassword: "",
 });
 setSecurityMessage("");
 setActiveModal("security");
 }

 async function saveSecurity() {
 if (securitySaving) return;

 if (securityForm.newPassword !== securityForm.confirmPassword) {
 setSecurityMessage("Новые пароли не совпадают.");
 return;
 }

 setSecuritySaving(true);
 setSecurityMessage("");

 try {
 const response = await fetch("/api/auth/security", {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 currentPassword: securityForm.currentPassword,
 phone: securityForm.phone,
 email: securityForm.email,
 newPassword: securityForm.newPassword,
 }),
 });
 const data = (await response.json().catch(() => ({}))) as {
 message?: string;
 profile?: Partial<CustomerProfile>;
 };

 if (!response.ok || !data.profile) {
 setSecurityMessage(data.message || "Не удалось обновить данные для входа.");
 return;
 }

 setProfile((current) => ({ ...current, ...data.profile }));
 setDraftProfile((current) => ({ ...current, ...data.profile }));
 setSecurityMessage(data.message || "Данные для входа обновлены.");
 window.dispatchEvent(new Event("netizen-auth-updated"));

 window.setTimeout(() => {
 setActiveModal(null);
 setSecurityMessage("");
 }, 900);
 } catch {
 setSecurityMessage("Сервер не ответил. Попробуйте ещё раз.");
 } finally {
 setSecuritySaving(false);
 }
 }

 async function addAddress() {
 const normalizedAddress = newAddress.trim();

 if (!normalizedAddress) {
 return;
 }

 const response = await fetch("/api/auth/profile", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ action: "add-address", address: normalizedAddress }),
 });
 const data = (await response.json().catch(() => ({}))) as {
 message?: string;
 addresses?: ProfileAddress[];
 };

 if (!response.ok) {
 setError(data.message || "Не получилось добавить адрес.");
 return;
 }

 setAddresses(data.addresses ?? []);
 setNewAddress("");
 setActiveModal(null);
 setError("");
 }

 async function logout() {
 await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
 window.dispatchEvent(new Event("netizen-auth-updated"));
 window.location.href = "/";
 }

 if (!isLoaded) {
 return null;
 }

 if (!isAuthenticated) {
 return (
 <main className="min-h-screen bg-page px-3 py-4 text-main transition-colors duration-700 sm:px-5 sm:py-6">
 <div className="mx-auto max-w-[1440px]">
 <SiteHeader />

 <section className="mt-10 grid min-h-[520px] place-items-center">
 <div className="card w-full max-w-[720px] rounded-[34px] p-8 text-center">
 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
 👤
 </div>

 <div className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-blue-500">
 Личный кабинет
 </div>

 <h1 className="mt-3 text-4xl font-bold tracking-[-0.05em] md:text-5xl">
 Войдите или зарегистрируйтесь
 </h1>

 <p className="mx-auto mt-4 max-w-[560px] text-sm leading-relaxed text-muted">
 Профиль, заявки, адреса доставки, избранное и обращения показываются
 только после входа клиента. Данные берутся из базы, а не из браузера.
 </p>

 {error && (
 <div className="mx-auto mt-5 max-w-[520px] rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
 {error}
 </div>
 )}

 <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
 <button
 type="button"
 onClick={() => openAuthModal("login")}
 className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 sm:px-6 sm:py-3.5"
 >
 Войти
 </button>

 <button
 type="button"
 onClick={() => openAuthModal("register")}
 className="rounded-xl border border-theme bg-transparent px-4 py-2.5 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft sm:px-6 sm:py-3.5"
 >
 Зарегистрироваться
 </button>
 </div>
 </div>
 </section>
 </div>
 </main>
 );
 }

 const completedOrders = orders.filter((order) => order.status === "completed");
 const totalSpent = completedOrders.reduce((sum, order) => sum + order.total, 0);
 const recentOrders = orders.slice(0, 4);
 const recentFavorites = favorites.slice(0, 4);
 const recentSupport = supportRequests.slice(0, 3);
 const currentStatusRank = statusProgress ? getStatusRank(statusProgress.status) : 1;

 return (
 <main className="min-h-screen bg-page px-3 py-4 text-main transition-colors duration-700 sm:px-5 sm:py-6">
 <div className="mx-auto max-w-[1440px]">
 <SiteHeader />

 <div className="mt-4 flex items-center justify-between gap-3 sm:mt-6">
 <BackLink href="/" label="На главную" />

 <span className="text-xs text-muted">
 Личный кабинет
 </span>
 </div>

 {error ? (
 <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
 {error}
 </div>
 ) : null}

 <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
 <div className="card flex min-w-0 items-center gap-4 rounded-[24px] p-4 sm:gap-5 sm:p-5">
 <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white sm:h-16 sm:w-16 sm:text-2xl">
 {getInitialLetter(profile)}
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <h1 className="truncate text-2xl font-bold tracking-[-0.045em] sm:text-3xl">
 {getFullName(profile) || "Клиент Neontech"}
 </h1>

 {statusProgress ? (
 <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
 {statusProgress.statusLabel}
 </span>
 ) : null}
 </div>

 <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
 <span>{profile.phone || "Телефон не указан"}</span>
 {profile.email ? <span>{profile.email}</span> : null}
 {profile.createdAt ? (
 <span>С нами с {formatMemberSince(profile.createdAt)}</span>
 ) : null}
 </div>
 </div>
 </div>

 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => {
 setDraftProfile(profile);
 setActiveModal("profile");
 }}
 className="rounded-xl border border-theme bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 >
 Профиль
 </button>

 <button
 type="button"
 onClick={openSecurityModal}
 className="rounded-xl border border-theme bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 >
 Безопасность
 </button>

 <button
 type="button"
 onClick={logout}
 className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/15"
 >
 Выйти
 </button>
 </div>
 </section>

 {statusProgress ? (
 <section className="card mt-4 rounded-[24px] p-4 sm:p-6">
 <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
 <div>
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
 Статус клиента
 </div>
 <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]">
 {statusProgress.statusLabel}
 </h2>
 </div>

 {statusProgress.isManual ? (
 <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-500">
 Назначен менеджером
 </span>
 ) : (
 <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500">
 Обновляется автоматически
 </span>
 )}
 </div>

 <div className="mt-5 grid grid-cols-3 gap-2">
 {[
 { status: "new", label: "Новый" },
 { status: "regular", label: "Постоянный" },
 { status: "vip", label: "VIP" },
 ].map((step, index) => {
 const active = currentStatusRank >= index + 1;

 return (
 <div key={step.status} className="min-w-0">
 <div
 className={`h-2 rounded-full ${
 active ? "bg-blue-600" : "bg-blue-soft"
 }`}
 />
 <div
 className={`mt-2 truncate text-xs font-medium ${
 active ? "text-main" : "text-muted"
 }`}
 >
 {step.label}
 </div>
 </div>
 );
 })}
 </div>

 <div className="mt-5 rounded-2xl border border-theme bg-blue-soft p-4">
 <div className="flex items-center justify-between gap-4 text-sm">
 <span className="font-medium">
 {statusProgress.nextStatusLabel
 ? `До уровня «${statusProgress.nextStatusLabel}»`
 : "Максимальный уровень"}
 </span>
 <span className="font-bold text-blue-500">
 {statusProgress.progressPercent}%
 </span>
 </div>

 <div className="mt-3 h-2 overflow-hidden rounded-full bg-card">
 <div
 className="h-full rounded-full bg-blue-600 transition-all"
 style={{ width: `${Math.max(4, statusProgress.progressPercent)}%` }}
 />
 </div>

 <p className="mt-3 text-sm leading-relaxed text-muted">
 {statusProgress.explanation}
 </p>
 </div>
 </div>

 <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
 <CompactMetric
 label="Учтённые заказы"
 value={String(statusProgress.countedOrders)}
 hint={`Всего завершено: ${statusProgress.completedOrders}`}
 />
 <CompactMetric
 label="Сумма покупок"
 value={formatPrice(statusProgress.countedSpent)}
 hint="По заказам, которые участвуют в статусе"
 />
 <CompactMetric
 label="Персональная скидка"
 value={
 statusDiscount.enabled
 ? getHighestDiscountLabel(statusDiscount.tiers)
 : "Не активна"
 }
 hint={
 statusDiscount.enabled
 ? "Размер зависит от суммы корзины"
 : "Откроется на следующем уровне"
 }
 />
 </div>
 </div>

 {statusDiscount.enabled && statusDiscount.tiers.length > 0 ? (
 <div className="mt-4 flex flex-wrap gap-2 border-t border-theme pt-4">
 {statusDiscount.tiers.map((tier) => (
 <span
 key={tier.id}
 className="rounded-xl border border-theme bg-transparent px-3 py-2 text-xs text-muted"
 >
 От {formatPrice(tier.minOrderTotal)} —{" "}
 <b className="text-main">{formatDiscountValue(tier)}</b>
 </span>
 ))}
 </div>
 ) : null}
 </section>
 ) : null}

 <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
 <SummaryCard label="Заявки" value={String(orders.length)} href="/cart" action="Новая заявка" />
 <SummaryCard
 label="Завершено"
 value={String(completedOrders.length)}
 hint={formatPrice(totalSpent)}
 />
 <SummaryCard label="Избранное" value={String(favorites.length)} href="#favorites" action="Открыть" />
 <SummaryCard label="Обращения" value={String(supportRequests.length)} href="/help" action="Написать" />
 </section>

 <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
 <div className="grid gap-4">
 <section className="card rounded-[24px] p-4 sm:p-5">
 <div className="flex items-center justify-between gap-4">
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">
 Заказы
 </div>
 <h2 className="mt-1 text-xl font-bold sm:text-2xl">Последние заявки</h2>
 </div>

 <Link href="/cart" className="inline-flex min-h-9 items-center justify-center rounded-xl border border-theme bg-card px-3.5 py-2 text-xs font-semibold text-main transition-colors hover:border-blue-500/40 hover:bg-blue-soft hover:text-blue-500">
 Новая
 </Link>
 </div>

 {recentOrders.length > 0 ? (
 <div className="mt-4 divide-y divide-theme">
 {recentOrders.map((order) => (
 <article
 key={order.id}
 className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
 >
 <div className="min-w-0">
 <div className="text-xs text-muted">{order.publicId} · {formatDate(order.createdAt)}</div>
 <h3 className="mt-1 truncate font-bold">{getOrderTitle(order)}</h3>
 <div className="mt-1 text-xs text-muted">
 {order.delivery} · {order.items.length} позиц.
 </div>
 </div>

 <div className="font-bold">{formatPrice(order.total)}</div>

 <span className="w-fit rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-500">
 {getOrderStatusLabel(order.status)}
 </span>
 </article>
 ))}
 </div>
 ) : (
 <CompactEmpty
 title="Заявок пока нет"
 text="Выберите товар в каталоге и оформите первую заявку."
 href="/catalog"
 action="Перейти в каталог"
 />
 )}
 </section>

 <section id="favorites" className="card rounded-[24px] p-4 sm:p-5">
 <div className="flex items-center justify-between gap-4">
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">
 Избранное
 </div>
 <h2 className="mt-1 text-xl font-bold sm:text-2xl">Сохранённые товары</h2>
 </div>

 <Link href="/catalog" className="inline-flex min-h-9 items-center justify-center rounded-xl border border-theme bg-card px-3.5 py-2 text-xs font-semibold text-main transition-colors hover:border-blue-500/40 hover:bg-blue-soft hover:text-blue-500">
 Каталог
 </Link>
 </div>

 {recentFavorites.length > 0 ? (
 <div className="mt-4 grid gap-3 sm:grid-cols-2">
 {recentFavorites.map((favorite) => (
 <Link
 key={favorite.id}
 href={`/product/${favorite.product.slug}`}
 className="flex min-w-0 items-center gap-3 rounded-2xl border border-theme bg-blue-soft p-3 transition-colors hover:border-blue-500/35"
 >
 <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card">
 {favorite.product.image ? (
 <Image
 quality={70}
 src={favorite.product.image}
 alt={favorite.product.name}
 width={64}
 height={64}
 className="h-full w-full object-contain p-1"
 />
 ) : (
 <span className="text-xs text-muted">Фото</span>
 )}
 </div>

 <div className="min-w-0">
 <div className="text-xs text-muted">{favorite.product.brand}</div>
 <div className="mt-1 line-clamp-2 text-sm font-bold">
 {favorite.product.name}
 </div>
 </div>
 </Link>
 ))}
 </div>
 ) : (
 <CompactEmpty
 title="Список пуст"
 text="Сохраняйте товары, чтобы быстро вернуться к ним."
 href="/catalog"
 action="Выбрать товары"
 />
 )}
 </section>

 <section className="card rounded-[24px] p-4 sm:p-5">
 <div className="flex items-center justify-between gap-4">
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">
 Поддержка
 </div>
 <h2 className="mt-1 text-xl font-bold sm:text-2xl">Последние обращения</h2>
 </div>

 <Link href="/help" className="inline-flex min-h-9 items-center justify-center rounded-xl border border-theme bg-card px-3.5 py-2 text-xs font-semibold text-main transition-colors hover:border-blue-500/40 hover:bg-blue-soft hover:text-blue-500">
 Написать
 </Link>
 </div>

 {recentSupport.length > 0 ? (
 <div className="mt-4 divide-y divide-theme">
 {recentSupport.map((request) => (
 <article key={request.id} className="flex items-start justify-between gap-4 py-4">
 <div className="min-w-0">
 <div className="text-xs text-muted">{request.publicId}</div>
 <h3 className="mt-1 truncate font-bold">{request.topic}</h3>
 <p className="mt-1 line-clamp-2 text-sm text-muted">{request.message}</p>
 </div>

 <span className="shrink-0 rounded-full border border-theme px-3 py-1.5 text-xs text-muted">
 {getSupportStatusLabel(request.status)}
 </span>
 </article>
 ))}
 </div>
 ) : (
 <CompactEmpty
 title="Обращений нет"
 text="Здесь появится история переписки с поддержкой."
 href="/help"
 action="Написать"
 />
 )}
 </section>
 </div>

 <aside className="grid content-start gap-4">
 <section className="card rounded-[24px] p-4 sm:p-5">
 <div className="flex items-center justify-between gap-3">
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">
 Доставка
 </div>
 <h2 className="mt-1 text-xl font-bold">Адреса</h2>
 </div>
 <span className="rounded-full bg-blue-soft px-2.5 py-1 text-xs text-muted">
 {addresses.length}
 </span>
 </div>

 {addresses.length > 0 ? (
 <div className="mt-4 grid gap-2">
 {addresses.slice(0, 3).map((address) => (
 <div
 key={address.id}
 className="rounded-xl border border-theme bg-blue-soft px-3 py-3 text-sm"
 >
 <div className="line-clamp-2">{address.value}</div>
 {address.isDefault ? (
 <div className="mt-1 text-xs text-blue-500">Основной адрес</div>
 ) : null}
 </div>
 ))}
 </div>
 ) : (
 <p className="mt-4 text-sm text-muted">Адреса пока не добавлены.</p>
 )}

 <button
 type="button"
 onClick={() => setActiveModal("address")}
 className="mt-4 w-full rounded-xl border border-theme px-4 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 >
 Добавить адрес
 </button>
 </section>

 <section className="card rounded-[24px] p-4 sm:p-5">
 <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">
 Скидки
 </div>
 <h2 className="mt-1 text-xl font-bold">Промокоды и цена</h2>

 <p className="mt-3 text-sm leading-relaxed text-muted">
 Персональная скидка применяется автоматически. Промокод можно ввести
 в корзине перед оформлением заявки.
 </p>

 <Link
 href="/cart"
 className="mt-4 flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
 >
 Перейти в корзину
 </Link>
 </section>

 <section className="card rounded-[24px] p-4 sm:p-5">
 <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">
 Быстро
 </div>
 <div className="mt-3 grid gap-2">
 <Link
 href="/catalog"
 className="flex min-h-11 items-center justify-center rounded-xl border border-theme bg-card px-4 py-3 text-center text-sm font-semibold transition-colors hover:border-blue-500/40 hover:bg-blue-soft hover:text-blue-500"
 >
 Каталог
 </Link>
 <Link
 href="/cart"
 className="flex min-h-11 items-center justify-center rounded-xl border border-theme bg-card px-4 py-3 text-center text-sm font-semibold transition-colors hover:border-blue-500/40 hover:bg-blue-soft hover:text-blue-500"
 >
 Корзина
 </Link>
 <Link
 href="/help"
 className="flex min-h-11 items-center justify-center rounded-xl border border-theme bg-card px-4 py-3 text-center text-sm font-semibold transition-colors hover:border-blue-500/40 hover:bg-blue-soft hover:text-blue-500"
 >
 Поддержка
 </Link>
 </div>
 </section>
 </aside>
 </section>

 {isProfileSaved ? (
 <div className="fixed bottom-5 right-5 z-40 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-500 backdrop-blur-xl">
 Данные сохранены
 </div>
 ) : null}
 </div>

 {activeModal === "profile" && (
 <Modal title="Данные профиля" onClose={() => setActiveModal(null)}>
 <div className="grid gap-4">
 <label className="grid gap-2 text-sm font-medium">
 Имя
 <input
 value={draftProfile.name}
 onChange={(event) =>
 setDraftProfile((current) => ({
 ...current,
 name: event.target.value,
 }))
 }
 placeholder="Например, Иван"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />
 </label>

 <label className="grid gap-2 text-sm font-medium">
 Фамилия
 <input
 value={draftProfile.lastName}
 onChange={(event) =>
 setDraftProfile((current) => ({
 ...current,
 lastName: event.target.value,
 }))
 }
 placeholder="Например, Иванов"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />
 </label>

 <div className="rounded-2xl border border-theme bg-blue-soft p-4 text-sm text-muted">
 Телефон, e-mail и пароль меняются в разделе «Безопасность» после подтверждения текущего пароля.
 </div>
 </div>

 <div className="mt-6 flex flex-col gap-3 sm:flex-row">
 <button
 type="button"
 onClick={saveProfile}
 className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
 >
 Сохранить
 </button>

 <button
 type="button"
 onClick={() => setActiveModal(null)}
 className="rounded-xl border border-theme bg-transparent px-6 py-3.5 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 >
 Отмена
 </button>
 </div>
 </Modal>
 )}

 {activeModal === "security" && (
 <Modal title="Безопасность аккаунта" onClose={() => setActiveModal(null)}>
 <div className="grid gap-4">
 <div className="rounded-2xl border border-theme bg-blue-soft p-4 text-sm leading-relaxed text-muted">
 Для изменения телефона, e-mail или пароля подтвердите текущий пароль.
 Вход в аккаунт работает по телефону или e-mail.
 </div>

 <label className="grid gap-2 text-sm font-medium">
 Телефон для входа
 <input
 value={securityForm.phone}
 onChange={(event) =>
 setSecurityForm((current) => ({ ...current, phone: event.target.value }))
 }
 placeholder="+7 999 000-00-00"
 autoComplete="tel"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />
 </label>

 <label className="grid gap-2 text-sm font-medium">
 E-mail для входа
 <input
 type="email"
 value={securityForm.email}
 onChange={(event) =>
 setSecurityForm((current) => ({ ...current, email: event.target.value }))
 }
 placeholder="mail@example.com"
 autoComplete="email"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />
 </label>

 <label className="grid gap-2 text-sm font-medium">
 Текущий пароль
 <input
 type="password"
 value={securityForm.currentPassword}
 onChange={(event) =>
 setSecurityForm((current) => ({
 ...current,
 currentPassword: event.target.value,
 }))
 }
 autoComplete="current-password"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 outline-none focus:border-blue-500/50"
 />
 </label>

 <div className="grid gap-4 sm:grid-cols-2">
 <label className="grid gap-2 text-sm font-medium">
 Новый пароль
 <input
 type="password"
 value={securityForm.newPassword}
 onChange={(event) =>
 setSecurityForm((current) => ({
 ...current,
 newPassword: event.target.value,
 }))
 }
 placeholder="Не менее 6 символов"
 autoComplete="new-password"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />
 </label>

 <label className="grid gap-2 text-sm font-medium">
 Повторите пароль
 <input
 type="password"
 value={securityForm.confirmPassword}
 onChange={(event) =>
 setSecurityForm((current) => ({
 ...current,
 confirmPassword: event.target.value,
 }))
 }
 autoComplete="new-password"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 outline-none focus:border-blue-500/50"
 />
 </label>
 </div>
 </div>

 {securityMessage ? (
 <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
 securityMessage.includes("обновлен")
 ? "border-green-500/30 bg-green-500/10 text-green-500"
 : "border-red-500/30 bg-red-500/10 text-red-500"
 }`}>
 {securityMessage}
 </div>
 ) : null}

 <div className="mt-6 flex flex-col gap-3 sm:flex-row">
 <button
 type="button"
 onClick={() => void saveSecurity()}
 disabled={securitySaving}
 className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {securitySaving ? "Сохраняю…" : "Сохранить изменения"}
 </button>

 <button
 type="button"
 onClick={() => setActiveModal(null)}
 className="rounded-xl border border-theme bg-transparent px-6 py-3.5 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 >
 Отмена
 </button>
 </div>
 </Modal>
 )}

 {activeModal === "address" && (
 <Modal title="Добавить адрес" onClose={() => setActiveModal(null)}>
 <label className="grid gap-2 text-sm font-medium">
 Адрес доставки
 <input
 value={newAddress}
 onChange={(event) => setNewAddress(event.target.value)}
 placeholder="Город, улица, дом, квартира"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />
 </label>

 <div className="mt-6 flex flex-col gap-3 sm:flex-row">
 <button
 type="button"
 onClick={addAddress}
 className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
 >
 Сохранить адрес
 </button>

 <button
 type="button"
 onClick={() => setActiveModal(null)}
 className="rounded-xl border border-theme bg-transparent px-6 py-3.5 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 >
 Отмена
 </button>
 </div>
 </Modal>
 )}
 </main>
 );
}

function CompactMetric({
 label,
 value,
 hint,
}: {
 label: string;
 value: string;
 hint: string;
}) {
 return (
 <div className="rounded-2xl border border-theme bg-blue-soft p-4">
 <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
 {label}
 </div>
 <div className="mt-2 text-xl font-bold tracking-[-0.035em]">{value}</div>
 <div className="mt-1 text-xs leading-relaxed text-muted">{hint}</div>
 </div>
 );
}

function SummaryCard({
 label,
 value,
 hint,
 href,
 action,
}: {
 label: string;
 value: string;
 hint?: string;
 href?: string;
 action?: string;
}) {
 return (
 <div className="card rounded-[20px] p-4">
 <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
 {label}
 </div>
 <div className="mt-2 text-2xl font-bold tracking-[-0.04em]">{value}</div>
 {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
 {href && action ? (
 <Link
 href={href}
 className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl border border-theme bg-card px-3.5 py-2 text-xs font-semibold text-main transition-colors hover:border-blue-500/40 hover:bg-blue-soft hover:text-blue-500"
 >
 {action}
 </Link>
 ) : null}
 </div>
 );
}

function CompactEmpty({
 title,
 text,
 href,
 action,
}: {
 title: string;
 text: string;
 href: string;
 action: string;
}) {
 return (
 <div className="mt-4 rounded-2xl border border-dashed border-theme px-4 py-5">
 <div className="font-bold">{title}</div>
 <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
 <Link
 href={href}
 className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
 >
 {action}
 </Link>
 </div>
 );
}

function Modal({
 title,
 children,
 onClose,
}: {
 title: string;
 children: ReactNode;
 onClose: () => void;
}) {
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-md">
 <div className="w-full max-w-[560px] rounded-[28px] border border-theme bg-page p-6 text-main ">
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-500">
 Личный кабинет
 </div>
 <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">{title}</h2>
 </div>

 <button
 type="button"
 onClick={onClose}
 className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme text-lg transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 aria-label="Закрыть"
 >
 ×
 </button>
 </div>

 <div className="mt-4 sm:mt-6">{children}</div>
 </div>
 </div>
 );
}
