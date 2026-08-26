"use client";

import Link from "next/link";
import Image from 'next/image';
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { useTheme } from "@/components/theme-provider";
import { ArrowIcon } from "@/components/arrow-icon";

type NewProduct = {
 slug: string;
 name: string;
 brand?: string;
 price: string;
 shortDescription?: string;
 image?: string;
 promoImage?: string;
 images?: string[];
 colors?: string[];
 isNew?: boolean;
 isPopular?: boolean;
};

type NewPageBlock = {
 id: string;
 type: string;
 title: string;
 enabled: boolean;
 sortOrder: number;
 settings?: Record<string, string | number | boolean | null>;
};

type NewArrivalsPayload = {
 products?: NewProduct[];
 newArrivals?: NewProduct[];
 pageBlocks?: NewPageBlock[];
};

const defaultBlocks: NewPageBlock[] = [
 {
 id: "new-promo",
 type: "promo-banner",
 title: "Баннер новинок",
 enabled: true,
 sortOrder: 10,
 settings: {
 title: "Новые поступления",
 subtitle: "Самые свежие модели и конфигурации",
 buttonText: "В каталог",
 buttonHref: "/catalog?new=1",
 },
 },
 {
 id: "new-arrivals",
 type: "new-arrivals",
 title: "Новинки",
 enabled: true,
 sortOrder: 20,
 settings: { title: "Новинки", subtitle: "Техника, которая только появилась", limit: 6 },
 },
];

export default function NewPage() {
 const { dark } = useTheme();
 const [products, setProducts] = useState<NewProduct[]>([]);
 const [newArrivals, setNewArrivals] = useState<NewProduct[]>([]);
 const [blocks, setBlocks] = useState<NewPageBlock[]>([]);

 useEffect(() => {
 let mounted = true;

 fetch("/api/new-arrivals")
 .then((response) => (response.ok ? response.json() : Promise.reject()))
 .then((payload: NewArrivalsPayload) => {
 if (!mounted) return;

 setProducts(Array.isArray(payload.products) ? payload.products : []);
 setNewArrivals(Array.isArray(payload.newArrivals) ? payload.newArrivals : []);
 setBlocks(Array.isArray(payload.pageBlocks) ? payload.pageBlocks : []);
 })
 .catch(() => {
 if (!mounted) return;

 setProducts([]);
 setNewArrivals([]);
 setBlocks([]);
 });

 return () => {
 mounted = false;
 };
 }, []);

 const visibleBlocks = (blocks.length ? blocks : defaultBlocks)
 .filter((block) => block.enabled)
 .sort((a, b) => a.sortOrder - b.sortOrder);

 return (
 <main className={dark ? "min-h-screen bg-[#020814] text-white" : "min-h-screen bg-[#f6f8fb] text-[#0b1220]"}>
 <div className="mx-auto max-w-[1440px] px-3 py-3 sm:px-5 sm:py-5 lg:px-6">
 <SiteHeader />

 <section className="mt-3 sm:mt-6">
 <nav
 aria-label="Хлебные крошки"
 className="hidden flex-wrap items-center gap-2 text-xs text-muted sm:flex sm:text-sm"
 >
 <Link href="/" className="transition-colors hover:text-blue-500">
 Главная
 </Link>
 <span className="text-muted-soft inline-flex"><ArrowIcon width={12} height={12} direction="right" /></span>
 <span className="font-medium text-main">Новинки</span>
 </nav>
 </section>

 {visibleBlocks.map((block) => (
 <NewPageModule
 key={block.id}
 block={block}
 dark={dark}
 products={products}
 newArrivals={newArrivals}
 />
 ))}
 </div>
 </main>
 );
}

function NewPageModule({
 block,
 dark,
 products,
 newArrivals,
}: {
 block: NewPageBlock;
 dark: boolean;
 products: NewProduct[];
 newArrivals: NewProduct[];
}) {
 const settings = block.settings ?? {};

 if (block.type === "promo-banner") {
 return <PromoBlock dark={dark} settings={settings} />;
 }

 if (block.type === "new-arrivals" || block.type === "product-carousel") {
 const limit = getNumber(settings, "limit", block.type === "product-carousel" ? 12 : 6);
 const selected = pickProducts(products, newArrivals, getText(settings, "productSlugs", ""));

 return (
 <section className="py-8 sm:py-10">
 <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
 <div>
 <h1 className={`${sectionTitleClass(getText(settings, "sectionTitleSize", "large"))} font-bold leading-none tracking-[-0.04em]`}>
 {getText(settings, "title", block.type === "product-carousel" ? "Ещё новинки" : "Новинки")}
 </h1>
 <p className={`mt-3 text-base ${muted(dark)}`}>
 {getText(settings, "subtitle", "Техника, которая только появилась")}
 </p>
 </div>
 {getBoolean(settings, "showButton", false) ? (
 <Link href={getText(settings, "buttonHref", "/catalog?new=1")} className={`rounded-xl border px-6 py-3 text-sm font-medium ${dark ? "border-white/10 bg-white/[0.035]" : "border-black/10 bg-white "}`}>
 {getText(settings, "buttonText", "В каталог")}
 </Link>
 ) : null}
 </div>

 {selected.length > 0 ? (
 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
 {selected.slice(0, limit).map((product, index) => (
 <NewCard
 key={product.slug}
 product={product}
 dark={dark}
 badge={getText(settings, "badgeText", "Новинка")}
 titleOverride={getText(settings, index === 0 ? "featuredTitle" : index === 1 ? "secondTitle" : "thirdTitle", "")}
 descriptionOverride={getText(settings, index === 0 ? "featuredDescription" : index === 1 ? "secondDescription" : "thirdDescription", "")}
 />
 ))}
 </div>
 ) : (
 <div className={`rounded-3xl border p-8 ${dark ? "border-white/10 bg-white/[0.035] text-white" : "border-black/10 bg-white text-black"}`}>
 <h2 className="text-2xl font-bold tracking-[-0.04em]">Новинок пока нет</h2>
 <p className={`mt-2 text-sm ${muted(dark)}`}>
 Скоро здесь появятся новые устройства.
 </p>
 </div>
 )}
 </section>
 );
 }

 if (block.type === "support") {
 return (
 <section className={`mb-10 rounded-[28px] border p-6 sm:p-8 ${dark ? "border-white/10 bg-white/[0.035]" : "border-black/10 bg-white "}`}>
 <h2 className="text-3xl font-bold tracking-[-0.04em]">{getText(settings, "title", "Поможем выбрать новинку")}</h2>
 <p className={`mt-3 ${muted(dark)}`}>{getText(settings, "subtitle", "Расскажем отличия и подберём конфигурацию.")}</p>
 <Link href="/help" className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white">Написать в поддержку</Link>
 </section>
 );
 }

 return null;
}

function PromoBlock({ dark, settings }: { dark: boolean; settings: Record<string, string | number | boolean | null> }) {
 const image = getText(settings, "image", "");

 return (
 <section className="pt-5 pb-8 sm:pt-7 sm:pb-10">
 <div className={`grid min-h-[300px] overflow-hidden rounded-[34px] border lg:grid-cols-[0.9fr_1.1fr] ${dark ? "border-blue-500/20 bg-blue-600/10" : "border-blue-100 bg-white "}`}>
 <div className="flex flex-col justify-center p-8 lg:p-12">
 <div className="text-sm font-bold uppercase tracking-[0.18em] text-blue-500">Новинки</div>
 <h1 className="mt-4 text-4xl font-bold leading-none tracking-[-0.05em] lg:text-6xl">{getText(settings, "title", "Новые поступления")}</h1>
 <p className={`mt-5 max-w-[520px] text-base leading-relaxed ${muted(dark)}`}>{getText(settings, "subtitle", "Самые свежие модели и конфигурации")}</p>
 <Link href={getText(settings, "buttonHref", "/catalog?new=1")} className="mt-8 inline-flex w-fit rounded-xl bg-blue-600 px-7 py-4 text-sm font-medium text-white">
 {getText(settings, "buttonText", "В каталог")}
 </Link>
 </div>
 <div className={`min-h-[260px] ${dark ? "bg-blue-500/5" : "bg-slate-50"}`}>
 {image ? <Image quality={75} src={image} alt="Новинки" className="h-full w-full object-contain object-right" /> : null}
 </div>
 </div>
 </section>
 );
}

function NewCard({
 product,
 dark,
 badge,
 titleOverride,
 descriptionOverride,
}: {
 product: NewProduct;
 dark: boolean;
 badge: string;
 titleOverride: string;
 descriptionOverride: string;
}) {
 const image = product.promoImage || product.image || product.images?.[0] || "";
 const title = titleOverride || product.name;
 const description = descriptionOverride || product.shortDescription || "Откройте карточку, чтобы выбрать конфигурацию.";

 return (
 <Link href={`/product/${product.slug}`} className={`group overflow-hidden rounded-3xl border transition-all duration-500 hover:-translate-y-1 ${dark ? "border-white/10 bg-white/[0.035] hover:border-blue-500/35" : "border-black/10 bg-white hover:border-blue-500/35"}`}>
 <div className={`flex h-[230px] items-center justify-center ${image ? "bg-white" : dark ? "bg-white/[0.04]" : "bg-slate-100"}`}>
 {image ? <Image quality={75} src={image} alt={title} className="h-full w-full object-contain" /> : null}
 </div>
 <div className="p-6">
 <div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">{badge}</div>
 <h2 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.04em]">{title}</h2>
 <p className={`mt-3 text-sm leading-relaxed ${muted(dark)}`}>{description}</p>
 <div className="mt-5 flex items-center justify-between gap-4">
 <span className="text-sm font-semibold">{product.price}</span>
 <span className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white">Открыть</span>
 </div>
 </div>
 </Link>
 );
}

function pickProducts(allProducts: NewProduct[], fallbackProducts: NewProduct[], slugsText: string) {
 const slugs = slugsText.split(/[\n,;]+/).map((slug) => slug.trim()).filter(Boolean);

 if (slugs.length === 0) {
 return fallbackProducts.length ? fallbackProducts : allProducts;
 }

 const bySlug = new Map(allProducts.map((product) => [product.slug, product]));
 const selected = slugs.map((slug) => bySlug.get(slug)).filter((product): product is NewProduct => Boolean(product));

 return selected.length ? selected : fallbackProducts;
}

function getText(settings: Record<string, string | number | boolean | null>, key: string, fallback: string) {
 const value = settings[key];

 if (typeof value === "string") return value || fallback;
 if (typeof value === "number") return String(value);
 return fallback;
}

function getNumber(settings: Record<string, string | number | boolean | null>, key: string, fallback: number) {
 const value = settings[key];

 if (typeof value === "number" && Number.isFinite(value)) return value;
 if (typeof value === "string") {
 const parsed = Number(value);
 return Number.isFinite(parsed) ? parsed : fallback;
 }

 return fallback;
}

function getBoolean(settings: Record<string, string | number | boolean | null>, key: string, fallback: boolean) {
 const value = settings[key];
 return typeof value === "boolean" ? value : fallback;
}

function sectionTitleClass(size: string) {
 if (size === "small") return "text-3xl lg:text-4xl";
 if (size === "medium") return "text-[38px] lg:text-[46px]";
 return "text-[42px] lg:text-[52px]";
}

function muted(dark: boolean) {
 return dark ? "text-white/55" : "text-black/55";
}
