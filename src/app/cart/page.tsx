"use client";

import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { products } from "@/data/products";
import { productPositions } from "@/data/product-positions";
import { SiteHeader } from "@/components/site-header";
import { formatPrice, getPriceNumber } from "@/lib/product-pricing";
import {
 formatRuPhone,
 normalizeEmailStrict,
 normalizeRuPhone,
 validateCourierAddress,
} from "@/lib/contact-validation";

type CartItem = {
 sku: string;
 modelSlug: string;
 productName: string;
 brand: string;
 title: string;
 price: string;
 oldPrice?: string;
 memory: string;
 color: string;
 colorHex?: string;
 sim: string;
 quantity: number;
 stock?: number;
 status?: string;
 image?: string;
};

type ProductPosition = (typeof productPositions)[number];
type RecentlyViewedProduct = {
 slug: string;
 name: string;
 brand: string;
 price: string;
 image: string;
};

type CartProductLookup = Omit<CartItem, "quantity">;

type ModalType = "delivery" | "contacts" | null;
type DeliveryMethod = "courier" | "pickup" | null;

type CustomerData = {
 name: string;
 phone: string;
 email: string;
};

type DeliveryData = {
 method: DeliveryMethod;
 city: string;
 address: string;
 savedAddress: string;
 deliveryKey: string;
 deliveryTitle: string;
 pickupPointId: string;
};

type DeliveryAddress = {
 id: string;
 title: string;
 city: string;
 address: string;
 metro?: string;
 workingHours?: string;
 phone?: string;
};

type DeliveryOption = {
 key: string;
 title: string;
 type: "courier" | "pickup";
 text: string;
 addressId: string;
 address: DeliveryAddress | null;
};

type DiscountQuote = {
 subtotal: number;
 statusDiscount: number;
 statusLabel: string;
 statusCode: "new" | "regular" | "vip";
 promoDiscount: number;
 promoCode: string;
 promoName: string;
 promoValid: boolean;
 promoMessage: string;
 discountTotal: number;
 total: number;
};

type AddressSuggestion = {
 value: string;
 unrestrictedValue: string;
 city: string;
 street: string;
 house: string;
 fiasId: string;
};

type StoredProfile = Partial<CustomerData> & {
 addresses?: string[];
 deliveryAddresses?: string[];
};

const FALLBACK_PICKUP_POINT = {
 id: "fallback-pickup",
 title: "ПВЗ Neontech",
 city: "Москва",
 address: "г. Москва, ул. Тверская, 1",
 workingHours: "Ежедневно с 10:00 до 21:00",
};

const fallbackDeliveryOptions: DeliveryOption[] = [
 {
 key: "courier",
 title: "Курьерская доставка",
 type: "courier",
 text: "Доставим по адресу клиента.",
 addressId: "",
 address: null,
 },
 {
 key: "pickup_main",
 title: "Самовывоз",
 type: "pickup",
 text: "Забрать заказ из точки магазина.",
 addressId: FALLBACK_PICKUP_POINT.id,
 address: FALLBACK_PICKUP_POINT,
 },
];

function getContactValidationError(customer: CustomerData) {
 if (!customer.name.trim()) {
 return "Укажите имя.";
 }

 if (!normalizeRuPhone(customer.phone)) {
 return "Укажите корректный телефон РФ.";
 }

 return "";
}

function getDeliveryValidationError(delivery: DeliveryData) {
 if (delivery.method === "pickup") {
 return delivery.address.trim() ? "" : "Выберите пункт выдачи.";
 }

 if (delivery.method === "courier") {
 const address = delivery.savedAddress.trim() || delivery.address.trim();
 const validation = validateCourierAddress(delivery.city, address);

 return validation.ok ? "" : validation.message;
 }

 return "Выберите способ получения.";
}


function readJson<T>(key: string): T | null {
 try {
 const value = localStorage.getItem(key);

 if (!value) {
 return null;
 }

 return JSON.parse(value) as T;
 } catch {
 return null;
 }
}

function getStoredCartItems() {
 try {
 const savedItems = localStorage.getItem("netizen-cart-items");

 if (!savedItems) {
 return [] as CartItem[];
 }

 const parsedItems = JSON.parse(savedItems) as CartItem[];

 return Array.isArray(parsedItems) ? parsedItems : [];
 } catch {
 return [] as CartItem[];
 }
}

function getStoredRecentlyViewed() {
 try {
 const savedItems = localStorage.getItem("netizen-recently-viewed");
 const parsedItems = savedItems ? JSON.parse(savedItems) : [];

 if (!Array.isArray(parsedItems)) {
 return [] as RecentlyViewedProduct[];
 }

 return parsedItems
 .filter((item): item is RecentlyViewedProduct =>
 Boolean(
 item &&
 typeof item === "object" &&
 typeof item.slug === "string" &&
 typeof item.name === "string",
 ),
 )
 .slice(0, 10);
 } catch {
 return [] as RecentlyViewedProduct[];
 }
}

function saveCartItems(items: CartItem[]) {
 const normalizedItems = items.filter((item) => item.quantity > 0);
 const count = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);

 localStorage.setItem("netizen-cart-items", JSON.stringify(normalizedItems));
 localStorage.setItem("netizen-cart-count", String(count));
 window.dispatchEvent(new Event("netizen-cart-updated"));
}

function getPositionBySku(sku: string) {
 return productPositions.find((position) => position.sku === sku);
}

function getProductBySlug(slug: string) {
 return products.find((product) => product.slug === slug);
}

function getStatusName(status?: string, stock?: number) {
 if (typeof stock === "number" && stock > 0) {
 return "В наличии";
 }

 const statuses: Record<string, string> = {
 active: "В наличии",
 out_of_stock: "Нет в наличии",
 preorder: "Под заказ",
 hidden: "Скрыто",
 draft: "Черновик",
 };

 return statuses[status ?? ""] ?? "Наличие уточняется";
}

function getItemStock(item: CartItem) {
 return item.stock ?? getPositionBySku(item.sku)?.stock ?? 99;
}

function getItemStatus(item: CartItem) {
 return item.status ?? getPositionBySku(item.sku)?.status;
}

function getItemLineTotal(item: CartItem) {
 return getPriceNumber(item.price) * item.quantity;
}

function getSavedProfile(): StoredProfile | undefined {
 const possibleProfiles = [
 readJson<StoredProfile>("netizen-user"),
 readJson<StoredProfile>("netizen-profile"),
 readJson<StoredProfile>("netizen-customer"),
 ].filter(Boolean) as StoredProfile[];

 return possibleProfiles.find((profile) =>
 Boolean(profile.name || profile.phone || profile.email)
 );
}

function getStoredAddresses(profile?: StoredProfile) {
 const profileAddresses = [
 ...(profile?.addresses ?? []),
 ...(profile?.deliveryAddresses ?? []),
 ];
 const savedAddresses = readJson<string[]>("netizen-delivery-addresses") ?? [];

 return Array.from(
 new Set(
 [...profileAddresses, ...savedAddresses].filter(
 (address) => typeof address === "string" && address.trim().length > 0
 )
 )
 );
}

function saveAddresses(addresses: string[]) {
 localStorage.setItem("netizen-delivery-addresses", JSON.stringify(addresses));
}

function getStoredCustomer(profile?: StoredProfile): CustomerData {
 const savedCustomer = readJson<CustomerData>("netizen-checkout-customer");

 return {
 name: profile?.name ?? savedCustomer?.name ?? "",
 phone: formatRuPhone(profile?.phone ?? savedCustomer?.phone ?? ""),
 email: profile?.email ?? savedCustomer?.email ?? "",
 };
}

function getStoredDelivery(): DeliveryData {
 const savedDelivery = readJson<DeliveryData>("netizen-checkout-delivery");

 return {
 method: savedDelivery?.method ?? null,
 city: savedDelivery?.city ?? "",
 address: savedDelivery?.address ?? "",
 savedAddress: savedDelivery?.savedAddress ?? "",
 deliveryKey: savedDelivery?.deliveryKey ?? "",
 deliveryTitle: savedDelivery?.deliveryTitle ?? "",
 pickupPointId: savedDelivery?.pickupPointId ?? "",
 };
}

export default function CartPage() {
 const [items, setItems] = useState<CartItem[]>([]);
 const [isCartLoaded, setIsCartLoaded] = useState(false);
 const [itemPendingRemove, setItemPendingRemove] = useState<CartItem | null>(null);
 const [activeModal, setActiveModal] = useState<ModalType>(null);
 const [isRegistered, setIsRegistered] = useState(false);
 const [customer, setCustomer] = useState<CustomerData>({
 name: "",
 phone: "",
 email: "",
 });
 const [delivery, setDelivery] = useState<DeliveryData>({
 method: null,
 city: "",
 address: "",
 savedAddress: "",
 deliveryKey: "",
 deliveryTitle: "",
 pickupPointId: "",
 });
 const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>(fallbackDeliveryOptions);
 const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
 const [isAddingAddress, setIsAddingAddress] = useState(false);
 const [newAddress, setNewAddress] = useState("");
 const [comment, setComment] = useState("");
 const [isOrderSent, setIsOrderSent] = useState(false);
 const [orderNumber, setOrderNumber] = useState("");
 const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);
 const [orderError, setOrderError] = useState("");
 const [recentlyAddedSku, setRecentlyAddedSku] = useState("");
 const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);
 const [promoInput, setPromoInput] = useState("");
 const [appliedPromoCode, setAppliedPromoCode] = useState("");
 const [quote, setQuote] = useState<DiscountQuote | null>(null);
 const [quoteLoading, setQuoteLoading] = useState(false);

 useEffect(() => {
 const profile = getSavedProfile();
 const storedItems = getStoredCartItems();

 setItems(storedItems);
 setRecentlyViewed(getStoredRecentlyViewed());
 setCustomer(getStoredCustomer(profile));
 setDelivery(getStoredDelivery());
 setSavedAddresses(getStoredAddresses(profile));
 setComment(localStorage.getItem("netizen-checkout-comment") ?? "");
 const storedPromo = localStorage.getItem("netizen-promo-code") ?? "";
 setPromoInput(storedPromo);
 setAppliedPromoCode(storedPromo);

 if (storedItems.length > 0) {
 const skus = storedItems.map((item) => item.sku).filter(Boolean).join(",");

 fetch(`/api/cart-products?skus=${encodeURIComponent(skus)}`, { cache: "no-store" })
 .then((response) => response.json())
 .then((payload: { items?: CartProductLookup[] }) => {
 const lookupBySku = new Map(
 (payload.items ?? []).map((item) => [item.sku, item]),
 );

 setItems((currentItems) => {
 const nextItems = currentItems.map((item) => {
 const lookup = lookupBySku.get(item.sku);

 return lookup
 ? {
 ...item,
 ...lookup,
 quantity: item.quantity,
 image: lookup.image || item.image || "",
 }
 : item;
 });

 saveCartItems(nextItems);
 return nextItems;
 });
 })
 .catch(() => undefined);
 }

 fetch("/api/auth/me", { cache: "no-store" })
 .then((res) => res.json())
 .then((data: {
 authenticated?: boolean;
 user?: {
 role?: string;
 profile?: {
 name?: string;
 lastName?: string;
 phone?: string;
 email?: string;
 };
 };
 }) => {
 const profile = data.user?.profile;
 const isCustomer =
 Boolean(data.authenticated) &&
 data.user?.role === "customer" &&
 Boolean(profile);

 setIsRegistered(isCustomer);

 if (isCustomer && profile) {
 const fullName = [profile.name, profile.lastName]
 .map((part) => String(part ?? "").trim())
 .filter(Boolean)
 .join(" ");

 setCustomer({
 name: fullName,
 phone: formatRuPhone(profile.phone ?? ""),
 email: normalizeEmailStrict(profile.email ?? ""),
 });
 }
 })
 .catch(() => {
 setIsRegistered(false);
 })
 .finally(() => {
 setIsCartLoaded(true);
 });
 }, []);

 useEffect(() => {
 let isMounted = true;

 async function loadDeliveryOptions() {
 const response = await fetch("/api/delivery-options").catch(() => null);
 const payload = (await response?.json().catch(() => null)) as
 | { deliveries?: DeliveryOption[] }
 | null;
 const nextOptions = payload?.deliveries?.length ? payload.deliveries : fallbackDeliveryOptions;

 if (isMounted) {
 setDeliveryOptions(nextOptions);
 }
 }

 void loadDeliveryOptions();

 return () => {
 isMounted = false;
 };
 }, []);

 useEffect(() => {
 if (!isCartLoaded) {
 return;
 }

 localStorage.setItem("netizen-checkout-customer", JSON.stringify(customer));
 }, [customer, isCartLoaded]);

 useEffect(() => {
 if (!isCartLoaded) {
 return;
 }

 localStorage.setItem("netizen-checkout-delivery", JSON.stringify(delivery));
 }, [delivery, isCartLoaded]);

 useEffect(() => {
 if (!isCartLoaded) {
 return;
 }

 localStorage.setItem("netizen-checkout-comment", comment);
 }, [comment, isCartLoaded]);

 useEffect(() => {
 if (!isCartLoaded) return;
 if (!items.length) {
 setQuote(null);
 setQuoteLoading(false);
 return;
 }

 let active = true;
 const timeout = window.setTimeout(async () => {
 setQuoteLoading(true);
 try {
 const response = await fetch("/api/checkout/quote", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 items: items.map((item) => ({ sku: item.sku, quantity: item.quantity })),
 promoCode: appliedPromoCode,
 phone: normalizeRuPhone(customer.phone),
 }),
 });
 const payload = (await response.json().catch(() => null)) as
 | { ok?: boolean; quote?: DiscountQuote; error?: string }
 | null;
 if (!active) return;
 if (response.ok && payload?.quote) setQuote(payload.quote);
 else setQuote(null);
 } catch {
 if (active) setQuote(null);
 } finally {
 if (active) setQuoteLoading(false);
 }
 }, 250);

 return () => {
 active = false;
 window.clearTimeout(timeout);
 };
 }, [appliedPromoCode, customer.phone, isCartLoaded, items]);

 const totalQuantity = useMemo(
 () => items.reduce((sum, item) => sum + item.quantity, 0),
 [items]
 );

 const subtotal = useMemo(
 () => items.reduce((sum, item) => sum + getItemLineTotal(item), 0),
 [items]
 );

 const recommendationPositions = useMemo(() => {
 const cartSkus = new Set(items.map((item) => item.sku));
 const cartModels = new Set(items.map((item) => item.modelSlug));

 const availablePositions = productPositions.filter(
 (position) =>
 position.status !== "hidden" &&
 position.status !== "draft" &&
 (position.stock ?? 0) > 0 &&
 !cartSkus.has(position.sku)
 );

 const sameBrandPositions = availablePositions.filter((position) => {
 const product = getProductBySlug(position.modelSlug);
 const cartBrands = new Set(items.map((item) => item.brand));

 return product && cartBrands.has(product.brand) && !cartModels.has(position.modelSlug);
 });

 const baseList = sameBrandPositions.length > 0 ? sameBrandPositions : availablePositions;

 return baseList.slice(0, 5);
 }, [items]);


 const displayedRecentlyViewed = useMemo(() => {
 const productsBySlug = new Map<string, RecentlyViewedProduct>();

 recentlyViewed.forEach((product) => {
 if (product.slug && !productsBySlug.has(product.slug)) {
 productsBySlug.set(product.slug, product);
 }
 });

 items.forEach((item) => {
 if (!item.modelSlug) {
 return;
 }

 const existingProduct = productsBySlug.get(item.modelSlug);

 productsBySlug.set(item.modelSlug, {
 slug: item.modelSlug,
 name: existingProduct?.name || item.productName || item.title,
 brand: existingProduct?.brand || item.brand,
 price: existingProduct?.price || item.price,
 image: existingProduct?.image || item.image || "",
 });
 });

 return Array.from(productsBySlug.values()).slice(0, 5);
 }, [items, recentlyViewed]);

 const hasItems = items.length > 0;
 const contactValidationError = isRegistered ? "" : getContactValidationError(customer);
 const deliveryValidationError = getDeliveryValidationError(delivery);
 const hasGuestContacts = !contactValidationError;
 const hasDelivery = !deliveryValidationError;
 const promoHasError = Boolean(appliedPromoCode && quote && !quote.promoValid);
 const canPlaceOrder =
 hasItems &&
 hasDelivery &&
 (isRegistered || hasGuestContacts) &&
 !quoteLoading &&
 !promoHasError;
 const payableTotal = quote?.total ?? subtotal;
 const calculatedSubtotal = quote?.subtotal ?? subtotal;

 const deliverySummary = getDeliverySummary(delivery, isRegistered);
 const contactSummary = isRegistered
 ? "Контакты взяты из профиля"
 : hasGuestContacts
 ? `${customer.name}, ${customer.phone}`
 : "Укажите имя и телефон";

 function updateItems(nextItems: CartItem[]) {
 setItems(nextItems);
 saveCartItems(nextItems);
 }

 function updateQuantity(sku: string, nextQuantity: number) {
 const nextItems = items.map((item) => {
 if (item.sku !== sku) {
 return item;
 }

 const stock = getItemStock(item);
 const safeQuantity = Math.min(Math.max(1, nextQuantity), Math.max(1, stock));

 return { ...item, quantity: safeQuantity };
 });

 updateItems(nextItems);
 }

 function addRecommendedPosition(position: ProductPosition) {
 const product = getProductBySlug(position.modelSlug);

 if (!product || (position.stock ?? 0) <= 0) {
 return;
 }

 const existingItem = items.find((item) => item.sku === position.sku);
 const nextItems = existingItem
 ? items.map((item) => {
 if (item.sku !== position.sku) {
 return item;
 }

 const nextQuantity = Math.min(
 item.quantity + 1,
 Math.max(1, position.stock ?? item.quantity + 1)
 );

 return { ...item, quantity: nextQuantity };
 })
 : [
 ...items,
 {
 sku: position.sku,
 modelSlug: position.modelSlug,
 productName: product.name,
 brand: product.brand,
 title: position.title,
 price: position.price,
 oldPrice: position.oldPrice,
 memory: position.memory,
 color: position.color,
 colorHex: position.colorHex,
 sim: position.sim,
 quantity: 1,
 stock: position.stock,
 status: position.status,
 image: position.images?.[0] || "",
 },
 ];

 updateItems(nextItems);
 setRecentlyAddedSku(position.sku);
 window.setTimeout(() => setRecentlyAddedSku(""), 1400);
 }

 function removeItem(sku: string) {
 updateItems(items.filter((item) => item.sku !== sku));
 setItemPendingRemove(null);
 }

 function clearCart() {
 updateItems([]);
 setItemPendingRemove(null);
 setPromoInput("");
 setAppliedPromoCode("");
 setQuote(null);
 localStorage.removeItem("netizen-promo-code");
 }

 function applyPromoCode() {
 const code = promoInput.trim().toUpperCase();
 setPromoInput(code);
 setAppliedPromoCode(code);
 if (code) localStorage.setItem("netizen-promo-code", code);
 else localStorage.removeItem("netizen-promo-code");
 }

 function removePromoCode() {
 setPromoInput("");
 setAppliedPromoCode("");
 localStorage.removeItem("netizen-promo-code");
 }

 function getAddressText(address: DeliveryAddress | null | undefined) {
 if (!address) {
 return "";
 }

 return [address.city, address.address].filter(Boolean).join(", ");
 }

 function selectCourier(option: DeliveryOption) {
 setDelivery((current) => ({
 ...current,
 method: "courier",
 deliveryKey: option.key,
 deliveryTitle: option.title,
 pickupPointId: "",
 savedAddress: current.method === "courier" ? current.savedAddress : "",
 }));
 }

 function selectPickupPoint(option: DeliveryOption) {
 const address = getAddressText(option.address);

 setDelivery({
 method: "pickup",
 city: option.address?.city || "",
 address,
 savedAddress: address,
 deliveryKey: option.key,
 deliveryTitle: option.title,
 pickupPointId: option.address?.id || option.addressId || option.key,
 });
 }

 function selectSavedAddress(address: string) {
 setDelivery((current) => ({
 ...current,
 method: "courier",
 address,
 savedAddress: address,
 pickupPointId: "",
 }));
 }

 function addSavedAddress() {
 const normalizedAddress = newAddress.trim();
 const validation = validateCourierAddress(delivery.city, normalizedAddress);

 if (!validation.ok) {
 setOrderError(validation.message);
 return;
 }

 const nextAddresses = Array.from(new Set([...savedAddresses, validation.normalized]));

 setSavedAddresses(nextAddresses);
 saveAddresses(nextAddresses);
 setNewAddress("");
 setIsAddingAddress(false);
 selectSavedAddress(validation.normalized);
 }

 async function placeOrder() {
 if (isOrderSubmitting) {
 return;
 }

 const nextContactError = isRegistered ? "" : getContactValidationError(customer);
 const nextDeliveryError = getDeliveryValidationError(delivery);

 if (!hasItems || nextContactError || nextDeliveryError) {
 setOrderError(nextContactError || nextDeliveryError || "Корзина пустая.");
 return;
 }

 setIsOrderSubmitting(true);
 setOrderError("");

 try {
 const response = await fetch("/api/orders", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify({
 customer: isRegistered
 ? {
 ...customer,
 phone: normalizeRuPhone(customer.phone),
 email: normalizeEmailStrict(customer.email),
 source: "profile",
 }
 : {
 ...customer,
 phone: normalizeRuPhone(customer.phone),
 email: normalizeEmailStrict(customer.email),
 source: "guest",
 },
 delivery: {
 ...delivery,
 title: delivery.deliveryTitle || (delivery.method === "pickup" ? "ПВЗ / самовывоз" : "Курьерская доставка"),
 },
 comment,
 promoCode: appliedPromoCode,
 items,
 }),
 });

 const result = (await response.json()) as {
 ok?: boolean;
 error?: string;
 order?: { publicId?: string };
 };

 if (!response.ok || !result.ok || !result.order?.publicId) {
 throw new Error(result.error || "Не удалось создать заявку.");
 }

 const order = {
 number: result.order.publicId,
 createdAt: new Date().toISOString(),
 customer: isRegistered
 ? { ...customer, source: "profile" }
 : { ...customer, source: "guest" },
 delivery: {
 ...delivery,
 title: delivery.deliveryTitle || (delivery.method === "pickup" ? "ПВЗ / самовывоз" : "Курьерская доставка"),
 },
 payment: {
 type: "cash",
 label: "Наличными при получении",
 },
 comment,
 items,
 totalQuantity,
 subtotal: calculatedSubtotal,
 statusDiscount: quote?.statusDiscount ?? 0,
 promoDiscount: quote?.promoDiscount ?? 0,
 promoCode: quote?.promoCode ?? "",
 total: payableTotal,
 };

 localStorage.setItem("netizen-last-order", JSON.stringify(order));
 localStorage.removeItem("netizen-checkout-delivery");
 localStorage.removeItem("netizen-checkout-comment");
 clearCart();
 setOrderNumber(result.order.publicId);
 setIsOrderSent(true);
 } catch (error) {
 setOrderError(error instanceof Error ? error.message : "Не удалось создать заявку.");
 } finally {
 setIsOrderSubmitting(false);
 }
 }

 if (!isCartLoaded) {
 return null;
 }

 if (isOrderSent) {
 return (
 <main className="min-h-screen bg-page px-2 py-2.5 text-main transition-colors duration-700 sm:px-5 sm:py-6">
 <div className="mx-auto max-w-[1440px]">
 <SiteHeader />

 <section className="mx-auto mt-6 max-w-[760px] card rounded-[24px] p-6 text-center sm:mt-10 sm:rounded-[32px] sm:p-10">
 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white sm:h-16 sm:w-16 sm:text-2xl">
 ✓
 </div>

 <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:mt-6 sm:text-5xl">
 Заказ отправлен
 </h1>

 <p className="mx-auto mt-4 max-w-[560px] text-muted">
 Номер заказа: <span className="font-semibold text-main">{orderNumber}</span>.
 Менеджер свяжется с вами, подтвердит наличие, доставку и итоговую стоимость.
 </p>

 <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
 <Link
 href="/catalog"
 className="inline-flex justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 sm:px-7 sm:py-4"
 >
 Продолжить покупки
 </Link>

 <Link
 href="/profile"
 className="inline-flex justify-center rounded-xl border border-theme bg-transparent px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft sm:px-7 sm:py-4"
 >
 Перейти в профиль
 </Link>
 </div>
 </section>
 </div>
 </main>
 );
 }

 if (!hasItems) {
 return (
 <main className="min-h-screen bg-page px-2 py-2.5 text-main transition-colors duration-700 sm:px-5 sm:py-6">
 <div className="mx-auto max-w-[1440px]">
 <SiteHeader />

 <section className="mt-5 card rounded-[24px] p-6 text-center sm:mt-6 sm:rounded-[32px] sm:p-10">
 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white sm:h-16 sm:w-16 sm:text-2xl">
 🛒
 </div>

 <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:mt-6 sm:text-5xl">
 Корзина пустая
 </h1>

 <p className="mx-auto mt-4 max-w-[560px] text-muted">
 Выберите модель, настройте цвет, память и другие параметры — после
 этого выбранная конфигурация появится здесь.
 </p>

 <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
 <Link
 href="/catalog"
 className="inline-flex justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 sm:px-7 sm:py-4"
 >
 Перейти в каталог
 </Link>

 <Link
 href="/new"
 className="inline-flex justify-center rounded-xl border border-theme bg-transparent px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft sm:px-7 sm:py-4"
 >
 Смотреть новинки
 </Link>
 </div>
 </section>
 </div>
 </main>
 );
 }

 return (
 <main className="min-h-screen bg-page px-2 py-2.5 text-main transition-colors duration-700 sm:px-5 sm:py-6">
 <div className="mx-auto max-w-[1440px]">
 <SiteHeader />

 <div className="mt-3 sm:mt-6">
 <BackLink href="/catalog" label="Вернуться в каталог" />
 </div>

 <div className="mt-3 grid items-start gap-3 lg:mt-6 lg:grid-cols-[1fr_420px] lg:gap-8">
 <div className="space-y-3 sm:space-y-6">
 <section className="card rounded-[20px] p-3 sm:rounded-[32px] sm:p-6 md:p-8">
 <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
 <div>
 <h1 className="text-[24px] font-bold leading-none tracking-[-0.04em] sm:text-5xl">
 Корзина
 </h1>

 <p className="mt-1 text-xs text-muted sm:mt-2 sm:text-base">
 {totalQuantity} {totalQuantity === 1 ? "товар" : "товара"} в заказе
 </p>
 </div>

 <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
 <Link
 href="/catalog"
 className="rounded-xl border border-theme bg-transparent px-3 py-2 text-center text-xs transition-colors hover:border-blue-500/40 hover:bg-blue-soft sm:px-5 sm:py-3 sm:text-sm"
 >
 Продолжить покупки
 </Link>

 <button
 type="button"
 onClick={clearCart}
 className="rounded-xl border border-theme bg-transparent px-3 py-2 text-xs text-muted transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500 sm:px-5 sm:py-3 sm:text-sm"
 >
 Очистить корзину
 </button>
 </div>
 </div>

 <div className="mt-3 space-y-2.5 sm:mt-8 sm:space-y-4">
 {items.map((item) => {
 const stock = getItemStock(item);
 const status = getItemStatus(item);
 const canIncrease = stock <= 0 || item.quantity < stock;
 const productHref = `/product/${item.modelSlug}?sku=${encodeURIComponent(item.sku)}`;

 return (
 <article
 key={item.sku}
 className="rounded-[18px] border border-theme bg-blue-soft p-2.5 sm:rounded-3xl sm:p-5"
 >
 <div className="grid grid-cols-[62px_minmax(0,1fr)] gap-2 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4 md:grid-cols-[140px_1fr_auto] md:items-center md:gap-5">
 <Link
 href={productHref}
 className="soft-box photo-white-box relative flex h-[62px] items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-white text-[10px] text-muted-soft sm:h-[110px] md:h-[140px] md:text-sm"
 >
 {item.image ? (
 <>
<img
 src={item.image}
 alt={item.title || item.productName}
 loading="lazy"
 className="h-full w-full object-contain p-1.5 sm:p-2"
 />
 </>
 ) : (
 "Фото"
 )}
 </Link>

 <div>
 <div className="truncate text-[10px] text-muted-soft sm:text-sm">{item.brand}</div>

 <Link
 href={productHref}
 className="mt-0.5 line-clamp-2 block text-[12px] font-bold leading-tight transition-colors hover:text-blue-500 sm:mt-1 sm:text-xl"
 >
 {item.title || item.productName}
 </Link>

 <p className="mt-0.5 line-clamp-1 text-[10px] text-muted sm:mt-2 sm:text-sm">
 {item.memory} · {item.color} · {item.sim}
 </p>

 <div className="mt-2 hidden flex-wrap gap-2 sm:flex sm:mt-3">
 <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-500">
 Код товара: {item.sku}
 </span>

 <span
 className={`inline-flex rounded-full border px-3 py-1 text-xs ${
 stock > 0
 ? "border-green-500/30 bg-green-500/10 text-green-500"
 : "border-orange-500/30 bg-orange-500/10 text-orange-500"
 }`}
 >
 {getStatusName(status, stock)}{stock > 0 ? ` · ${stock} шт.` : ""}
 </span>
 </div>

 <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-muted-soft sm:mt-5 sm:gap-3 sm:text-sm">
 <button className="transition-colors hover:text-blue-500">
 В избранное
 </button>
 <span>·</span>
 <button
 type="button"
 onClick={() => setItemPendingRemove(item)}
 className="transition-colors hover:text-red-500"
 >
 Удалить
 </button>
 </div>
 </div>

 <div className="col-span-2 flex items-center justify-between gap-2 pt-1 md:col-span-1 md:flex-col md:items-end md:gap-6 md:pt-0">
 <div className="flex items-center gap-1.5 sm:gap-3">
 <button
 type="button"
 onClick={() => updateQuantity(item.sku, item.quantity - 1)}
 className="flex h-7 w-7 items-center justify-center rounded-xl border border-theme bg-transparent text-sm transition-colors hover:border-blue-500/40 hover:bg-blue-soft sm:h-9 sm:w-9 sm:text-lg"
 >
 −
 </button>

 <span className="w-6 text-center text-sm font-semibold sm:w-7 sm:text-base">
 {item.quantity}
 </span>

 <button
 type="button"
 disabled={!canIncrease}
 onClick={() => updateQuantity(item.sku, item.quantity + 1)}
 className="flex h-7 w-7 items-center justify-center rounded-xl border border-theme bg-transparent text-sm transition-colors hover:border-blue-500/40 hover:bg-blue-soft disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9 sm:text-lg"
 >
 +
 </button>
 </div>

 <div className="text-right">
 {item.oldPrice && (
 <div className="text-[10px] text-muted-soft line-through sm:text-sm">
 {item.oldPrice}
 </div>
 )}

 <div className="text-base font-bold sm:text-xl">
 {formatPrice(getItemLineTotal(item))}
 </div>

 <div className="mt-0.5 text-[10px] text-muted-soft sm:mt-1 sm:text-sm">
 {item.price} за 1 шт.
 </div>
 </div>
 </div>
 </div>
 </article>
 );
 })}
 </div>
 </section>

 <section className="grid grid-cols-2 gap-2">
 {!isRegistered && (
 <CheckoutCard
 title="Контактные данные"
 text={
 hasGuestContacts
 ? contactSummary
 : "Оставьте имя и телефон — менеджер подтвердит заказ и согласует детали."
 }
 status={hasGuestContacts ? "Заполнено" : "Указать"}
 isComplete={hasGuestContacts}
 action={hasGuestContacts ? "Изменить" : "Контакты"}
 onClick={() => setActiveModal("contacts")}
 />
 )}

 <CheckoutCard
 title="Доставка"
 text={deliverySummary}
 status={hasDelivery ? "Заполнено" : "Выбрать"}
 isComplete={hasDelivery}
 action={hasDelivery ? "Изменить" : "Доставка"}
 onClick={() => setActiveModal("delivery")}
 className={isRegistered ? "sm:col-span-2" : ""}
 />
 </section>
 </div>

 <aside className="card h-fit rounded-[22px] p-3.5 sm:rounded-[32px] sm:p-8 lg:sticky lg:top-6">
 <h2 className="text-lg font-bold sm:text-2xl">Итого</h2>

 <div className="mt-3 space-y-2 text-xs text-muted sm:mt-6 sm:space-y-4 sm:text-base">
 <div className="flex justify-between gap-4">
 <span>Товары</span>
 <span className="text-main">{formatPrice(calculatedSubtotal)}</span>
 </div>

 <div className="flex justify-between gap-4">
 <span>Количество</span>
 <span className="text-main">{totalQuantity} шт.</span>
 </div>

 <div className="flex justify-between gap-4">
 <span>Доставка</span>
 <span className="max-w-[190px] text-right text-main">{hasDelivery ? deliverySummary : "не выбрана"}</span>
 </div>

 {!isRegistered && (
 <div className="flex justify-between gap-4">
 <span>Заполнить контакты</span>
 <span className="max-w-[190px] text-right text-main">{hasGuestContacts ? customer.phone : "не указаны"}</span>
 </div>
 )}

 {quote?.statusDiscount ? (
 <div className="flex justify-between gap-4 text-green-500">
 <span>Скидка · {quote.statusLabel}</span>
 <span>−{formatPrice(quote.statusDiscount)}</span>
 </div>
 ) : null}

 {quote?.promoDiscount ? (
 <div className="flex justify-between gap-4 text-green-500">
 <span>Промокод {quote.promoCode}</span>
 <span>−{formatPrice(quote.promoDiscount)}</span>
 </div>
 ) : null}

 <div className="flex justify-between gap-4">
 <span>Оплата</span>
 <span className="text-main">наличными</span>
 </div>
 </div>

 <div className="mt-5 rounded-2xl border border-theme bg-blue-soft p-3 sm:p-4">
 <div className="text-sm font-semibold text-main">Промокод</div>
 <div className="mt-2 flex gap-2">
 <input
 value={promoInput}
 onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
 onKeyDown={(event) => {
 if (event.key === "Enter") {
 event.preventDefault();
 applyPromoCode();
 }
 }}
 placeholder="Введите промокод"
 className="min-w-0 flex-1 rounded-xl border border-theme bg-transparent px-3 py-2.5 text-sm uppercase outline-none placeholder:normal-case placeholder:text-muted-soft focus:border-blue-500/50"
 />
 <button
 type="button"
 onClick={applyPromoCode}
 disabled={quoteLoading}
 className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
 >
 {quoteLoading ? "…" : "Применить"}
 </button>
 </div>

 {appliedPromoCode ? (
 <div className={`mt-2 flex items-start justify-between gap-3 text-xs ${quote?.promoValid ? "text-green-500" : "text-red-500"}`}>
 <span>{quoteLoading ? "Проверяем промокод…" : quote?.promoMessage || "Промокод проверяется."}</span>
 <button type="button" onClick={removePromoCode} className="shrink-0 underline underline-offset-2">
 Убрать
 </button>
 </div>
 ) : (
 <p className="mt-2 text-xs leading-relaxed text-muted-soft">
 Условия промокода проверяются на сервере: сумма заказа, статус клиента, история покупок и лимиты.
 </p>
 )}
 </div>

 <div className="mt-4 border-t border-theme pt-4 sm:mt-6 sm:pt-6">
 <div className="flex justify-between gap-4 text-base font-bold sm:text-xl">
 <span>К оплате</span>
 <span>{formatPrice(payableTotal)}</span>
 </div>
 </div>

 {!canPlaceOrder && (
 <div className="mt-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-500 sm:p-4 sm:text-sm">
 {promoHasError
 ? quote?.promoMessage
 : quoteLoading
 ? "Пересчитываем скидки…"
 : getMissingText(hasDelivery, isRegistered, hasGuestContacts)}
 </div>
 )}

 {orderError && (
 <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
 {orderError}
 </div>
 )}

 <button
 type="button"
 disabled={!canPlaceOrder || isOrderSubmitting}
 onClick={placeOrder}
 className="mt-4 flex w-full justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:text-white/60 sm:mt-6 sm:px-7 sm:py-4"
 >
 {isOrderSubmitting ? "Отправляем заявку..." : "Оформить заказ"}
 </button>

 <p className="mt-3 text-[11px] leading-relaxed text-muted-soft sm:mt-4 sm:text-xs">
 Оплата только наличными при получении. Менеджер подтвердит наличие,
 доставку и итоговую стоимость заказа.
 </p>
 </aside>
 </div>

 <div className="mt-5 space-y-6 sm:mt-10 sm:space-y-12">
 <RecommendationStrip
 title="С этим товаром покупают"
 items={recommendationPositions}
 addedSku={recentlyAddedSku}
 onAdd={addRecommendedPosition}
 />
 <ProductStrip title="Вы смотрели" items={displayedRecentlyViewed} />
 </div>
 </div>

 {activeModal === "delivery" && (
 <Modal title="Получение заказа" onClose={() => setActiveModal(null)}>
 <div className="grid gap-4 md:grid-cols-2">
 {deliveryOptions.map((option) => (
 <button
 key={option.key}
 type="button"
 onClick={() => option.type === "courier" ? selectCourier(option) : selectPickupPoint(option)}
 className={`rounded-2xl border p-5 text-left transition-all ${
 delivery.deliveryKey === option.key || (!delivery.deliveryKey && delivery.method === option.type)
 ? "border-blue-500/50 bg-blue-500/10"
 : "border-theme bg-blue-soft hover:border-blue-500/30"
 }`}
 >
 <div className="font-semibold">{option.title}</div>
 <p className="mt-2 text-sm text-muted">{option.text}</p>
 {option.type === "pickup" && option.address && (
 <p className="mt-3 text-xs text-muted-soft">
 {getAddressText(option.address)}
 </p>
 )}
 </button>
 ))}
 </div>

 {delivery.method === "pickup" && (
 <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
 <div className="text-sm uppercase tracking-[0.18em] text-blue-500">
 Адрес ПВЗ
 </div>
 <div className="mt-2 text-xl font-bold">{delivery.deliveryTitle || "Самовывоз"}</div>
 <p className="mt-2 text-muted">{delivery.address}</p>
 <p className="mt-1 text-sm text-muted-soft">Адрес берётся из настроек сайта.</p>
 </div>
 )}

 {delivery.method === "courier" && (
 <div className="mt-5 space-y-4">
 {isRegistered ? (
 <>
 <div>
 <div className="font-semibold">Адрес доставки</div>
 <p className="mt-1 text-sm text-muted">
 Выберите сохранённый адрес или добавьте новый.
 </p>
 </div>

 {savedAddresses.length > 0 && (
 <div className="grid gap-3">
 {savedAddresses.map((address) => (
 <button
 key={address}
 type="button"
 onClick={() => selectSavedAddress(address)}
 className={`rounded-2xl border p-4 text-left text-sm transition-all ${
 delivery.savedAddress === address || delivery.address === address
 ? "border-blue-500/50 bg-blue-500/10"
 : "border-theme bg-blue-soft hover:border-blue-500/30"
 }`}
 >
 {address}
 </button>
 ))}
 </div>
 )}

 {isAddingAddress ? (
 <div className="rounded-2xl border border-theme bg-blue-soft p-4">
 <div className="grid items-start gap-3 md:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.5fr)]">
 <AddressSuggestionInput
 value={delivery.city}
 city=""
 mode="city"
 placeholder="Город или населённый пункт"
 onChange={(value) => {
 setNewAddress("");
 setDelivery((current) => ({
 ...current,
 method: "courier",
 city: value,
 address: "",
 savedAddress: "",
 }));
 }}
 onSelect={(suggestion) => {
 setNewAddress("");
 setDelivery((current) => ({
 ...current,
 method: "courier",
 city: suggestion.city || suggestion.value,
 address: "",
 savedAddress: "",
 }));
 }}
 />
 <AddressSuggestionInput
 value={newAddress}
 city={delivery.city}
 placeholder="Улица и дом"
 onChange={setNewAddress}
 onSelect={(suggestion) => {
 setNewAddress(suggestion.value);
 setDelivery((current) => ({
 ...current,
 method: "courier",
 city: suggestion.city || current.city,
 }));
 }}
 />
 </div>

 <div className="mt-3 flex gap-3">
 <button
 type="button"
 onClick={addSavedAddress}
 className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
 >
 Сохранить адрес
 </button>

 <button
 type="button"
 onClick={() => {
 setIsAddingAddress(false);
 setNewAddress("");
 }}
 className="rounded-xl border border-theme bg-transparent px-3 py-2 text-center text-xs transition-colors hover:border-blue-500/40 hover:bg-blue-soft sm:px-5 sm:py-3 sm:text-sm"
 >
 Отмена
 </button>
 </div>
 </div>
 ) : (
 <button
 type="button"
 onClick={() => setIsAddingAddress(true)}
 className="w-full rounded-xl border border-theme bg-transparent px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 >
 Добавить адрес
 </button>
 )}
 </>
 ) : (
 <>
 <div>
 <div className="font-semibold">Адрес доставки</div>
 <p className="mt-1 text-sm text-muted">
 Для гостя достаточно указать город и адрес, куда нужно привезти заказ.
 </p>
 </div>

 <div className="grid gap-3 md:grid-cols-2">
 <AddressSuggestionInput
 value={delivery.city}
 city=""
 mode="city"
 placeholder="Город или населённый пункт"
 onChange={(value) =>
 setDelivery((current) => ({
 ...current,
 method: "courier",
 city: value,
 address: "",
 savedAddress: "",
 }))
 }
 onSelect={(suggestion) =>
 setDelivery((current) => ({
 ...current,
 method: "courier",
 city: suggestion.city || suggestion.value,
 address: "",
 savedAddress: "",
 }))
 }
 />

 <AddressSuggestionInput
 value={delivery.address}
 city={delivery.city}
 placeholder="Улица, дом, квартира"
 onChange={(value) =>
 setDelivery((current) => ({
 ...current,
 method: "courier",
 address: value,
 savedAddress: "",
 }))
 }
 onSelect={(suggestion) =>
 setDelivery((current) => ({
 ...current,
 method: "courier",
 city: suggestion.city || current.city,
 address: suggestion.value,
 savedAddress: "",
 }))
 }
 />
 </div>
 </>
 )}
 </div>
 )}

 {deliveryValidationError ? (
 <p className="mt-4 text-sm text-red-500">{deliveryValidationError}</p>
 ) : null}

 <div className="mt-6 flex justify-end">
 <button
 type="button"
 onClick={() => setActiveModal(null)}
 disabled={!hasDelivery}
 className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:text-white/60"
 >
 Сохранить доставку
 </button>
 </div>
 </Modal>
 )}

 {activeModal === "contacts" && !isRegistered && (
 <Modal title="Контакты для заказа" onClose={() => setActiveModal(null)}>
 <p className="text-sm text-muted">
 Контакты нужны только для гостевого заказа. У зарегистрированного клиента
 этот блок скрыт, потому что данные берутся из профиля.
 </p>

 <div className="mt-5 grid gap-3 md:grid-cols-2">
 <input
 value={customer.name}
 onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
 placeholder="Ваше имя"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />

 <input
 value={customer.phone}
 onChange={(event) =>
 setCustomer((current) => ({
 ...current,
 phone: formatRuPhone(event.target.value),
 }))
 }
 placeholder="+7 (999) 000-00-00"
 inputMode="tel"
 maxLength={18}
 className="h-12 rounded-xl border border-theme bg-transparent px-4 outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />

 <input
 value={customer.email}
 onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
 placeholder="E-mail, необязательно"
 type="email"
 inputMode="email"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 outline-none placeholder:text-muted-soft focus:border-blue-500/50 md:col-span-2"
 />
 </div>

 {contactValidationError ? (
 <p className="mt-4 text-sm text-red-500">{contactValidationError}</p>
 ) : null}

 <textarea
 value={comment}
 onChange={(event) => setComment(event.target.value)}
 placeholder="Комментарий к заказу"
 rows={4}
 className="mt-3 w-full rounded-xl border border-theme bg-transparent px-4 py-3 outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />

 <div className="mt-6 flex justify-end">
 <button
 type="button"
 onClick={() => setActiveModal(null)}
 disabled={!hasGuestContacts}
 className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:text-white/60"
 >
 Сохранить контакты
 </button>
 </div>
 </Modal>
 )}

 {itemPendingRemove && (
 <Modal title="Удалить товар?" onClose={() => setItemPendingRemove(null)}>
 <p className="text-muted">
 {itemPendingRemove.title} будет удалён из корзины.
 </p>

 <div className="mt-8 flex flex-col gap-3 sm:flex-row">
 <button
 type="button"
 onClick={() => setItemPendingRemove(null)}
 className="flex-1 rounded-xl border border-theme bg-transparent px-6 py-4 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 >
 Оставить
 </button>

 <button
 type="button"
 onClick={() => removeItem(itemPendingRemove.sku)}
 className="flex-1 rounded-xl bg-red-500 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-red-400"
 >
 Удалить
 </button>
 </div>
 </Modal>
 )}
 </main>
 );
}

function AddressSuggestionInput({
 value,
 city,
 mode = "address",
 placeholder,
 onChange,
 onSelect,
}: {
 value: string;
 city: string;
 mode?: "city" | "address";
 placeholder: string;
 onChange: (value: string) => void;
 onSelect: (suggestion: AddressSuggestion) => void;
}) {
 const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
 const [loading, setLoading] = useState(false);
 const [open, setOpen] = useState(false);
 const [searched, setSearched] = useState(false);
 const [configured, setConfigured] = useState<boolean | null>(null);
 const [providerMessage, setProviderMessage] = useState("");
 const [committedValue, setCommittedValue] = useState("");
 const [activeIndex, setActiveIndex] = useState(-1);
 const [sessionToken] = useState(() => {
 if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
 return crypto.randomUUID();
 }
 return `address-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 });

 useEffect(() => {
 const query = value.trim();

 if (query.length < 2 || query === committedValue) {
 setSuggestions([]);
 setOpen(false);
 setSearched(false);
 setActiveIndex(-1);
 return;
 }

 let active = true;
 const controller = new AbortController();
 const timeout = window.setTimeout(async () => {
 setLoading(true);
 setSearched(false);

 try {
 const response = await fetch("/api/address-suggestions", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ query, city, mode, sessionToken }),
 cache: "no-store",
 signal: controller.signal,
 });
 const payload = (await response.json().catch(() => null)) as
 | {
 suggestions?: AddressSuggestion[];
 configured?: boolean;
 providerMessage?: string;
 source?: string;
 }
 | null;

 if (!active) return;

 const next = Array.isArray(payload?.suggestions)
 ? payload.suggestions.slice(0, 12)
 : [];
 setSuggestions(next);
 setConfigured(typeof payload?.configured === "boolean" ? payload.configured : null);
 setProviderMessage(
 typeof payload?.providerMessage === "string"
 ? payload.providerMessage
 : ""
 );
 setSearched(true);
 setOpen(next.length > 0);
 setActiveIndex(next.length > 0 ? 0 : -1);
 } catch (error) {
 if (!active || (error instanceof DOMException && error.name === "AbortError")) {
 return;
 }
 setSuggestions([]);
 setProviderMessage("Не удалось выполнить поиск. Проверьте соединение и Railway Logs.");
 setSearched(true);
 setOpen(false);
 setActiveIndex(-1);
 } finally {
 if (active) setLoading(false);
 }
 }, 250);

 return () => {
 active = false;
 controller.abort();
 window.clearTimeout(timeout);
 };
 }, [city, committedValue, mode, sessionToken, value]);

 function chooseSuggestion(suggestion: AddressSuggestion) {
 const selectedValue =
 mode === "city" ? suggestion.city || suggestion.value : suggestion.value;
 setCommittedValue(selectedValue);
 onSelect(suggestion);
 onChange(selectedValue);
 setSuggestions([]);
 setOpen(false);
 setSearched(false);
 setActiveIndex(-1);
 }

 return (
 <div className={`relative min-w-0 ${open ? "z-[400]" : "z-0"}`}>
 <div className="relative">
 <input
 value={value}
 onChange={(event) => {
 setCommittedValue("");
 onChange(event.target.value);
 setOpen(false);
 }}
 onFocus={() => {
 if (suggestions.length > 0) setOpen(true);
 }}
 onBlur={() => window.setTimeout(() => setOpen(false), 180)}
 onKeyDown={(event) => {
 if (!open) return;

 if (event.key === "ArrowDown") {
 event.preventDefault();
 setActiveIndex((current) =>
 Math.min(current + 1, suggestions.length - 1)
 );
 }

 if (event.key === "ArrowUp") {
 event.preventDefault();
 setActiveIndex((current) => Math.max(current - 1, 0));
 }

 if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
 event.preventDefault();
 chooseSuggestion(suggestions[activeIndex]);
 }

 if (event.key === "Escape") {
 setOpen(false);
 }
 }}
 placeholder={placeholder}
 autoComplete={mode === "city" ? "address-level2" : "street-address"}
 aria-expanded={open}
 aria-autocomplete="list"
 className="h-12 w-full rounded-xl border border-theme bg-transparent px-4 pr-10 outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />
 {loading ? (
 <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500">
 …
 </span>
 ) : null}
 </div>

 <div className="mt-1.5 min-h-[18px] px-1 text-[11px] leading-4">
 {loading ? (
 <span className="text-blue-500">Ищем варианты…</span>
 ) : searched && suggestions.length === 0 ? (
 <span className={providerMessage ? "text-red-500" : "text-muted-soft"}>
 {providerMessage ||
 "Ничего не найдено. Проверьте написание или продолжите ввод."}
 </span>
 ) : (
 <span className="text-muted-soft">
 {mode === "city"
 ? configured === false
 ? "Базовый поиск по России. Для полного справочника подключите ключ подсказок."
 : "Города, посёлки и другие населённые пункты по всей России."
 : city
 ? `Улицы и дома в городе: ${city}.`
 : "Сначала выберите город, затем улицу и дом."}
 </span>
 )}
 </div>

 {suggestions.length > 0 && providerMessage ? (
 <div className="mt-1 px-1 text-[10px] leading-4 text-green-600">
 {providerMessage}
 </div>
 ) : null}

 {open && suggestions.length > 0 ? (
 <div
 role="listbox"
 className={`absolute left-0 top-[54px] z-[500] max-h-72 overflow-y-auto rounded-2xl border border-black/10 bg-white p-1.5 text-[#07111f] dark:border-white/15 dark:bg-[#081526] dark:text-white ${
 mode === "city"
 ? "w-[360px] max-w-[calc(100vw-48px)]"
 : "w-full min-w-[280px]"
 }`}
 >
 {suggestions.map((suggestion, index) => (
 <button
 key={`${suggestion.fiasId || "address"}-${suggestion.unrestrictedValue}-${index}`}
 type="button"
 role="option"
 aria-selected={index === activeIndex}
 onMouseEnter={() => setActiveIndex(index)}
 onMouseDown={(event) => {
 event.preventDefault();
 chooseSuggestion(suggestion);
 }}
 className={`block w-full rounded-xl px-3 py-3 text-left text-sm transition-colors ${
 index === activeIndex
 ? "bg-blue-600 text-white"
 : "bg-white text-[#07111f] hover:bg-[#eef4ff] dark:bg-[#081526] dark:text-white dark:hover:bg-[#10233d]"
 }`}
 >
 <span className="block font-semibold">
 {suggestion.value}
 </span>
 {suggestion.unrestrictedValue &&
 suggestion.unrestrictedValue !== suggestion.value ? (
 <span
 className={`mt-1 block text-xs leading-5 ${
 index === activeIndex
 ? "text-white/80"
 : "text-black/55 dark:text-white/60"
 }`}
 >
 {suggestion.unrestrictedValue}
 </span>
 ) : null}
 </button>
 ))}
 </div>
 ) : null}
 </div>
 );
}

function getDeliverySummary(delivery: DeliveryData, isRegistered: boolean) {
 if (delivery.method === "pickup") {
 return `${delivery.deliveryTitle || "Самовывоз"}: ${delivery.address || "адрес не выбран"}`;
 }

 if (delivery.method === "courier") {
 if (isRegistered && (delivery.savedAddress || delivery.address)) {
 return delivery.savedAddress || delivery.address;
 }

 if (delivery.city && delivery.address) {
 return `${delivery.city}, ${delivery.address}`;
 }

 return `${delivery.deliveryTitle || "Курьерская доставка"}: адрес не указан`;
 }

 return "Выберите удобный способ получения заказа";
}

function getMissingText(
 hasDelivery: boolean,
 isRegistered: boolean,
 hasGuestContacts: boolean
) {
 if (!hasDelivery && !isRegistered && !hasGuestContacts) {
 return "Чтобы оформить заказ, выберите доставку и заполните контакты.";
 }

 if (!hasDelivery) {
 return "Чтобы оформить заказ, выберите способ получения заказа.";
 }

 if (!isRegistered && !hasGuestContacts) {
 return "Чтобы оформить заказ, укажите имя и телефон.";
 }

 return "Заполните обязательные данные.";
}

function CheckoutCard({
 title,
 text,
 status,
 isComplete,
 action,
 onClick,
 className = "",
}: {
 title: string;
 text: string;
 status: string;
 isComplete: boolean;
 action: string;
 onClick: () => void;
 className?: string;
}) {
 return (
 <button
 type="button"
 onClick={onClick}
 className={`card flex min-h-[110px] w-full flex-col justify-between rounded-[20px] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-blue-soft ${className}`}
 >
 <div className="w-full min-w-0">
 <div className="flex items-center justify-between gap-2">
 <div className="min-w-0 flex-1 truncate text-[15px] font-bold leading-snug">{title}</div>
 <span
 className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5 ${
 isComplete
 ? "border-green-500/30 bg-green-500/10 text-green-500"
 : "border-orange-500/30 bg-orange-500/10 text-orange-500"
 }`}
 >
 {status}
 </span>
 </div>

 <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{text}</p>
 </div>

 <div className="mt-3 text-[13px] font-medium text-blue-500">{action}</div>
 </button>
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
 <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 py-4 backdrop-blur-sm md:items-center md:px-6">
 <div className="card relative max-h-[92vh] w-full max-w-[720px] overflow-visible rounded-[24px] p-5 sm:rounded-[28px] sm:p-6 md:p-8">
 <div className="flex items-start justify-between gap-4">
 <h2 className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{title}</h2>

 <button
 type="button"
 onClick={onClose}
 className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-theme bg-transparent text-xl transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 aria-label="Закрыть"
 >
 ×
 </button>
 </div>

 <div className="mt-3 max-h-[calc(92vh-96px)] overflow-y-auto overflow-x-visible pr-1 sm:mt-6">{children}</div>
 </div>
 </div>
 );
}

function RecommendationStrip({
 title,
 items,
 addedSku,
 onAdd,
}: {
 title: string;
 items: ProductPosition[];
 addedSku: string;
 onAdd: (position: ProductPosition) => void;
}) {
 if (items.length === 0) {
 return null;
 }

 return (
 <section>
 <h2 className="text-2xl font-bold">{title}</h2>

 <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-5">
 {items.map((position) => {
 const product = getProductBySlug(position.modelSlug);
 const isAdded = addedSku === position.sku;

 if (!product) {
 return null;
 }

 return (
 <article
 key={position.sku}
 className="card rounded-[20px] p-3 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/35 hover:bg-blue-soft sm:rounded-3xl sm:p-4"
 >
 <div className="soft-box photo-white-box flex h-[108px] items-center justify-center rounded-2xl text-xs text-muted-soft sm:h-[150px] sm:text-sm">
 Фото
 </div>

 <div className="pt-4">
 <div className="text-sm text-muted-soft">{product.brand}</div>

 <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-tight sm:min-h-[40px] sm:text-base">
 {position.title}
 </h3>

 <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted-soft">
 <span>{position.memory}</span>
 <span>·</span>
 <span>{position.color}</span>
 <span>·</span>
 <span>{position.sim}</span>
 </div>

 <p className="mt-3 text-base font-bold">{position.price}</p>

 {position.oldPrice && (
 <p className="text-xs text-muted-soft line-through">{position.oldPrice}</p>
 )}

 <button
 type="button"
 onClick={() => onAdd(position)}
 className={`mt-4 flex w-full items-center justify-center rounded-xl py-3 text-sm font-medium text-white transition-colors ${
 isAdded
 ? "bg-green-500 hover:bg-green-500"
 : "bg-blue-600 hover:bg-blue-500"
 }`}
 >
 {isAdded ? "Добавлено ✓" : "В корзину"}
 </button>
 </div>
 </article>
 );
 })}
 </div>
 </section>
 );
}

function ProductStrip({
 title,
 items,
}: {
 title: string;
 items: RecentlyViewedProduct[];
}) {
 if (items.length === 0) {
 return null;
 }

 return (
 <section>
 <h2 className="text-2xl font-bold">{title}</h2>

 <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-5">
 {items.map((product, index) => (
 <Link
 key={`${product.slug}-${index}`}
 href={`/product/${product.slug}`}
 className="card group rounded-[20px] p-3 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/35 hover:bg-blue-soft sm:rounded-3xl sm:p-4"
 >
 <div className="soft-box photo-white-box flex h-[108px] items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-white text-xs text-muted-soft sm:h-[150px] sm:text-sm">
 {product.image ? (
 <>
<img
 src={product.image}
 alt={product.name}
 loading="lazy"
 className="h-full w-full object-contain p-2"
 />
 </>
 ) : (
 "Фото"
 )}
 </div>

 <div className="pt-4">
 <div className="text-sm text-muted-soft">{product.brand}</div>

 <h3 className="mt-1 line-clamp-2 font-bold leading-tight">
 {product.name}
 </h3>

 <p className="mt-1 text-sm text-muted">{product.price}</p>

 <div className="mt-3 flex items-center justify-center rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors group-hover:bg-blue-500 sm:mt-4 sm:py-3">
 Смотреть
 </div>
 </div>
 </Link>
 ))}
 </div>
 </section>
 );
}
