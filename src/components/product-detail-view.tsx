"use client";

import Link from "next/link";
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { SiteHeader } from "@/components/site-header";
import { ProductTabs } from "@/components/product-tabs";
import { ArrowIcon } from "@/components/arrow-icon";
import type {
 PublicProductModel,
 PublicProductPosition,
} from "@/lib/public-catalog-db";
import { formatPrice, getPriceNumber } from "@/lib/product-pricing";

type ProductCard = PublicProductModel;
type ProductPosition = PublicProductPosition;

type ProductBenefit = {
 id: string;
 title: string;
 description: string;
 icon: string;
 image: string;
 href: string;
};

type ProductDetailViewProps = {
 product: ProductCard;
 positions: ProductPosition[];
 selectedPosition?: ProductPosition;
 benefits?: ProductBenefit[];
 relatedProducts?: ProductCard[];
 similarProducts?: ProductCard[];
};

type PositionDiscountQuote = {
 subtotal: number;
 statusDiscount: number;
 statusLabel: string;
 total: number;
};

type ProductReviewItem = {
 id: string;
 rating: number;
 text: string;
 verifiedPurchase: boolean;
 images: string[];
 helpfulCount: number;
 unhelpfulCount: number;
 userVote: number;
 author: string;
 createdAt: string;
};

type ProductQuestionItem = {
 id: string;
 authorName: string;
 text: string;
 answer: string;
 createdAt: string;
};

type ProductCommunity = {
 summary: {
 rating: number;
 reviewsCount: number;
 questionsCount: number;
 distribution: Array<{ rating: number; count: number }>;
 };
 authenticated: boolean;
 canReview: boolean;
 hasReview: boolean;
 reviews: ProductReviewItem[];
 questions: ProductQuestionItem[];
};

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
 const map = new Map<string, T>();

 items.forEach((item) => {
 const key = getKey(item);

 if (!map.has(key)) {
 map.set(key, item);
 }
 });

 return Array.from(map.values());
}

function getStatusName(status: string) {
 const statuses: Record<string, string> = {
 active: "В наличии",
 out_of_stock: "Нет в наличии",
 preorder: "Под заказ",
 hidden: "Скрыто",
 draft: "Черновик",
 };

 return statuses[status] ?? status;
}

function getProductStoryBlocks(product: ProductCard) {
 return Array.isArray(product.descriptionBlocks)
 ? product.descriptionBlocks
 : [];
}

function hasProductStory(product: ProductCard) {
 return (
 getProductStoryBlocks(product).length > 0 ||
 Boolean(product.description?.trim())
 );
}

function getFavoriteSlugs() {
 try {
 const saved = localStorage.getItem("netizen-favorite-slugs");
 const parsed = saved ? JSON.parse(saved) : [];

 return Array.isArray(parsed)
 ? parsed.filter((slug): slug is string => typeof slug === "string")
 : [];
 } catch {
 return [] as string[];
 }
}

function saveFavoriteSlugs(slugs: string[]) {
 const normalizedSlugs = Array.from(new Set(slugs));

 localStorage.setItem(
 "netizen-favorite-slugs",
 JSON.stringify(normalizedSlugs),
 );
 localStorage.setItem(
 "netizen-favorites-count",
 String(normalizedSlugs.length),
 );
 window.dispatchEvent(new Event("netizen-favorites-updated"));
}

function ProductMainImage({ src, alt }: { src: string; alt: string }) {
 return (
 <div className="relative mx-auto flex h-full min-h-[220px] w-full items-center justify-center overflow-hidden rounded-[16px] border border-theme bg-slate-50 text-muted-soft sm:h-auto sm:min-h-0 sm:aspect-[3/4] sm:max-w-[560px] sm:rounded-[30px] sm:border-0 sm:bg-white">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <Image quality={75} src={src}
 alt={alt}
 draggable={false}
 className="pointer-events-none h-full w-full select-none object-contain"
 />
 </div>
 );
}

function ProductImagePlaceholder() {
 return (
 <div className="mx-auto flex h-full min-h-[220px] w-full items-center justify-center overflow-hidden rounded-[16px] border border-theme bg-blue-soft text-muted-soft sm:h-auto sm:min-h-0 sm:aspect-[3/4] sm:max-w-[520px] sm:rounded-[30px]">
 Фото товара
 </div>
 );
}

export function ProductDetailView({
 product,
 positions,
 selectedPosition,
 benefits = [],
 relatedProducts = [],
 similarProducts = [],
}: ProductDetailViewProps) {
 const [selectedColor, setSelectedColor] = useState(
 selectedPosition?.color ?? "",
 );
 const [selectedMemory, setSelectedMemory] = useState(
 selectedPosition?.memory ?? "",
 );
 const [selectedSim, setSelectedSim] = useState(selectedPosition?.sim ?? "");

 const [quantity, setQuantity] = useState(1);
 const [addedToCart, setAddedToCart] = useState(false);
 const [isFavorite, setIsFavorite] = useState(false);
 const [showConfigEditor, setShowConfigEditor] = useState(false);
 const [activeImageIndex, setActiveImageIndex] = useState(0);
 const [positionDiscountQuote, setPositionDiscountQuote] = useState<PositionDiscountQuote | null>(null);
 const [community, setCommunity] = useState<ProductCommunity | null>(null);
 const [communityLoading, setCommunityLoading] = useState(true);
 const [showQuestionForm, setShowQuestionForm] = useState(false);
 const [showReviewForm, setShowReviewForm] = useState(false);
 const [questionText, setQuestionText] = useState("");
 const [questionName, setQuestionName] = useState("");
 const [questionEmail, setQuestionEmail] = useState("");
 const [reviewText, setReviewText] = useState("");
 const [reviewRating, setReviewRating] = useState(5);
 const [reviewImages, setReviewImages] = useState<string[]>([]);
 const [reviewSort, setReviewSort] = useState<
 "newest" | "oldest" | "highest" | "lowest" | "helpful"
 >("newest");
 const [communityMessage, setCommunityMessage] = useState("");
 const [communitySubmitting, setCommunitySubmitting] = useState(false);
 const [communityTab, setCommunityTab] = useState<"reviews" | "questions">("reviews");
 const [showCharacteristics, setShowCharacteristics] = useState(true);
 const galleryDragStartRef = useRef<{
 x: number;
 y: number;
 pointerId: number;
 } | null>(null);
 const configurationUrlReadyRef = useRef(false);


 const categoryName = product.categoryName || product.category;

 const memoryOptions = uniqueBy(positions, (position) => position.memory);
 const colorOptions = uniqueBy(positions, (position) => position.color);
 const simOptions = uniqueBy(positions, (position) => position.sim);

 const isConfigurationComplete =
 Boolean(selectedColor) && Boolean(selectedMemory) && Boolean(selectedSim);

 const activePosition = useMemo(() => {
 if (!isConfigurationComplete) {
 return undefined;
 }

 return positions.find(
 (position) =>
 position.color === selectedColor &&
 position.memory === selectedMemory &&
 position.sim === selectedSim,
 );
 }, [
 isConfigurationComplete,
 positions,
 selectedColor,
 selectedMemory,
 selectedSim,
 ]);

 useEffect(() => {
 if (activePosition) setShowConfigEditor(false);
 }, [activePosition]);

 useEffect(() => {
 const params = new URLSearchParams(window.location.search);

 if (!selectedPosition) {
 const color = params.get("color") ?? "";
 const memory = params.get("memory") ?? "";
 const sim = params.get("sim") ?? "";

 if (color) setSelectedColor(color);
 if (memory) setSelectedMemory(memory);
 if (sim) setSelectedSim(sim);
 }

 configurationUrlReadyRef.current = true;
 }, [selectedPosition]);

 useEffect(() => {
 if (!configurationUrlReadyRef.current) return;

 const params = new URLSearchParams(window.location.search);

 if (activePosition) {
 params.set("sku", activePosition.sku);
 params.set("color", activePosition.color);
 params.set("memory", activePosition.memory);
 params.set("sim", activePosition.sim);
 } else {
 params.delete("sku");

 if (selectedColor) params.set("color", selectedColor);
 else params.delete("color");

 if (selectedMemory) params.set("memory", selectedMemory);
 else params.delete("memory");

 if (selectedSim) params.set("sim", selectedSim);
 else params.delete("sim");
 }

 const query = params.toString();
 const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
 window.history.replaceState(window.history.state, "", nextUrl);
 }, [activePosition, selectedColor, selectedMemory, selectedSim]);

 const hasInvalidCompleteConfiguration =
 isConfigurationComplete && !activePosition;

 // Фото позиции показываем только тогда, когда клиент реально выбрал
 // конкретную конфигурацию или пришёл по ссылке на конкретный SKU.
 // До выбора конфигурации остаётся фото материнской карточки, чтобы
 // разные комплектации не смешивались в галерее.
 const previewPosition = activePosition ?? selectedPosition;
 const detailsPosition = previewPosition ?? positions[0];
 const mediaImages =
 previewPosition?.images && previewPosition.images.length > 0
 ? previewPosition.images
 : product.images && product.images.length > 0
 ? product.images
 : product.image
 ? [product.image]
 : [];

 const activeImage = mediaImages[activeImageIndex] ?? mediaImages[0] ?? "";

 useEffect(() => {
 try {
 const storageKey = "netizen-recently-viewed";
 const savedItems = localStorage.getItem(storageKey);
 const parsedItems = savedItems ? JSON.parse(savedItems) : [];
 const currentItems = Array.isArray(parsedItems) ? parsedItems : [];
 const viewedProduct = {
 slug: product.slug,
 name: product.name,
 brand: product.brand,
 price: activePosition?.price || product.price,
 image: activeImage || product.images?.[0] || product.image || "",
 };
 const nextItems = [
 viewedProduct,
 ...currentItems.filter(
 (item: { slug?: string }) => item?.slug && item.slug !== product.slug,
 ),
 ].slice(0, 10);

 localStorage.setItem(storageKey, JSON.stringify(nextItems));
 } catch {
 // Просмотр товара не должен мешать работе карточки.
 }
 }, [
 activeImage,
 activePosition?.price,
 product.brand,
 product.image,
 product.images,
 product.name,
 product.price,
 product.slug,
 ]);

 useEffect(() => {
 setActiveImageIndex(0);
 }, [previewPosition?.sku, product.slug]);

 useEffect(() => {
 if (!activePosition?.sku) {
 setPositionDiscountQuote(null);
 return;
 }

 let active = true;
 fetch("/api/checkout/quote", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ items: [{ sku: activePosition.sku, quantity }] }),
 })
 .then((response) => response.json())
 .then((payload: { quote?: PositionDiscountQuote }) => {
 if (active) setPositionDiscountQuote(payload.quote ?? null);
 })
 .catch(() => {
 if (active) setPositionDiscountQuote(null);
 });

 return () => {
 active = false;
 };
 }, [activePosition?.sku, quantity]);

 async function loadCommunity() {
 setCommunityLoading(true);

 try {
 const response = await fetch(`/api/products/${product.slug}/community`, {
 cache: "no-store",
 });
 const payload = (await response.json().catch(() => null)) as ProductCommunity | null;
 setCommunity(response.ok ? payload : null);
 } catch {
 setCommunity(null);
 } finally {
 setCommunityLoading(false);
 }
 }

 useEffect(() => {
 void loadCommunity();
 }, [product.slug]);

 function scrollToCommunity() {
 document.getElementById("product-community")?.scrollIntoView({
 behavior: "smooth",
 block: "start",
 });
 }

 async function submitQuestion() {
 if (communitySubmitting) return;
 setCommunitySubmitting(true);
 setCommunityMessage("");

 try {
 const response = await fetch(`/api/products/${product.slug}/community`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 type: "question",
 text: questionText,
 authorName: questionName,
 authorEmail: questionEmail,
 }),
 });
 const payload = (await response.json().catch(() => ({}))) as { error?: string };

 if (!response.ok) {
 setCommunityMessage(payload.error || "Не удалось отправить вопрос.");
 return;
 }

 setQuestionText("");
 setQuestionName("");
 setQuestionEmail("");
 setShowQuestionForm(false);
 setCommunityMessage("Вопрос отправлен.");
 await loadCommunity();
 } catch {
 setCommunityMessage("Не удалось отправить вопрос.");
 } finally {
 setCommunitySubmitting(false);
 }
 }

 async function submitReview() {
 if (communitySubmitting) return;
 setCommunitySubmitting(true);
 setCommunityMessage("");

 try {
 const response = await fetch(`/api/products/${product.slug}/community`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 type: "review",
 text: reviewText,
 rating: reviewRating,
 images: reviewImages,
 }),
 });
 const payload = (await response.json().catch(() => ({}))) as { error?: string };

 if (!response.ok) {
 setCommunityMessage(payload.error || "Не удалось отправить отзыв.");
 return;
 }

 setReviewText("");
 setReviewRating(5);
 setReviewImages([]);
 setShowReviewForm(false);
 setCommunityMessage("Спасибо! Отзыв опубликован.");
 await loadCommunity();
 } catch {
 setCommunityMessage("Не удалось отправить отзыв.");
 } finally {
 setCommunitySubmitting(false);
 }
 }

 function showPreviousImage() {
 if (mediaImages.length <= 1) return;
 setActiveImageIndex((current) =>
 current <= 0 ? mediaImages.length - 1 : current - 1,
 );
 }

 function showNextImage() {
 if (mediaImages.length <= 1) return;
 setActiveImageIndex((current) =>
 current >= mediaImages.length - 1 ? 0 : current + 1,
 );
 }

 function handleGalleryPointerDown(event: PointerEvent<HTMLDivElement>) {
 if (mediaImages.length <= 1) return;
 if (event.pointerType === "mouse" && event.button !== 0) return;

 const target = event.target;

 if (target instanceof Element && target.closest("button")) return;

 galleryDragStartRef.current = {
 x: event.clientX,
 y: event.clientY,
 pointerId: event.pointerId,
 };

 try {
 event.currentTarget.setPointerCapture(event.pointerId);
 } catch {
 // pointer capture может быть недоступен в отдельных браузерах.
 }
 }

 function handleGalleryPointerUp(event: PointerEvent<HTMLDivElement>) {
 const dragStart = galleryDragStartRef.current;
 galleryDragStartRef.current = null;

 if (!dragStart || mediaImages.length <= 1) return;

 try {
 event.currentTarget.releasePointerCapture(dragStart.pointerId);
 } catch {
 // Если браузер уже сам отпустил pointer capture — это нормально.
 }

 const diffX = event.clientX - dragStart.x;
 const diffY = event.clientY - dragStart.y;

 if (Math.abs(diffX) < 28 || Math.abs(diffX) < Math.abs(diffY) * 1.15)
 return;

 if (diffX < 0) {
 showNextImage();
 } else {
 showPreviousImage();
 }
 }

 function handleGalleryPointerCancel() {
 galleryDragStartRef.current = null;
 }

 function handleGalleryKeyDown(event: KeyboardEvent<HTMLDivElement>) {
 if (mediaImages.length <= 1) return;

 if (event.key === "ArrowLeft") {
 event.preventDefault();
 showPreviousImage();
 }

 if (event.key === "ArrowRight") {
 event.preventDefault();
 showNextImage();
 }
 }

 const sortedReviews = useMemo(() => {
 const reviews = [...(community?.reviews ?? [])];

 return reviews.sort((a, b) => {
 if (reviewSort === "oldest") {
 return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
 }

 if (reviewSort === "highest") {
 return b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
 }

 if (reviewSort === "lowest") {
 return a.rating - b.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
 }

 if (reviewSort === "helpful") {
 return (
 b.helpfulCount - b.unhelpfulCount -
 (a.helpfulCount - a.unhelpfulCount)
 );
 }

 return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
 });
 }, [community?.reviews, reviewSort]);

 function formatReviewDate(value: string) {
 const date = new Date(value);

 if (Number.isNaN(date.getTime())) return "";

 return new Intl.DateTimeFormat("ru-RU", {
 day: "numeric",
 month: "long",
 year: "numeric",
 }).format(date);
 }

 async function handleReviewImages(files: FileList | null) {
 if (!files) return;

 const selected = Array.from(files).slice(0, Math.max(0, 4 - reviewImages.length));
 const nextImages: string[] = [];

 for (const file of selected) {
 if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
 setCommunityMessage("Можно добавить до 4 изображений, каждое не больше 2 МБ.");
 continue;
 }

 const image = await new Promise<string>((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = () =>
 typeof reader.result === "string"
 ? resolve(reader.result)
 : reject(new Error("read"));
 reader.onerror = () => reject(reader.error);
 reader.readAsDataURL(file);
 }).catch(() => "");

 if (image) nextImages.push(image);
 }

 setReviewImages((current) => [...current, ...nextImages].slice(0, 4));
 }

 async function voteReview(reviewId: string, vote: "helpful" | "unhelpful") {
 setCommunityMessage("");

 try {
 const response = await fetch(`/api/products/${product.slug}/community`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ type: "vote", reviewId, vote }),
 });
 const payload = (await response.json().catch(() => ({}))) as { error?: string };

 if (!response.ok) {
 setCommunityMessage(payload.error || "Не удалось оценить отзыв.");
 return;
 }

 await loadCommunity();
 } catch {
 setCommunityMessage("Не удалось оценить отзыв.");
 }
 }

 const priceRange = useMemo(() => {
 const prices = positions
 .map((position) => getPriceNumber(position.price))
 .filter((price) => price > 0);

 if (prices.length === 0) {
 return "Цена по запросу";
 }

 const minPrice = Math.min(...prices);
 const maxPrice = Math.max(...prices);

 if (minPrice === maxPrice) {
 return formatPrice(minPrice);
 }

 return `от ${formatPrice(minPrice)} до ${formatPrice(maxPrice)}`;
 }, [positions]);

 const unitPrice = activePosition ? getPriceNumber(activePosition.price) : 0;
 const oldUnitPrice = activePosition ? getPriceNumber(activePosition.oldPrice) : 0;
 const finalTotalPrice =
 activePosition && positionDiscountQuote
 ? positionDiscountQuote.total
 : unitPrice * quantity;
 const finalUnitPrice =
 quantity > 0 ? Math.round(finalTotalPrice / quantity) : finalTotalPrice;
 const oldTotalPrice = oldUnitPrice > 0 ? oldUnitPrice * quantity : 0;
 const baseTotalPrice = unitPrice * quantity;
 const crossedTotalPrice =
 positionDiscountQuote?.statusDiscount && baseTotalPrice > finalTotalPrice
 ? baseTotalPrice
 : oldTotalPrice;
 const quantityPriceLabel =
 quantity > 1 ? `Итого за ${quantity} шт.` : "Цена за 1 шт.";

 useEffect(() => {
 setIsFavorite(getFavoriteSlugs().includes(product.slug));
 }, [product.slug]);

 function toggleFavorite() {
 const favoriteSlugs = getFavoriteSlugs();
 const nextSlugs = favoriteSlugs.includes(product.slug)
 ? favoriteSlugs.filter((slug) => slug !== product.slug)
 : [...favoriteSlugs, product.slug];

 saveFavoriteSlugs(nextSlugs);
 setIsFavorite(nextSlugs.includes(product.slug));
 }

 function canSelectConfiguration(nextSelection: {
 color?: string;
 memory?: string;
 sim?: string;
 }) {
 return positions.some((position) => {
 const color = nextSelection.color ?? selectedColor;
 const memory = nextSelection.memory ?? selectedMemory;
 const sim = nextSelection.sim ?? selectedSim;

 return (
 (!color || position.color === color) &&
 (!memory || position.memory === memory) &&
 (!sim || position.sim === sim)
 );
 });
 }

 function saveSelectedPositionToCart() {
 if (!activePosition) return;

 const cartItem = {
 sku: activePosition.sku,
 modelSlug: product.slug,
 productName: product.name,
 brand: product.brand,
 title: activePosition.title,
 price: activePosition.price,
 oldPrice: activePosition.oldPrice,
 memory: activePosition.memory,
 color: activePosition.color,
 colorHex: activePosition.colorHex,
 sim: activePosition.sim,
 quantity,
 stock: activePosition.stock,
 status: activePosition.status,
 image:
 activePosition.images?.[0] ||
 product.images?.[0] ||
 product.image ||
 "",
 };

 try {
 const savedItems = localStorage.getItem("netizen-cart-items");
 const parsedItems = savedItems ? JSON.parse(savedItems) : [];
 const currentItems = Array.isArray(parsedItems) ? parsedItems : [];
 const existingItem = currentItems.find(
 (item: { sku?: string }) => item.sku === activePosition.sku,
 );

 const nextItems = existingItem
 ? currentItems.map((item: typeof cartItem) =>
 item.sku === activePosition.sku
 ? {
 ...item,
 ...cartItem,
 quantity: Math.min(
 activePosition.stock,
 Number(item.quantity || 0) + quantity,
 ),
 }
 : item,
 )
 : [...currentItems, cartItem];

 const cartCount = nextItems.reduce(
 (sum: number, item: { quantity?: number }) =>
 sum + Number(item.quantity || 0),
 0,
 );

 localStorage.setItem("netizen-cart-items", JSON.stringify(nextItems));
 localStorage.setItem("netizen-cart-count", String(cartCount));
 window.dispatchEvent(new Event("netizen-cart-updated"));
 } catch {
 localStorage.setItem("netizen-cart-items", JSON.stringify([cartItem]));
 localStorage.setItem("netizen-cart-count", String(quantity));
 window.dispatchEvent(new Event("netizen-cart-updated"));
 }
 }

 function decreaseQuantity() {
 setQuantity((current) => Math.max(1, current - 1));
 }

 function increaseQuantity() {
 if (!activePosition) return;

 setQuantity((current) => Math.min(activePosition.stock, current + 1));
 }

 function handleAddToCart() {
 if (!activePosition) return;

 saveSelectedPositionToCart();
 setAddedToCart(true);

 setTimeout(() => {
 setAddedToCart(false);
 }, 1800);
 }

 function selectColor(value: string) {
 setSelectedColor((current) => (current === value ? "" : value));
 setQuantity(1);
 }

 function selectMemory(value: string) {
 setSelectedMemory((current) => (current === value ? "" : value));
 setQuantity(1);
 }

 function selectSim(value: string) {
 setSelectedSim((current) => (current === value ? "" : value));
 setQuantity(1);
 }

 async function copyConfigurationLink() {
 try {
 await navigator.clipboard.writeText(window.location.href);
 setCommunityMessage("Ссылка на конфигурацию скопирована.");
 } catch {
 setCommunityMessage("Не удалось скопировать ссылку.");
 }
 }

 return (
 <main className="min-h-screen bg-page px-3 py-4 text-main transition-colors duration-700 sm:px-5 sm:py-6">
 <div className="mx-auto max-w-[1440px]">
 <SiteHeader />

 <nav className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-muted sm:mt-10 sm:text-sm" aria-label="Хлебные крошки">
 <Link href="/" className="transition-colors hover:text-blue-500">
 Главная
 </Link>
 <span className="text-muted-soft inline-flex"><ArrowIcon width={12} height={12} direction="right" /></span>
 <Link href="/catalog" className="transition-colors hover:text-blue-500">
 Каталог
 </Link>
 {product.category ? (
 <>
 <span className="text-muted-soft inline-flex"><ArrowIcon width={12} height={12} direction="right" /></span>
 <Link href={`/catalog/${product.category}`} className="transition-colors hover:text-blue-500">
 {categoryName}
 </Link>
 </>
 ) : null}
 <span className="text-muted-soft inline-flex"><ArrowIcon width={12} height={12} direction="right" /></span>
 <span className="text-main">{product.name}</span>
 </nav>

 <section className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-[52%_1fr] lg:mt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
 <div className="flex h-full flex-col gap-4">
 <div className="card rounded-[28px] p-4 sm:rounded-[36px] sm:p-6">
 <div
 className="relative cursor-grab touch-pan-y select-none active:cursor-grabbing"
 role="region"
 tabIndex={0}
 aria-label="Галерея товара. Проведите мышкой или пальцем влево или вправо, чтобы сменить фото."
 onPointerDown={handleGalleryPointerDown}
 onPointerUp={handleGalleryPointerUp}
 onPointerCancel={handleGalleryPointerCancel}
 onKeyDown={handleGalleryKeyDown}
 >
 {activeImage ? (
 <ProductMainImage
 src={activeImage}
 alt={previewPosition?.title ?? product.name}
 />
 ) : (
 <ProductImagePlaceholder />
 )}

 {mediaImages.length > 1 && (
 <>
 <button
 type="button"
 onClick={showPreviousImage}
 className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-theme bg-card/90 text-main backdrop-blur transition-colors hover:border-blue-500/50 hover:bg-blue-soft sm:flex sm:left-4 sm:h-11 sm:w-11 sm:rounded-2xl"
 aria-label="Предыдущее фото"
 >
 <ArrowIcon width={14} height={14} direction="left" />
 </button>
 <button
 type="button"
 onClick={showNextImage}
 className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-theme bg-card/90 text-main backdrop-blur transition-colors hover:border-blue-500/50 hover:bg-blue-soft sm:flex sm:right-4 sm:h-11 sm:w-11 sm:rounded-2xl"
 aria-label="Следующее фото"
 >
 <ArrowIcon width={14} height={14} />
 </button>
 </>
 )}
 </div>

 <div className="mx-auto mt-1.5 flex justify-center gap-1 sm:hidden">
 {mediaImages.slice(0, 7).map((_, dotIndex) => (
 <button
 key={dotIndex}
 type="button"
 onClick={() => setActiveImageIndex(dotIndex)}
 className={`h-1 rounded-full transition-all duration-300 ${
 activeImageIndex === dotIndex ? "w-4 bg-blue-500" : "w-1.5 bg-black/20"
 }`}
 />
 ))}
 </div>
 </div>

 <div className="hidden w-full rounded-[20px] border border-theme bg-white px-3 py-2.5 sm:block sm:rounded-[24px] sm:px-4 sm:py-3">
 <div className="flex items-center gap-3 overflow-x-auto">
 {(mediaImages.length > 0
 ? mediaImages.slice(0, 8)
 : Array.from({ length: 4 })
 ).map((image, index) => (
 <button
 key={typeof image === "string" ? `${image}-${index}` : index}
 type="button"
 onClick={() =>
 typeof image === "string" && setActiveImageIndex(index)
 }
 className={`flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[16px] border bg-white p-1.5 transition-all ${
 activeImageIndex === index && typeof image === "string"
 ? "border-blue-500 ring-2 ring-blue-500/20"
 : "border-theme hover:border-blue-500/50"
 }`}
 aria-label={`Показать фото ${index + 1}`}
 >
 {typeof image === "string" ? (
 <Image
 quality={75}
 src={image}
 alt={`${product.name} фото ${index + 1}`}
 draggable={false}
 className="pointer-events-none h-full w-full select-none object-contain p-1"
 />
 ) : (
 "Фото"
 )}
 </button>
 ))}
 </div>
 </div>
 </div>

 <div className="lg:sticky lg:top-6">
 <div className="card rounded-[22px] p-3 sm:rounded-[36px] sm:p-8">
 <div className="text-[11px] sm:text-sm text-muted">{product.brand}</div>

 <h1 className="mt-1 text-[15px] font-bold leading-tight tracking-[-0.03em] sm:mt-2 sm:text-5xl">
 {product.name}
 </h1>

 <p className="mt-2 hidden max-w-[620px] text-sm leading-relaxed text-muted sm:mt-4 sm:block">
 {product.shortDescription}
 </p>

 <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted sm:mt-3 sm:text-sm">
 <span>
 {activePosition ? `SKU: ${activePosition.sku}` : `Модель: ${product.slug}`}
 </span>
 {activePosition ? (
 <>
 <span className="text-muted-soft">·</span>
 <button
 type="button"
 onClick={() => void copyConfigurationLink()}
 className="font-medium text-blue-500 transition-colors hover:text-blue-400"
 >
 Скопировать ссылку
 </button>
 </>
 ) : null}
 </div>

 <div className="mt-4 sm:mt-5">
 <button
 type="button"
 onClick={toggleFavorite}
 className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors sm:px-5 sm:py-3 sm:text-sm ${
 isFavorite
 ? "border-blue-500 bg-blue-500/10 text-blue-500 hover:bg-blue-500/15"
 : "border-theme bg-transparent text-muted hover:border-blue-500/40 hover:bg-blue-soft hover:text-main"
 }`}
 >
 {isFavorite ? "В избранном ✓" : "В избранное"}
 </button>
 </div>

 <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm">
 {!communityLoading && (community?.summary.reviewsCount ?? 0) > 0 ? (
 <>
 <button
 type="button"
 onClick={scrollToCommunity}
 className="font-medium text-main transition-colors hover:text-blue-500"
 >
 <span className="text-amber-500">★</span>{" "}
 {community?.summary.rating.toFixed(1)}
 </button>

 <span className="text-muted-soft">·</span>
 </>
 ) : null}

 <button
 type="button"
 onClick={scrollToCommunity}
 className="font-semibold text-main transition-colors hover:text-blue-500"
 >
 <span className="text-amber-500">★</span>{" "}
 {community?.summary.reviewsCount ?? 0} отзывов
 </button>

 <span className="text-muted-soft">·</span>

 <button
 type="button"
 onClick={() => setShowQuestionForm((value) => !value)}
 className="font-semibold text-main transition-colors hover:text-blue-500"
 >
 <span className="font-bold text-blue-500">?</span>{" "}
 {community?.summary.questionsCount ?? 0} вопросов
 </button>
 </div>

 {showQuestionForm ? (
 <div className="mt-4 rounded-2xl border border-theme bg-page p-4">
 <div className="text-sm font-bold">Задать вопрос о товаре</div>

 {!community?.authenticated ? (
 <div className="mt-3 grid gap-2 sm:grid-cols-2">
 <input
 value={questionName}
 onChange={(event) => setQuestionName(event.target.value)}
 placeholder="Ваше имя"
 className="rounded-xl border border-theme bg-card px-3 py-2.5 text-sm outline-none focus:border-blue-500"
 />
 <input
 value={questionEmail}
 onChange={(event) => setQuestionEmail(event.target.value)}
 placeholder="Email — необязательно"
 className="rounded-xl border border-theme bg-card px-3 py-2.5 text-sm outline-none focus:border-blue-500"
 />
 </div>
 ) : null}

 <textarea
 value={questionText}
 onChange={(event) => setQuestionText(event.target.value)}
 placeholder="Напишите вопрос"
 rows={3}
 className="mt-3 w-full resize-none rounded-xl border border-theme bg-card px-3 py-2.5 text-sm outline-none focus:border-blue-500"
 />

 <div className="mt-3 flex justify-end">
 <button
 type="button"
 onClick={() => void submitQuestion()}
 disabled={communitySubmitting}
 className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
 >
 {communitySubmitting ? "Отправляем…" : "Отправить вопрос"}
 </button>
 </div>
 </div>
 ) : null}

 {communityMessage ? (
 <div className="mt-3 text-sm text-blue-500">{communityMessage}</div>
 ) : null}

 {!activePosition && (
 <div className="mt-3 hidden rounded-[18px] border border-blue-500/30 bg-blue-soft p-3 sm:mt-7 sm:block sm:rounded-3xl sm:p-5">
 <div className="text-sm text-blue-500">
 Соберите конфигурацию
 </div>

 <h2 className="mt-1.5 text-[14px] font-bold sm:text-xl sm:mt-2">
 Выберите цвет, память и SIM
 </h2>

 <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted sm:gap-3 sm:text-sm">
 <div>
 <div className="text-muted-soft">Цвет</div>
 <div className="mt-1 font-semibold text-main">
 {selectedColor || "Не выбран"}
 </div>
 </div>

 <div>
 <div className="text-muted-soft">Память</div>
 <div className="mt-1 font-semibold text-main">
 {selectedMemory || "Не выбрана"}
 </div>
 </div>

 <div>
 <div className="text-muted-soft">SIM</div>
 <div className="mt-1 font-semibold text-main">
 {selectedSim || "Не выбрана"}
 </div>
 </div>
 </div>

 <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4">
 После выбора всех параметров появится конкретная позиция,
 SKU, наличие и итоговая цена.
 </p>
 </div>
 )}

 {activePosition && (
 <div className="mt-5 hidden rounded-[22px] border border-blue-500/30 bg-blue-soft p-4 sm:mt-7 sm:block sm:rounded-3xl sm:p-5">
 <div className="text-sm text-blue-500">
 Выбранная конфигурация
 </div>

 <h2 className="mt-2 text-lg font-bold sm:text-xl">
 {activePosition.title}
 </h2>

 <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-4">
 <div>
 <div className="text-muted-soft">Память</div>
 <div className="mt-1 font-semibold text-main">
 {activePosition.memory}
 </div>
 </div>

 <div>
 <div className="text-muted-soft">Цвет</div>
 <div className="mt-1 font-semibold text-main">
 {activePosition.color}
 </div>
 </div>

 <div>
 <div className="text-muted-soft">SIM</div>
 <div className="mt-1 font-semibold text-main">
 {activePosition.sim}
 </div>
 </div>

 <div>
 <div className="text-muted-soft">SKU</div>
 <div className="mt-1 break-all font-semibold text-main">
 {activePosition.sku}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Mobile: compact horizontal chips when config complete */}
 {activePosition && !showConfigEditor && (
 <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:hidden">
 <button
 type="button"
 onClick={() => setShowConfigEditor(true)}
 className="flex items-center gap-1 rounded-lg border border-blue-500 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-500"
 >
 <span
 className="h-3 w-3 rounded-full border border-blue-500/20"
 style={{ backgroundColor: colorOptions.find((c) => c.color === selectedColor)?.colorHex }}
 />
 {selectedColor}
 </button>
 <button
 type="button"
 onClick={() => setShowConfigEditor(true)}
 className="rounded-lg border border-blue-500 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-500"
 >
 {selectedMemory}
 </button>
 <button
 type="button"
 onClick={() => setShowConfigEditor(true)}
 className="rounded-lg border border-blue-500 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-500"
 >
 {selectedSim}
 </button>
 <button
 type="button"
 onClick={() => setShowConfigEditor(true)}
 className="rounded-lg border border-blue-500/30 bg-transparent px-2 py-1 text-[11px] text-muted"
 >
 Изменить
 </button>
 </div>
 )}

 {/* Full vertical selectors — always desktop, mobile only when not complete or editing */}
 <div className={activePosition && !showConfigEditor ? "hidden sm:block" : ""}>

 <div className="mt-2 sm:mt-8">
 <div className="text-[11px] font-semibold text-muted sm:text-sm sm:text-main">Цвет</div>

 <div className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-3">
 {colorOptions.map((position) => {
 const isActive = selectedColor === position.color;
 const isDisabled =
 !isActive &&
 !canSelectConfiguration({ color: position.color });

 return (
 <button
 key={position.color}
 type="button"
 disabled={isDisabled}
 onClick={() => selectColor(position.color)}
 className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-all duration-300 sm:gap-3 sm:px-4 sm:py-3 sm:text-sm ${
 isActive
 ? "border-blue-500 bg-blue-500/10 text-blue-500"
 : isDisabled
 ? "cursor-not-allowed border-theme bg-transparent text-muted-soft opacity-40"
 : "border-theme bg-transparent text-muted hover:border-blue-500/40 hover:bg-blue-soft hover:text-main"
 }`}
 >
 <span
 className="h-3 w-3 rounded-full border border-theme sm:h-5 sm:w-5"
 style={{ backgroundColor: position.colorHex }}
 />

 {position.color}
 </button>
 );
 })}
 </div>
 </div>

 <div className="mt-2 sm:mt-7">
 <div className="text-[11px] font-semibold text-muted sm:text-sm sm:text-main">Память</div>

 <div className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-3">
 {memoryOptions.map((position) => {
 const isActive = selectedMemory === position.memory;
 const isDisabled =
 !isActive &&
 !canSelectConfiguration({ memory: position.memory });

 return (
 <button
 key={position.memory}
 type="button"
 disabled={isDisabled}
 onClick={() => selectMemory(position.memory)}
 className={`rounded-lg border px-2 py-1 text-[11px] transition-all duration-300 sm:px-5 sm:py-3 sm:text-sm ${
 isActive
 ? "border-blue-500 bg-blue-500/10 text-blue-500"
 : isDisabled
 ? "cursor-not-allowed border-theme bg-transparent text-muted-soft opacity-40"
 : "border-theme bg-transparent text-muted hover:border-blue-500/40 hover:bg-blue-soft hover:text-main"
 }`}
 >
 {position.memory}
 </button>
 );
 })}
 </div>
 </div>

 <div className="mt-2 sm:mt-7">
 <div className="text-[11px] font-semibold text-muted sm:text-sm sm:text-main">SIM</div>

 <div className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-3">
 {simOptions.map((position) => {
 const isActive = selectedSim === position.sim;
 const isDisabled =
 !isActive &&
 !canSelectConfiguration({ sim: position.sim });

 return (
 <button
 key={position.sim}
 type="button"
 disabled={isDisabled}
 onClick={() => selectSim(position.sim)}
 className={`rounded-lg border px-2 py-1 text-[11px] transition-all duration-300 sm:px-5 sm:py-3 sm:text-sm ${
 isActive
 ? "border-blue-500 bg-blue-500/10 text-blue-500"
 : isDisabled
 ? "cursor-not-allowed border-theme bg-transparent text-muted-soft opacity-40"
 : "border-theme bg-transparent text-muted hover:border-blue-500/40 hover:bg-blue-soft hover:text-main"
 }`}
 >
 {position.sim}
 </button>
 );
 })}
 </div>
 </div>

 </div>{/* end config editor wrapper */}

 {!activePosition && (
 <div className="mt-5 border-t border-theme pt-5 sm:mt-8 sm:pt-7">
 <div className="text-sm text-muted">Цена</div>

 <div className="mt-1 text-[28px] font-bold tracking-[-0.045em] sm:text-4xl">
 {priceRange}
 </div>

 <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4">
 {hasInvalidCompleteConfiguration
 ? "Такой конфигурации нет. Выберите другую комбинацию параметров."
 : "Итоговая цена и наличие появятся после выбора цвета, памяти и SIM."}
 </p>

 <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2">
 <button
 type="button"
 disabled
 className="flex cursor-not-allowed justify-center rounded-xl bg-blue-600/50 px-5 py-3 text-sm font-medium text-white sm:px-7 sm:py-4"
 >
 Купить сейчас
 </button>

 <button
 type="button"
 disabled
 className="flex cursor-not-allowed justify-center rounded-xl border border-theme px-5 py-3 text-sm font-medium text-muted-soft sm:px-7 sm:py-4"
 >
 В корзину
 </button>
 </div>

 <Link
 href="/help"
 className="mt-3 flex justify-center rounded-xl border border-theme bg-transparent px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft sm:px-7 sm:py-4"
 >
 Задать вопрос
 </Link>
 </div>
 )}

 {activePosition && (
 <div className="mt-5 border-t border-theme pt-5 sm:mt-8 sm:pt-7">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
 <div>
 {crossedTotalPrice > 0 && (
 <div className="text-sm text-muted line-through">
 {formatPrice(crossedTotalPrice)}
 </div>
 )}

 <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
 {quantityPriceLabel}
 </div>

 <div className="mt-1 text-[28px] font-bold tracking-[-0.045em] sm:text-4xl">
 {finalTotalPrice > 0 ? formatPrice(finalTotalPrice) : activePosition.price}
 </div>

 {quantity > 1 && finalUnitPrice > 0 ? (
 <div className="mt-1 text-xs font-medium text-muted sm:text-sm">
 {formatPrice(finalUnitPrice)} за 1 шт.
 </div>
 ) : null}

 {positionDiscountQuote?.statusDiscount ? (
 <div className="mt-1 text-xs font-medium text-green-500 sm:text-sm">
 Ваша цена · {positionDiscountQuote.statusLabel} · скидка {formatPrice(positionDiscountQuote.statusDiscount)}
 </div>
 ) : null}
 </div>

 {activePosition.stock > 0 ? (
 <div className="w-fit rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-500">
 {getStatusName(activePosition.status)} ·{" "}
 {activePosition.stock} шт.
 </div>
 ) : (
 <div className="w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-500">
 {getStatusName(activePosition.status)}
 </div>
 )}
 </div>

 <div className="mt-4 sm:mt-7">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <div className="text-sm font-semibold">Количество</div>

 <div className="mt-3 flex h-12 w-fit items-center overflow-hidden rounded-xl border border-theme">
 <button
 type="button"
 onClick={decreaseQuantity}
 className="flex h-full w-10 items-center justify-center text-lg transition-colors hover:bg-blue-soft sm:w-12"
 >
 −
 </button>

 <div className="flex h-full w-12 items-center justify-center border-x border-theme text-sm font-bold sm:w-14">
 {quantity}
 </div>

 <button
 type="button"
 onClick={increaseQuantity}
 disabled={activePosition.stock <= 0}
 className="flex h-full w-10 items-center justify-center text-lg transition-colors hover:bg-blue-soft disabled:cursor-not-allowed disabled:opacity-40 sm:w-12"
 >
 +
 </button>
 </div>
 </div>

 {activePosition.stock > 0 ? (
 <div className="text-sm text-muted">
 Цена пересчитывается по количеству · максимум {activePosition.stock} шт.
 </div>
 ) : (
 <div className="text-sm text-orange-500">
 Нет в наличии
 </div>
 )}
 </div>

 <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2">
 {activePosition.stock > 0 ? (
 <Link
 href="/cart"
 onClick={saveSelectedPositionToCart}
 className="flex justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 sm:px-7 sm:py-4"
 >
 Купить сейчас
 </Link>
 ) : (
 <button
 type="button"
 disabled
 className="flex cursor-not-allowed justify-center rounded-xl bg-blue-600/50 px-5 py-3 text-sm font-medium text-white sm:px-7 sm:py-4"
 >
 Купить сейчас
 </button>
 )}

 <button
 type="button"
 onClick={handleAddToCart}
 disabled={activePosition.stock <= 0}
 className={`flex justify-center rounded-xl border px-5 py-3 text-sm font-medium transition-colors sm:px-7 sm:py-4 ${
 activePosition.stock > 0
 ? "border-theme bg-transparent hover:border-blue-500/40 hover:bg-blue-soft"
 : "cursor-not-allowed border-theme bg-transparent text-muted-soft"
 }`}
 >
 {addedToCart ? "Добавлено ✓" : "В корзину"}
 </button>
 </div>

 <Link
 href="/help"
 className="mt-3 flex justify-center rounded-xl border border-theme bg-transparent px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft sm:px-7 sm:py-4"
 >
 Задать вопрос
 </Link>
 </div>

 <p className="mt-4 text-xs leading-relaxed text-muted">
 Цена и наличие могут измениться. Менеджер подтвердит
 конфигурацию, доставку и итоговую стоимость после
 оформления.
 </p>
 </div>
 )}
 </div>
 </div>
 </section>

 {hasProductStory(product) ? <ProductStory product={product} /> : null}

 {relatedProducts.length > 0 ? (
 <section className="mt-6 sm:mt-10">
 <ProductStrip title="С этим товаром покупают" products={relatedProducts} />
 </section>
 ) : null}

 <section className="mt-6 sm:mt-10">
 <ProductTabs
 productName={product.name}
 brand={product.brand}
 category={categoryName}
 memory={detailsPosition?.memory || "Не выбрано"}
 color={detailsPosition?.color || "Не выбрано"}
 sim={detailsPosition?.sim || "Не выбрано"}
 sku={detailsPosition?.sku || "Будет выбран после конфигурации"}
 description={product.description}
 shortDescription={product.shortDescription}
 benefits={benefits}
 />
 </section>

 <section
 id="product-community"
 className="mt-6 scroll-mt-24 rounded-[24px] border border-theme bg-white sm:mt-10 sm:rounded-[36px]"
 >
 <div className="border-b border-theme p-4 sm:p-7">
 <div className="flex flex-wrap items-center justify-between gap-4">
 <div>
 <h2 className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
 Отзывы и вопросы о товаре
 </h2>
 <p className="mt-1 text-sm text-muted">
 Отзывы оставляют только покупатели. Вопрос можно задать сразу.
 </p>
 </div>

 <div className="flex flex-wrap gap-2">
 {communityTab === "reviews" ? (
 community?.canReview ? (
 <button
 type="button"
 onClick={() => setShowReviewForm((value) => !value)}
 className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
 >
 Оставить отзыв
 </button>
 ) : community?.hasReview ? (
 <span className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm text-green-600">
 Отзыв уже оставлен
 </span>
 ) : community?.authenticated ? (
 <span className="rounded-xl border border-theme px-4 py-2.5 text-sm text-muted">
 Доступно после покупки
 </span>
 ) : (
 <button
 type="button"
 onClick={() =>
 window.dispatchEvent(
 new CustomEvent("netizen-open-auth", { detail: "login" }),
 )
 }
 className="rounded-xl border border-theme px-4 py-2.5 text-sm font-medium hover:border-blue-500/40 hover:bg-blue-soft"
 >
 Войти для отзыва
 </button>
 )
 ) : (
 <button
 type="button"
 onClick={() => {
 setShowQuestionForm(true);
 window.scrollTo({ top: 0, behavior: "smooth" });
 }}
 className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
 >
 Задать вопрос
 </button>
 )}
 </div>
 </div>

 <div className="mt-5 flex gap-2 overflow-x-auto">
 {product.characteristics ? (
 <button
 type="button"
 onClick={() => setShowCharacteristics(!showCharacteristics)}
 className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
 showCharacteristics
 ? "bg-blue-600 text-white"
 : "border border-theme bg-transparent text-muted hover:border-blue-500/40 hover:bg-blue-soft hover:text-main"
 }`}
 >
 Характеристики
 </button>
 ) : null}

 <button
 type="button"
 onClick={() => setCommunityTab("reviews")}
 className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
 communityTab === "reviews"
 ? "bg-blue-600 text-white"
 : "border border-theme bg-transparent text-muted hover:border-blue-500/40 hover:bg-blue-soft hover:text-main"
 }`}
 >
 Отзывы · {community?.summary.reviewsCount ?? 0}
 </button>

 <button
 type="button"
 onClick={() => setCommunityTab("questions")}
 className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
 communityTab === "questions"
 ? "bg-blue-600 text-white"
 : "border border-theme bg-transparent text-muted hover:border-blue-500/40 hover:bg-blue-soft hover:text-main"
 }`}
 >
 Вопросы о товаре · {community?.summary.questionsCount ?? 0}
 </button>
 </div>
 </div>

 <div className="p-4 sm:p-7">
 {showCharacteristics && product.characteristics ? (
 <div className="mb-8">
 <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
 {product.characteristics.split('\n').filter(line => line.trim()).map((char, index) => (
 <div key={index} className="rounded-xl border border-theme bg-card p-3 sm:p-4">
 <p className="text-xs sm:text-sm leading-relaxed text-main break-words">{char.trim()}</p>
 </div>
 ))}
 </div>
 </div>
 ) : null}

 {communityTab === "reviews" ? (
 <>
 {showReviewForm ? (
 <div className="mb-5 rounded-2xl border border-theme bg-page p-4">
 <div className="text-sm font-bold">Ваш отзыв</div>

 <div className="mt-3 flex gap-1">
 {[1, 2, 3, 4, 5].map((rating) => (
 <button
 key={rating}
 type="button"
 onClick={() => setReviewRating(rating)}
 className={`text-2xl ${
 rating <= reviewRating ? "text-amber-500" : "text-muted-soft"
 }`}
 aria-label={`${rating} из 5`}
 >
 ★
 </button>
 ))}
 </div>

 <textarea
 value={reviewText}
 onChange={(event) => setReviewText(event.target.value)}
 placeholder="Расскажите о товаре"
 rows={4}
 className="mt-3 w-full resize-none rounded-xl border border-theme bg-card px-3 py-2.5 text-sm outline-none focus:border-blue-500"
 />

 <div className="mt-3">
 <label className="inline-flex cursor-pointer items-center rounded-xl border border-theme bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft">
 Добавить фотографии
 <input
 type="file"
 accept="image/*"
 multiple
 className="hidden"
 onChange={(event) => {
 void handleReviewImages(event.target.files);
 event.currentTarget.value = "";
 }}
 />
 </label>
 <span className="ml-3 text-xs text-muted">
 До 4 фото, каждое до 2 МБ
 </span>

 {reviewImages.length > 0 ? (
 <div className="mt-3 flex flex-wrap gap-2">
 {reviewImages.map((image, index) => (
 <div
 key={`${image.slice(0, 32)}-${index}`}
 className="relative h-20 w-20 overflow-hidden rounded-xl border border-theme bg-white"
 >
 <img
 src={image}
 alt={`Фото отзыва ${index + 1}`}
 className="h-full w-full object-cover"
 />
 <button
 type="button"
 onClick={() =>
 setReviewImages((current) =>
 current.filter((_, itemIndex) => itemIndex !== index),
 )
 }
 className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-sm text-white"
 aria-label="Удалить фотографию"
 >
 ×
 </button>
 </div>
 ))}
 </div>
 ) : null}
 </div>

 <div className="mt-3 flex justify-end">
 <button
 type="button"
 onClick={() => void submitReview()}
 disabled={communitySubmitting}
 className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
 >
 {communitySubmitting ? "Публикуем…" : "Опубликовать отзыв"}
 </button>
 </div>
 </div>
 ) : null}

 {community?.summary.reviewsCount ? (
 <div className="mb-5 grid gap-5 rounded-2xl border border-theme bg-page p-4 sm:grid-cols-[180px_1fr]">
 <div>
 <div className="text-4xl font-bold">
 {community.summary.rating.toFixed(1)}
 </div>
 <div className="mt-1 text-lg text-amber-500">★★★★★</div>
 <div className="mt-1 text-sm text-muted">
 {community.summary.reviewsCount} отзывов
 </div>
 </div>

 <div className="grid gap-2">
 {community.summary.distribution.map((item) => {
 const percent =
 community.summary.reviewsCount > 0
 ? Math.round(
 (item.count / community.summary.reviewsCount) * 100,
 )
 : 0;

 return (
 <div
 key={item.rating}
 className="grid grid-cols-[34px_1fr_34px] items-center gap-2 text-xs"
 >
 <span>{item.rating} ★</span>
 <div className="h-2 overflow-hidden rounded-full bg-black/10">
 <div
 className="h-full rounded-full bg-amber-500"
 style={{ width: `${percent}%` }}
 />
 </div>
 <span className="text-right text-muted">{item.count}</span>
 </div>
 );
 })}
 </div>
 </div>
 ) : null}

 <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
 <div className="font-semibold">Отзывы покупателей</div>
 <select
 value={reviewSort}
 onChange={(event) =>
 setReviewSort(
 event.target.value as
 | "newest"
 | "oldest"
 | "highest"
 | "lowest"
 | "helpful",
 )
 }
 className="rounded-xl border border-theme bg-card px-3 py-2 text-sm outline-none"
 >
 <option value="newest">Сначала новые</option>
 <option value="oldest">Сначала старые</option>
 <option value="highest">С высокой оценкой</option>
 <option value="lowest">С низкой оценкой</option>
 <option value="helpful">Самые полезные</option>
 </select>
 </div>

 <div className="space-y-3">
 {sortedReviews.length ? (
 sortedReviews.map((review) => (
 <article
 key={review.id}
 className="rounded-2xl border border-theme bg-page p-4"
 >
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <div className="font-semibold">{review.author}</div>
 <div className="mt-1 text-xs text-muted">
 {formatReviewDate(review.createdAt)}
 </div>
 </div>
 <div className="text-sm text-amber-500">
 {"★".repeat(review.rating)}
 <span className="text-muted-soft">
 {"★".repeat(5 - review.rating)}
 </span>
 </div>
 </div>

 {review.verifiedPurchase ? (
 <div className="mt-1 text-xs text-green-600">
 Подтверждённая покупка
 </div>
 ) : null}

 <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
 {review.text}
 </p>

 {review.images.length > 0 ? (
 <div className="mt-4 flex flex-wrap gap-2">
 {review.images.map((image, index) => (
 <a
 key={`${review.id}-${index}`}
 href={image}
 target="_blank"
 rel="noreferrer"
 className="block h-24 w-24 overflow-hidden rounded-xl border border-theme bg-white"
 >
 <img
 src={image}
 alt={`Фото покупателя ${index + 1}`}
 loading="lazy"
 className="h-full w-full object-cover"
 />
 </a>
 ))}
 </div>
 ) : null}

 <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-theme pt-3">
 <span className="mr-1 text-xs text-muted">
 Отзыв полезен?
 </span>
 <button
 type="button"
 onClick={() => void voteReview(review.id, "helpful")}
 className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
 review.userVote === 1
 ? "border-green-500/40 bg-green-500/10 text-green-600"
 : "border-theme hover:border-green-500/40"
 }`}
 >
 Да · {review.helpfulCount}
 </button>
 <button
 type="button"
 onClick={() => void voteReview(review.id, "unhelpful")}
 className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
 review.userVote === -1
 ? "border-red-500/40 bg-red-500/10 text-red-600"
 : "border-theme hover:border-red-500/40"
 }`}
 >
 Нет · {review.unhelpfulCount}
 </button>
 </div>
 </article>
 ))
 ) : (
 <div className="rounded-2xl border border-dashed border-theme p-6 text-sm text-muted">
 Отзывов пока нет. Первый отзыв сможет оставить покупатель после завершённого заказа.
 </div>
 )}
 </div>
 </>
 ) : (
 <div className="space-y-3">
 {community?.questions.length ? (
 community.questions.map((question) => (
 <article
 key={question.id}
 className="rounded-2xl border border-theme bg-page p-4"
 >
 <div className="font-semibold">{question.authorName}</div>

 <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
 {question.text}
 </p>

 {question.answer ? (
 <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-soft p-3">
 <div className="text-xs font-semibold text-blue-500">
 Ответ магазина
 </div>
 <p className="mt-1 text-sm leading-relaxed">
 {question.answer}
 </p>
 </div>
 ) : (
 <div className="mt-3 text-xs text-muted-soft">
 Магазин ещё не ответил.
 </div>
 )}
 </article>
 ))
 ) : (
 <div className="rounded-2xl border border-dashed border-theme p-6 text-sm text-muted">
 Вопросов пока нет. Задайте первый вопрос о товаре прямо из карточки.
 </div>
 )}
 </div>
 )}

 {communityMessage ? (
 <div className="mt-4 text-sm text-blue-500">{communityMessage}</div>
 ) : null}
 </div>
 </section>

 {similarProducts.length > 0 ? (
 <section className="mb-8 mt-6 sm:mb-10 sm:mt-10">
 <ProductStrip title="Похожие товары" products={similarProducts} />
 </section>
 ) : null}
 </div>
 </main>
 );
}

function ProductStory({ product }: { product: ProductCard }) {
 const blocks = getProductStoryBlocks(product);

 if (blocks.length === 0 && product.description.trim()) {
 return (
 <section className="mt-6 rounded-[24px] border border-theme bg-card p-4 text-main sm:mt-10 sm:rounded-[38px] sm:p-8 lg:p-12">
 <div className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">
 Описание
 </div>
 <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em] sm:mt-3 sm:text-4xl lg:text-5xl">
 {product.name}
 </h2>
 <p className="mt-3 max-w-[860px] whitespace-pre-line text-sm leading-relaxed text-muted sm:mt-5 sm:text-base lg:text-lg">
 {product.description}
 </p>
 </section>
 );
 }

 return (
 <section className="mt-6 space-y-4 sm:mt-10 sm:space-y-5">
 {blocks.map((block, index) => {
 const hasImage = Boolean(block.image);
 const imageFirst = block.imageSide === "left";
 const isDark = block.tone === "dark";

 return (
 <article
 key={block.id || `${block.title}-${index}`}
 className={`overflow-hidden rounded-[24px] border sm:rounded-[38px] ${
 isDark
 ? "border-white/10 bg-[#050914] text-white"
 : "border-theme bg-card text-main"
 }`}
 >
 <div className="grid min-h-[260px] lg:min-h-[360px] lg:grid-cols-2">
 <div
 className={`flex flex-col justify-center p-4 sm:p-8 lg:p-12 ${imageFirst ? "lg:order-2" : ""}`}
 >
 {block.eyebrow ? (
 <div className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
 {block.eyebrow}
 </div>
 ) : null}

 {block.title ? (
 <h2 className="mt-3 text-2xl font-bold tracking-[-0.055em] sm:mt-4 sm:text-4xl lg:text-6xl">
 {block.title}
 </h2>
 ) : null}

 {block.text ? (
 <p
 className={`mt-3 whitespace-pre-line text-sm leading-relaxed sm:mt-5 sm:text-base lg:text-lg ${isDark ? "text-white/65" : "text-muted"}`}
 >
 {block.text}
 </p>
 ) : null}
 </div>

 <div
 className={`flex min-h-[220px] items-center justify-center sm:min-h-[320px] ${imageFirst ? "lg:order-1" : ""} ${isDark ? "bg-white/[0.03]" : "bg-blue-soft"}`}
 >
 {hasImage ? (
 // eslint-disable-next-line @next/next/no-img-element
 <Image quality={75} src={block.image}
 alt={block.imageAlt || block.title || product.name}
 className="h-full max-h-[520px] w-full object-contain p-6 lg:p-10"
 />
 ) : (
 <div className="text-sm text-muted-soft">Фото блока</div>
 )}
 </div>
 </div>
 </article>
 );
 })}
 </section>
 );
}

function ProductStrip({
 title,
 products,
}: {
 title: string;
 products?: ProductCard[];
}) {
 const items = Array.isArray(products) ? products : [];

 if (items.length === 0) {
 return null;
 }

 return (
 <section>
 <h2 className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{title}</h2>

 <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-5 md:grid-cols-3 xl:grid-cols-5">
 {items.map((item) => (
 <Link
 key={item.slug}
 href={`/product/${item.slug}`}
 className="card group rounded-[20px] p-3 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/35 hover:bg-blue-soft sm:rounded-3xl sm:p-4"
 >
 <div className="soft-box flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl text-sm text-muted-soft">
 {item.image ? (
 <Image
 quality={75}
 src={item.image}
 alt={item.name}
 className="h-full w-full object-contain p-3"
 />
 ) : (
 "Фото"
 )}
 </div>

 <div className="pt-4">
 <div className="text-sm text-muted-soft">{item.brand}</div>

 <h3 className="mt-1 line-clamp-2 font-bold leading-tight">
 {item.name}
 </h3>

 <p className="mt-1 text-sm text-muted">{item.price}</p>

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
