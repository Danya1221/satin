"use client";

import Image from "next/image";
import Link from "next/link";
import {
 useEffect,
 useRef,
 useState,
 type MouseEvent,
 type PointerEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SiteHeader } from "@/components/site-header";
import { useTheme } from "@/components/theme-provider";
import { footerData } from "@/data/footer";
import { ArrowIcon } from "@/components/arrow-icon";

type HomeCategory = {
 id: string;
 slug: string;
 name: string;
 description: string;
 href: string;
 image?: string;
};

type HomeProduct = {
 slug: string;
 name: string;
 brand?: string;
 category?: string;
 categoryName?: string;
 price: string;
 priceMax?: string;
 shortDescription?: string;
 image?: string;
 promoImage?: string;
 images?: string[];
 colors: string[];
 isNew?: boolean;
 isPopular?: boolean;
};

type HomePageBlock = {
 id: string;
 pageKey: string;
 type: string;
 title: string;
 description: string;
 enabled: boolean;
 sortOrder: number;
 settings?: Record<string, string | number | boolean | null>;
};

type HomeBanner = {
 id: string;
 adminTitle: string;
 label: string;
 title: string;
 subtitle: string;
 description: string;
 buttonText: string;
 buttonHref: string;
 secondaryButtonText?: string;
 secondaryButtonHref?: string;
 imageLight: string;
 imageDark: string;
 imageMobile: string;
 placement: string;
 tone: string;
 layout: string;
 titleSize?: string;
 textSize?: string;
 enabled: boolean;
 sortOrder: number;
};

type HomeBenefit = {
 id: string;
 title: string;
 description: string;
 icon: string;
 image: string;
 href: string;
 enabled: boolean;
 sortOrder: number;
};

type HomeBlockSetting = {
 id: string;
 enabled: boolean;
 order: number;
};

type PublicSiteSettings = {
 branding?: {
 storeName?: string;
 logoLight?: string;
 logoDark?: string;
 };
 contacts?: {
 phone?: string;
 phoneText?: string;
 email?: string;
 emailText?: string;
 telegram?: string;
 telegramText?: string;
 };
 homeBlocks?: HomeBlockSetting[];
};

type HomePayload = {
 categories?: HomeCategory[];
 products?: HomeProduct[];
 popularProducts?: HomeProduct[];
 newArrivals?: HomeProduct[];
 pageBlocks?: HomePageBlock[];
 siteSettings?: PublicSiteSettings;
 banners?: HomeBanner[];
 benefits?: HomeBenefit[];
};

const defaultHomePageBlocks: HomePageBlock[] = [
 { id: "hero", pageKey: "home", type: "hero", title: "Hero", description: "", enabled: true, sortOrder: 10, settings: {} },
 { id: "benefits", pageKey: "home", type: "benefits", title: "Преимущества", description: "", enabled: true, sortOrder: 20, settings: {} },
 { id: "categories", pageKey: "home", type: "category-grid", title: "Категории", description: "", enabled: true, sortOrder: 30, settings: { title: "Выберите категорию", subtitle: "Выберите направление и найдите свой идеальный гаджет", limit: 12, showButton: true, buttonText: "Смотреть все категории", buttonHref: "/catalog" } },
 { id: "popular-products", pageKey: "home", type: "popular-products", title: "Популярные товары", description: "", enabled: true, sortOrder: 40, settings: { title: "Популярные товары", subtitle: "Выберите модель — конфигурацию подберёте на странице товара.", limit: 12, showButton: true, buttonText: "Смотреть все товары", buttonHref: "/catalog?popular=1" } },
 { id: "new-arrivals", pageKey: "home", type: "new-arrivals", title: "Новинки", description: "", enabled: true, sortOrder: 50, settings: { title: "Новинки", subtitle: "Техника, которая только появилась", limit: 3 } },
 { id: "support", pageKey: "home", type: "support", title: "Поддержка", description: "", enabled: true, sortOrder: 60, settings: {} },
];

function getProductImage(product: HomeProduct) {
 const mainImage = typeof product.image === "string" ? product.image.trim() : "";

 if (mainImage) {
 return mainImage;
 }

 const galleryImage = Array.isArray(product.images)
 ? product.images.find((image) => typeof image === "string" && image.trim())
 : "";

 return typeof galleryImage === "string" ? galleryImage.trim() : "";
}

function isConfiguredProduct(product: HomeProduct) {
 return product.slug !== "catalog" && Boolean(getProductImage(product));
}


export default function Home({ initialData = {} }: { initialData?: HomePayload }) {
 const { dark } = useTheme();

 const allProducts = Array.isArray(initialData.products) ? initialData.products : [];
 const defaultPopular = Array.isArray(initialData.popularProducts)
 ? initialData.popularProducts
 : allProducts;
 const defaultNewArrivals = Array.isArray(initialData.newArrivals)
 ? initialData.newArrivals
 : allProducts.filter((p) => p.isNew);

 const [categories, setCategories] = useState<HomeCategory[]>(
 Array.isArray(initialData.categories) ? initialData.categories : []
 );
 const [popularProducts, setPopularProducts] = useState<HomeProduct[]>(
 defaultPopular.filter(isConfiguredProduct)
 );
 const [newArrivals, setNewArrivals] = useState<HomeProduct[]>(
 defaultNewArrivals.filter((p) => p.slug !== "catalog").slice(0, 3)
 );
 const [homeBlocks, setHomeBlocks] = useState<HomePageBlock[]>(
 Array.isArray(initialData.pageBlocks) ? initialData.pageBlocks : []
 );
 const [banners, setBanners] = useState<HomeBanner[]>(
 Array.isArray(initialData.banners) ? initialData.banners : []
 );
 const [benefits, setBenefits] = useState<HomeBenefit[]>(
 Array.isArray(initialData.benefits) ? initialData.benefits : []
 );
 const [siteSettings, setSiteSettings] = useState<PublicSiteSettings | null>(
 initialData.siteSettings ?? null
 );
 const fallbackFetchStarted = useRef(false);
 const shouldFetchFallback = useRef(
 categories.length === 0 ||
 popularProducts.length === 0 ||
 banners.length === 0 ||
 benefits.length === 0
 );

 // Fallback client-side fetch if server data wasn't provided.
 // It runs once and never wipes valid server data with empty arrays.
 useEffect(() => {
 if (!shouldFetchFallback.current || fallbackFetchStarted.current) return;

 fallbackFetchStarted.current = true;
 const controller = new AbortController();

 fetch("/api/home", {
 cache: "no-store",
 signal: controller.signal,
 })
 .then((response) => (response.ok ? response.json() : Promise.reject()))
 .then((payload: HomePayload) => {
 const all = Array.isArray(payload.products) ? payload.products : [];
 const pop = Array.isArray(payload.popularProducts)
 ? payload.popularProducts
 : all;
 const arrivals = Array.isArray(payload.newArrivals)
 ? payload.newArrivals
 : all.filter((product) => product.isNew);

 if (Array.isArray(payload.categories) && payload.categories.length > 0) {
 setCategories((current) => current.length > 0 ? current : payload.categories!);
 }

 if (payload.siteSettings) {
 setSiteSettings((current) => current ?? payload.siteSettings!);
 }

 if (Array.isArray(payload.pageBlocks) && payload.pageBlocks.length > 0) {
 setHomeBlocks((current) => current.length > 0 ? current : payload.pageBlocks!);
 }

 if (Array.isArray(payload.banners) && payload.banners.length > 0) {
 setBanners((current) => current.length > 0 ? current : payload.banners!);
 }

 if (Array.isArray(payload.benefits) && payload.benefits.length > 0) {
 setBenefits((current) => current.length > 0 ? current : payload.benefits!);
 }

 const configuredPopular = pop.filter(isConfiguredProduct);
 if (configuredPopular.length > 0) {
 setPopularProducts((current) =>
 current.length > 0 ? current : configuredPopular
 );
 }

 const configuredArrivals = arrivals
 .filter((product) => product.slug !== "catalog")
 .slice(0, 3);

 if (configuredArrivals.length > 0) {
 setNewArrivals((current) =>
 current.length > 0 ? current : configuredArrivals
 );
 }
 })
 .catch((error: unknown) => {
 if (error instanceof DOMException && error.name === "AbortError") return;
 })
 ;

 return () => controller.abort();
 }, []);

 const visibleCategories = categories;
 const visibleHomeBlocks = (homeBlocks.length ? homeBlocks : defaultHomePageBlocks)
 .filter((block) => block.enabled)
 .sort((a, b) => a.sortOrder - b.sortOrder);

 return (
 <main
 className={
 dark
 ? "min-h-screen bg-[#020814] text-white ease-in-out"
 : "min-h-screen bg-[#f6f8fb] text-[#0b1220] ease-in-out"
 }
 >
 <div className="mx-auto max-w-[1440px] px-2 pb-12 pt-2.5 sm:px-5 sm:py-6 lg:px-6">
 <SiteHeader />

 {visibleHomeBlocks.map((block) => (
 <HomeModule
 key={block.id}
 block={block}
 dark={dark}
 categories={visibleCategories}
 popularProducts={popularProducts}
 allProducts={popularProducts.length ? popularProducts : newArrivals}
 newArrivals={newArrivals}
 banners={banners}
 benefits={benefits}
 />
 ))}
 <Footer dark={dark} siteSettings={siteSettings} />
 </div>
 </main>
 );
}


function HomeModule({
 block,
 dark,
 categories,
 popularProducts,
 allProducts,
 newArrivals,
 banners,
 benefits,
}: {
 block: HomePageBlock;
 dark: boolean;
 categories: HomeCategory[];
 popularProducts: HomeProduct[];
 allProducts: HomeProduct[];
 newArrivals: HomeProduct[];
 banners: HomeBanner[];
 benefits: HomeBenefit[];
}) {
 const settings = block.settings ?? {};
 const type = block.type || block.id;
 const limit = getBlockNumber(settings, "limit", 12);

 if (type === "hero") {
 return <Hero dark={dark} banners={banners} />;
 }

 if (type === "benefits") {
 return (
 <Benefits
 dark={dark}
 benefits={benefits.slice(0, getBlockNumber(settings, "limit", 6))}
 title={getBlockText(settings, "title", "Преимущества")}
 subtitle={getBlockText(settings, "subtitle", "Почему выбирают Neontech")}
 />
 );
 }

 if (type === "category-grid" || type === "categories") {
 return (
 <Categories
 dark={dark}
 categories={categories.slice(0, limit)}
 title={getBlockText(settings, "title", "Выберите категорию")}
 subtitle={getBlockText(settings, "subtitle", "Выберите направление и найдите свой идеальный гаджет")}
 buttonText={getBlockText(settings, "buttonText", "Смотреть все категории")}
 buttonHref={getBlockText(settings, "buttonHref", "/catalog")}
 showButton={getBlockBoolean(settings, "showButton", true)}
 />
 );
 }

 if (type === "popular-products") {
 return (
 <PopularProducts
 dark={dark}
 products={popularProducts.slice(0, limit)}
 title={getBlockText(settings, "title", "Популярные товары")}
 subtitle={getBlockText(settings, "subtitle", "Выберите модель — конфигурацию подберёте на странице товара.")}
 buttonText={getBlockText(settings, "buttonText", "Смотреть все товары")}
 buttonHref={getBlockText(settings, "buttonHref", "/catalog?popular=1")}
 showButton={getBlockBoolean(settings, "showButton", true)}
 />
 );
 }

 if (type === "product-carousel") {
 const filter = getBlockText(settings, "filter", "all");
 const source = filter === "popular" ? popularProducts : filter === "new" ? newArrivals : allProducts;

 return (
 <PopularProducts
 dark={dark}
 products={source.slice(0, limit)}
 title={getBlockText(settings, "title", "Товары")}
 subtitle={getBlockText(settings, "subtitle", "Подборка из каталога")}
 buttonText={getBlockText(settings, "buttonText", "Открыть каталог")}
 buttonHref={getBlockText(settings, "buttonHref", "/catalog")}
 showButton={getBlockBoolean(settings, "showButton", true)}
 />
 );
 }

 if (type === "new-arrivals") {
 return (
 <NewArrivals
 dark={dark}
 products={newArrivals.slice(0, getBlockNumber(settings, "limit", 3))}
 title={getBlockText(settings, "title", "Новинки")}
 subtitle={getBlockText(settings, "subtitle", "Техника, которая только появилась")}
 />
 );
 }

 if (type === "promo-banner") {
 const bannerId = getBlockText(settings, "bannerId", "");
 const placement = getBlockText(settings, "placement", "home");
 const selectedBanner = bannerId
 ? banners.find((banner) => banner.id === bannerId)
 : banners.find((banner) => banner.placement === placement || banner.placement === "home") ?? banners[0];

 return <PromoBanner dark={dark} settings={settings} banner={selectedBanner} />;
 }

 if (type === "text-image") {
 return <TextImageModule dark={dark} settings={settings} />;
 }

 if (type === "support") {
 return <SupportBlock dark={dark} />;
 }

 return null;
}

function getBlockText(settings: Record<string, string | number | boolean | null>, key: string, fallback: string) {
 const value = settings[key];

 if (typeof value === "string") {
 return value || fallback;
 }

 if (typeof value === "number") {
 return String(value);
 }

 return fallback;
}

function getBlockNumber(settings: Record<string, string | number | boolean | null>, key: string, fallback: number) {
 const value = settings[key];

 if (typeof value === "number" && Number.isFinite(value)) {
 return value;
 }

 if (typeof value === "string") {
 const parsed = Number(value);
 return Number.isFinite(parsed) ? parsed : fallback;
 }

 return fallback;
}

function getBlockBoolean(settings: Record<string, string | number | boolean | null>, key: string, fallback: boolean) {
 const value = settings[key];
 return typeof value === "boolean" ? value : fallback;
}

function panelClass(dark: boolean) {
 return dark
 ? "border-white/10 bg-white/[0.035] "
 : "border-black/10 bg-white ";
}

function mutedTextClass(dark: boolean) {
 return dark ? "text-white/55" : "text-black/55";
}

function withoutTrailingArrow(label: string) {
 return label.replace(/\s*[→➜➡]+\s*$/, "").trim();
}


function Hero({ dark, banners }: { dark: boolean; banners: HomeBanner[] }) {
 const slides = banners
 .filter((banner) => banner.enabled)
 .sort((a, b) => a.sortOrder - b.sortOrder)
 .map((banner) => ({
 badge: banner.label || banner.adminTitle || "Промо",
 title: banner.title || banner.adminTitle,
 text: banner.subtitle || banner.description,
 primaryLabel: banner.buttonText || "Подробнее",
 primaryHref: banner.buttonHref || "/catalog",
 secondaryLabel: banner.secondaryButtonText || "",
 secondaryHref: banner.secondaryButtonHref || "",
 imageDark: banner.imageDark || banner.imageLight || banner.imageMobile,
 imageLight: banner.imageLight || banner.imageDark || banner.imageMobile,
 imageMobile: banner.imageMobile || banner.imageLight || banner.imageDark,
 titleSize: banner.titleSize,
 layout: banner.layout,
 }))
 .filter((slide) => slide.title || slide.text || slide.imageDark || slide.imageLight);

 const [activeSlide, setActiveSlide] = useState(0);
 const [dragStartX, setDragStartX] = useState<number | null>(null);
 const [isHeroHovered, setIsHeroHovered] = useState(false);

 useEffect(() => {
 if (slides.length > 0 && activeSlide >= slides.length) {
 setActiveSlide(0);
 }
 }, [activeSlide, slides.length]);

 useEffect(() => {
 if (slides.length <= 1 || isHeroHovered) return;

 const interval = window.setInterval(() => {
 setActiveSlide((current) => (current + 1) % slides.length);
 }, 5000);

 return () => window.clearInterval(interval);
 }, [slides.length, isHeroHovered]);

 const slide = slides[activeSlide] ?? slides[0];

 if (!slide) {
 return null;
 }

 const image = slide.imageDark || slide.imageLight || slide.imageMobile;
 const mobileImage = slide.imageMobile || image;
 const isImageBackgroundLayout = slide.layout === "image-bg";

 if (isImageBackgroundLayout) {
 return (
 <section className="mt-2 sm:mt-6">
 <div
 onPointerDown={handlePointerDown}
 onPointerUp={handlePointerUp}
 onPointerCancel={() => setDragStartX(null)}
 onPointerLeave={() => {
 setDragStartX(null);
 setIsHeroHovered(false);
 }}
 onMouseEnter={() => setIsHeroHovered(true)}
 onMouseLeave={() => setIsHeroHovered(false)}
 style={{ touchAction: "pan-y" }}
 className={`relative h-[220px] cursor-grab select-none overflow-hidden rounded-[20px] border active:cursor-grabbing sm:h-[360px] sm:rounded-[30px] lg:h-[520px] ${
 dark
 ? "border-white/10 bg-[#06101f]"
 : "border-black/10 bg-white"
 }`}
 >
 {image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={image}
 alt={slide.title || slide.badge || "Баннер"}
 draggable={false}
 className="hidden h-full w-full object-cover sm:block"
 />
 ) : null}
 {mobileImage ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={mobileImage}
 alt={slide.title || slide.badge || "Баннер"}
 draggable={false}
 className="block h-full w-full object-cover sm:hidden"
 />
 ) : null}
 {!image && !mobileImage ? (
 <div className={`absolute inset-6 rounded-3xl border border-dashed ${dark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-slate-50"}`} />
 ) : null}

 {slides.length > 1 ? (
 <>
 <button
 type="button"
 onClick={goToPrevSlide}
 aria-label="Предыдущий баннер"
 className={`absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-transparent transition-colors duration-200 sm:left-4 sm:h-10 sm:w-10 ${
 dark
 ? "text-white/70 hover:text-white"
 : "text-black/55 hover:text-blue-600"
 }`}
 >
 <ArrowIcon width={16} height={16} direction="left" />
 </button>
 <button
 type="button"
 onClick={goToNextSlide}
 aria-label="Следующий баннер"
 className={`absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-transparent transition-colors duration-200 sm:right-4 sm:h-10 sm:w-10 ${
 dark
 ? "text-white/70 hover:text-white"
 : "text-black/55 hover:text-blue-600"
 }`}
 >
 <ArrowIcon width={16} height={16} />
 </button>
 </>
 ) : null}
 {slides.length > 1 ? (
 <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2 sm:bottom-8 sm:left-8 sm:gap-2.5">
 {slides.map((item, index) => {
 const isActive = activeSlide === index;

 return (
 <button
 key={`${item.title}-${index}`}
 type="button"
 onClick={() => setActiveSlide(index)}
 aria-label={`Открыть слайд ${index + 1}`}
 className={`h-1.5 rounded-full bg-blue-600 transition-opacity duration-200 sm:h-1.5 ${
 isActive ? "w-8 opacity-100 sm:w-10" : "w-2 opacity-45 sm:w-2"
 }`}
 />
 );
 })}
 </div>
 ) : null}
 </div>
 </section>
 );
 }

 function goToNextSlide() {
 setActiveSlide((current) => (current + 1) % slides.length);
 }

 function goToPrevSlide() {
 setActiveSlide((current) =>
 current === 0 ? slides.length - 1 : current - 1
 );
 }

 function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
 if (slides.length <= 1) return;
 event.currentTarget.setPointerCapture?.(event.pointerId);
 setDragStartX(event.clientX);
 }

 function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
 if (dragStartX === null) return;

 if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
 event.currentTarget.releasePointerCapture(event.pointerId);
 }

 const distance = dragStartX - event.clientX;
 const swipeThreshold = 28;

 if (Math.abs(distance) > swipeThreshold && slides.length > 1) {
 if (distance > 0) {
 goToNextSlide();
 } else {
 goToPrevSlide();
 }
 }

 setDragStartX(null);
 }

 return (
 <section className="mt-2 sm:mt-6">
 <div
 onPointerDown={handlePointerDown}
 onPointerUp={handlePointerUp}
 onPointerCancel={() => setDragStartX(null)}
 onPointerLeave={() => {
 setDragStartX(null);
 setIsHeroHovered(false);
 }}
 onMouseEnter={() => setIsHeroHovered(true)}
 onMouseLeave={() => setIsHeroHovered(false)}
 style={{ touchAction: "pan-y" }}
 className={`relative h-[220px] cursor-grab select-none overflow-hidden rounded-[20px] border transition-all duration-700 active:cursor-grabbing sm:h-[360px] sm:rounded-[30px] lg:h-[520px] ${
 dark
 ? "border-white/10 bg-[#06101f]"
 : "border-black/10 bg-white "
 }`}
 >
 {image ? (
 <div
 className={
 isImageBackgroundLayout
 ? "absolute inset-0 hidden sm:block"
 : "absolute inset-y-0 right-0 hidden h-full w-[56%] items-center justify-end sm:flex lg:w-[60%]"
 }
 >
 <Image
 src={image}
 alt=""
 fill
 priority={activeSlide === 0}
 quality={85}
 className={
 isImageBackgroundLayout
 ? "object-contain object-right"
 : "object-contain object-right p-6 sm:p-8 lg:p-10"
 }
 draggable={false}
 />
 </div>
 ) : null}

 {mobileImage ? (
 <div className="absolute inset-y-0 right-0 block h-full w-[52%] sm:hidden">
 <Image
 src={mobileImage}
 alt=""
 fill
 priority={activeSlide === 0}
 quality={85}
 className="object-contain object-right p-1.5"
 draggable={false}
 />
 </div>
 ) : null}

 <div
 className={`pointer-events-none absolute inset-0 ${
 dark
 ? "bg-gradient-to-r from-[#06101f]/85 via-[#06101f]/30 to-transparent sm:from-[#020814]/85 sm:via-[#020814]/35 sm:to-transparent"
 : "bg-gradient-to-r from-white/80 via-white/25 to-transparent sm:from-white/80 sm:via-white/25 sm:to-transparent"
 }`}
 />

 <div className="relative z-10 flex h-full items-center px-3.5 py-3 sm:px-8 sm:py-8 lg:px-14 lg:py-12">
 <div className="w-full max-w-[calc(100%-40px)] sm:w-auto sm:max-w-[650px]">
 {slide.badge ? (
 <div className="mb-2 inline-flex rounded-full border border-blue-500/45 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium leading-none text-blue-500 sm:mb-5 sm:px-4 sm:py-2 sm:text-sm">
 {slide.badge}
 </div>
 ) : null}

 <h1 className={`whitespace-pre-line font-bold leading-[1.02] tracking-[-0.055em] sm:max-w-[620px] ${
 slide.titleSize === "md" ? "text-[14px] sm:text-[30px] lg:text-[44px]"
 : slide.titleSize === "xl" ? "text-[18px] sm:text-[48px] lg:text-[72px]"
 : "text-[16px] sm:text-[38px] lg:text-[60px]"
 }`}>
 {slide.title}
 </h1>

 {slide.text ? (
 <p className={`mt-1.5 max-w-[70%] text-[11px] leading-snug sm:mt-4 sm:max-w-none sm:text-base lg:text-lg ${mutedTextClass(dark)}`}>
 {slide.text}
 </p>
 ) : null}

 <div className="mt-7 flex flex-wrap gap-2 sm:mt-12 sm:gap-4 lg:mt-14">
 <Link
 href={slide.primaryHref}
 className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500 sm:min-h-12 sm:px-7 sm:py-4 sm:text-sm"
 >
 {withoutTrailingArrow(slide.primaryLabel)}
 </Link>

 {slide.secondaryLabel && slide.secondaryHref ? (
 <Link
 href={slide.secondaryHref}
 className={`hidden min-h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-[11px] font-medium transition-all duration-300 hover:-translate-y-0.5 min-[390px]:inline-flex sm:min-h-12 sm:px-7 sm:py-4 sm:text-sm ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 >
 {withoutTrailingArrow(slide.secondaryLabel)}
 </Link>
 ) : null}
 </div>


 {slides.length > 1 ? (
 <>
 <button
 type="button"
 onClick={goToPrevSlide}
 aria-label="Предыдущий баннер"
 className={`absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-transparent transition-colors duration-200 sm:left-4 sm:h-10 sm:w-10 ${
 dark
 ? "text-white/70 hover:text-white"
 : "text-black/55 hover:text-blue-600"
 }`}
 >
 <ArrowIcon width={16} height={16} direction="left" />
 </button>
 <button
 type="button"
 onClick={goToNextSlide}
 aria-label="Следующий баннер"
 className={`absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-transparent transition-colors duration-200 sm:right-4 sm:h-10 sm:w-10 ${
 dark
 ? "text-white/70 hover:text-white"
 : "text-black/55 hover:text-blue-600"
 }`}
 >
 <ArrowIcon width={16} height={16} />
 </button>
 </>
 ) : null}
 {slides.length > 1 ? (
 <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2 sm:bottom-8 sm:left-8 sm:gap-2.5">
 {slides.map((item, index) => {
 const isActive = activeSlide === index;

 return (
 <button
 key={`${item.title}-${index}`}
 type="button"
 onClick={() => setActiveSlide(index)}
 aria-label={`Открыть слайд ${index + 1}`}
 className={`h-1.5 rounded-full bg-blue-600 transition-opacity duration-200 sm:h-1.5 ${
 isActive ? "w-8 opacity-100 sm:w-10" : "w-2 opacity-45 sm:w-2"
 }`}
 />
 );
 })}
 </div>
 ) : null}
 </div>
 </div>
 </div>
 </section>
 );
}


function BenefitIcon({ image, icon }: { image?: string; icon?: string }) {
 const [failed, setFailed] = useState(false);
 const cleanImage = typeof image === "string" ? image.trim() : "";
 const fallbackIcon = icon?.trim() || "✓";
 const showImage = Boolean(cleanImage) && !failed;

 useEffect(() => {
 setFailed(false);
 }, [cleanImage]);

 return (
 <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-blue-500 sm:h-14 sm:w-14">
 {showImage ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={cleanImage}
 alt=""
 loading="eager"
 decoding="async"
 onError={() => setFailed(true)}
 className="block h-8 w-8 object-contain sm:h-10 sm:w-10"
 />
 ) : (
 <span className="flex h-8 w-8 items-center justify-center text-[24px] font-medium leading-none text-blue-500 sm:h-10 sm:w-10 sm:text-[28px]">
 {fallbackIcon}
 </span>
 )}
 </div>
 );
}


function Benefits({
 dark,
 benefits,
}: {
 dark: boolean;
 benefits: HomeBenefit[];
 title?: string;
 subtitle?: string;
}) {
 const items = benefits
 .filter((item) => item && item.id && item.title)
 .sort((a, b) => {
 const orderA = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 0;
 const orderB = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0;
 return orderA - orderB;
 });

 if (items.length === 0) {
 return null;
 }

 return (
 <section
 className={`mt-3 rounded-2xl border px-3 py-2 transition-colors duration-300 sm:mt-6 sm:px-4 sm:py-2.5 ${panelClass(dark)}`}
 >
 <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
 {items.map((item) => {
 const card = (
 <div className="flex min-h-[72px] w-full min-w-0 items-center gap-3.5 overflow-hidden rounded-xl px-2.5 py-1.5 sm:min-h-[78px] sm:gap-4 sm:px-3.5 sm:py-2">
 <BenefitIcon image={item.image} icon={item.icon} />

 <div className="min-w-0 flex-1">
 <div className="line-clamp-2 text-[12px] font-semibold leading-[1.25] sm:text-[13px] lg:text-[14px]">
 {item.title}
 </div>

 {item.description ? (
 <div
 className={`mt-1 break-words text-[11px] leading-[1.35] sm:text-xs ${mutedTextClass(dark)}`}
 >
 {item.description}
 </div>
 ) : null}
 </div>
 </div>
 );

 return item.href ? (
 <Link
 key={item.id}
 href={item.href}
 className="block min-w-0 rounded-xl transition-colors hover:bg-blue-500/[0.04]"
 prefetch={false}
 >
 {card}
 </Link>
 ) : (
 <div key={item.id} className="min-w-0 rounded-xl">
 {card}
 </div>
 );
 })}
 </div>
 </section>
 );
}

function Categories({
 dark,
 categories,
 title = "Выберите категорию",
 subtitle = "Выберите направление и найдите свой идеальный гаджет",
 buttonText = "Смотреть все категории",
 buttonHref = "/catalog",
 showButton = true,
}: {
 dark: boolean;
 categories: HomeCategory[];
 title?: string;
 subtitle?: string;
 buttonText?: string;
 buttonHref?: string;
 showButton?: boolean;
}) {
 if (categories.length === 0) {
 return null;
 }

 return (
 <section className="py-3 sm:py-8 lg:py-10">
 <div className="flex items-end justify-between gap-4">
 <div className="min-w-0">
 <h2 className="text-[20px] font-bold leading-tight tracking-[-0.04em] sm:text-3xl lg:text-4xl">
 {title}
 </h2>

 <p className={`mt-0.5 line-clamp-1 text-[11px] sm:mt-3 sm:text-base ${mutedTextClass(dark)}`}>
 {subtitle}
 </p>
 </div>

 {showButton ? (
 <Link
 href={buttonHref}
 className={`mt-4 hidden shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 sm:inline-flex ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 >
 {withoutTrailingArrow(buttonText)}
 </Link>
 ) : null}
 </div>

 <div
 className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pb-0 lg:grid-cols-3 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden"
 style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
 >
 {categories.map((category) => {
 const image = category.image?.trim() ?? "";

 return (
 <Link
 key={category.id || category.slug}
 href={category.href || `/catalog/${category.slug}`}
 className={`group relative flex h-[96px] w-[92px] shrink-0 flex-col items-center justify-between overflow-hidden rounded-2xl border p-2 text-center transition-all duration-500 hover:-translate-y-1 sm:min-h-[180px] sm:w-auto sm:items-start sm:p-6 sm:pb-16 sm:text-left ${
 dark
 ? "border-white/10 bg-white/[0.035] hover:border-blue-500/35 hover:bg-white/[0.025]"
 : "border-black/10 bg-white hover:border-blue-500/35 hover:"
 }`}
 >
 <div className="relative z-10 order-2 flex w-full flex-1 flex-col sm:order-none sm:max-w-[42%] sm:pr-2">
 <h3 className="line-clamp-2 text-[10px] font-bold leading-tight sm:text-lg">
 {category.name}
 </h3>

 <p className={`mt-2 hidden line-clamp-2 text-xs leading-relaxed sm:block ${mutedTextClass(dark)}`}>
 {category.description}
 </p>
 </div>

 <div className="relative z-10 order-1 flex h-12 w-12 items-center justify-center overflow-visible rounded-xl sm:absolute sm:right-5 sm:top-1/2 sm:h-[138px] sm:w-[138px] sm:-translate-y-1/2 sm:rounded-2xl">
 {dark ? (
 <>
 <div
 aria-hidden="true"
 className="pointer-events-none absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.05]"
 />
 <div
 aria-hidden="true"
 className="pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-xl"
 />
 </>
 ) : null}

 {image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={image}
 alt=""
 draggable={false}
 className="relative z-10 h-full w-full object-contain dark:"
 />
 ) : (
 <div className={`h-full w-full rounded-xl sm:rounded-2xl ${dark ? "bg-white/[0.04]" : "bg-slate-100"}`} />
 )}
 </div>

 <div
 className={`absolute bottom-5 left-6 z-20 hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-all duration-300 group-hover:translate-x-1 sm:flex ${
 dark
 ? "border-transparent bg-blue-600 text-white group-hover:bg-blue-500"
 : "border-black/10 bg-white text-black group-hover:border-blue-500 group-hover:bg-blue-600 group-hover:text-white"
 }`}
 >
 <ArrowIcon width={14} height={14} />
 </div>

 <div className={`pointer-events-none absolute inset-y-0 right-0 hidden w-[30%] sm:block ${dark ? "bg-gradient-to-l from-blue-500/5 to-transparent" : "bg-gradient-to-l from-white/30 to-transparent"}`} />
 </Link>
 );
 })}
 </div>

 {showButton ? (
 <div className="mt-4 flex sm:hidden">
 <Link
 href={buttonHref}
 className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 >
 {withoutTrailingArrow(buttonText)}
 </Link>
 </div>
 ) : null}
 </section>
 );
}

function PopularProducts({
 dark,
 products,
 title = "Популярные товары",
 subtitle = "Выберите модель — конфигурацию подберёте на странице товара.",
 buttonText = "Смотреть все товары",
 buttonHref = "/catalog?popular=1",
 showButton = true,
}: {
 dark: boolean;
 products: HomeProduct[];
 title?: string;
 subtitle?: string;
 buttonText?: string;
 buttonHref?: string;
 showButton?: boolean;
}) {
 const sliderRef = useRef<HTMLDivElement | null>(null);
 const dragStartXRef = useRef<number | null>(null);
 const scrollStartRef = useRef(0);
 const didDragRef = useRef(false);

 const [scrollProgress, setScrollProgress] = useState(0);

 function updateProgress() {
 const slider = sliderRef.current;

 if (!slider) return;

 const maxScroll = slider.scrollWidth - slider.clientWidth;

 if (maxScroll <= 0) {
 setScrollProgress(0);
 return;
 }

 setScrollProgress(slider.scrollLeft / maxScroll);
 }

 function scrollProducts(direction: "prev" | "next") {
 const slider = sliderRef.current;

 if (!slider) return;

 const distance = direction === "next" ? 330 : -330;

 slider.scrollBy({ left: distance, behavior: "smooth" });
 window.setTimeout(updateProgress, 350);
 }

 function handleProductsPointerDown(event: PointerEvent<HTMLDivElement>) {
 const slider = sliderRef.current;

 if (!slider) return;

 dragStartXRef.current = event.clientX;
 scrollStartRef.current = slider.scrollLeft;
 didDragRef.current = false;
 }

 function handleProductsPointerMove(event: PointerEvent<HTMLDivElement>) {
 const slider = sliderRef.current;

 if (!slider || dragStartXRef.current === null) return;

 const distance = dragStartXRef.current - event.clientX;

 if (Math.abs(distance) > 6) {
 didDragRef.current = true;
 }

 slider.scrollLeft = scrollStartRef.current + distance;
 updateProgress();
 }

 function handleProductsPointerUp() {
 dragStartXRef.current = null;

 window.setTimeout(() => {
 didDragRef.current = false;
 }, 120);
 }

 function handleProductsClickCapture(event: MouseEvent<HTMLDivElement>) {
 if (!didDragRef.current) return;

 event.preventDefault();
 event.stopPropagation();

 window.setTimeout(() => {
 didDragRef.current = false;
 }, 120);
 }

 if (products.length === 0) {
 return null;
 }

 return (
 <section className="pb-3 sm:pb-8 lg:pb-10">
 <div className="flex items-end justify-between gap-4">
 <div className="min-w-0">
 <h2 className="text-[20px] font-bold leading-tight tracking-[-0.04em] sm:text-[36px] lg:text-[52px]">
 {title}
 </h2>

 <p className={`mt-0.5 line-clamp-1 text-[11px] sm:mt-3 sm:text-base ${mutedTextClass(dark)}`}>
 {subtitle}
 </p>
 </div>

 <div className="mt-5 hidden items-center gap-3 sm:flex">
 {showButton ? (
 <Link
 href={buttonHref}
 className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 >
 {withoutTrailingArrow(buttonText)}
 </Link>
 ) : null}
 <button
 type="button"
 onClick={() => scrollProducts("prev")}
 className={`flex h-11 w-11 items-center justify-center rounded-xl border text-lg transition-all duration-300 hover:-translate-y-0.5 ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 aria-label="Предыдущие товары"
 >
 <ArrowIcon width={14} height={14} direction="left" />
 </button>

 <button
 type="button"
 onClick={() => scrollProducts("next")}
 className={`flex h-11 w-11 items-center justify-center rounded-xl border text-lg transition-all duration-300 hover:-translate-y-0.5 ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 aria-label="Следующие товары"
 >
 <ArrowIcon width={14} height={14} />
 </button>
 </div>
 </div>

 <div
 className="mt-3 overflow-x-auto sm:hidden [&::-webkit-scrollbar]:hidden"
 style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
 >
 <div className="flex gap-2 pb-1">
 {products.map((product) => (
 <div key={product.slug} className="w-[30vw] max-w-[130px] shrink-0">
 <ProductCard product={product} dark={dark} />
 </div>
 ))}
 </div>
 </div>

 <div
 ref={sliderRef}
 onScroll={updateProgress}
 onPointerDown={handleProductsPointerDown}
 onPointerMove={handleProductsPointerMove}
 onPointerUp={handleProductsPointerUp}
 onPointerCancel={handleProductsPointerUp}
 onPointerLeave={handleProductsPointerUp}
 onClickCapture={handleProductsClickCapture}
 className="mt-8 hidden cursor-grab select-none overflow-x-auto px-1 py-2 active:cursor-grabbing sm:block [&::-webkit-scrollbar]:hidden"
 style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
 >
 <div className="flex gap-6">
 {products.map((product) => (
 <div key={product.slug} className="w-[250px] shrink-0 md:w-[300px] lg:w-[310px]">
 <ProductCard product={product} dark={dark} />
 </div>
 ))}
 </div>
 </div>

 <div className="mt-6 hidden justify-center sm:flex">
 <div className={`h-1.5 w-[180px] overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-black/10"}`}>
 <div
 className="h-full rounded-full bg-blue-600 transition-all duration-300"
 style={{ width: `${Math.max(18, scrollProgress * 100)}%` }}
 />
 </div>
 </div>

 {showButton ? (
 <div className="mt-4 flex sm:hidden">
 <Link
 href={buttonHref}
 className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 >
 {withoutTrailingArrow(buttonText)}
 </Link>
 </div>
 ) : null}
 </section>
 );
}


function ProductCard({
 product,
 dark,
}: {
 product: HomeProduct;
 dark: boolean;
}) {
 const image = getProductImage(product);
 const href = product.slug === "catalog" ? "/catalog" : `/product/${product.slug}`;

 return (
 <Link
 href={href}
 draggable={false}
 className={`group block h-full rounded-[15px] border p-1.5 transition-all duration-500 hover:-translate-y-1 sm:rounded-3xl sm:p-4 ${
 dark
 ? "border-white/10 bg-white/[0.035] hover:border-blue-500/35 hover:bg-white/[0.025]"
 : "border-black/10 bg-white hover:border-blue-500/35"
 }`}
 >
 <div
 className={`relative flex h-[88px] items-center justify-center overflow-hidden rounded-[12px] min-[390px]:h-[98px] sm:h-[230px] sm:rounded-2xl ${
 image
 ? "bg-white"
 : dark
 ? "bg-white/[0.045] text-white/25"
 : "bg-slate-100 text-black/25"
 }`}
 >
 {product.isNew ? (
 <span className="absolute left-1.5 top-1.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[8px] font-semibold text-white sm:left-2 sm:top-2 sm:px-2 sm:text-[11px]">
 Новинка
 </span>
 ) : null}

 {image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={image}
 alt={product.name}
 draggable={false}
 className="h-full w-full object-contain p-0.5 sm:p-2"
 />
 ) : (
 <span className="text-[10px] sm:text-sm">Фото товара</span>
 )}
 </div>

 <div className="px-0.5 pb-0.5 pt-1.5 sm:px-1 sm:pb-1 sm:pt-4">
 {product.brand ? (
 <p className={`mb-0.5 line-clamp-1 text-[9px] sm:mb-1 sm:text-xs ${mutedTextClass(dark)}`}>{product.brand}</p>
 ) : null}

 <h3 className="line-clamp-2 min-h-[27px] text-[11px] font-bold leading-tight sm:min-h-0 sm:text-lg">{product.name}</h3>

 <p className="mt-1.5 min-w-0 text-[12px] font-bold text-blue-600 sm:mt-3 sm:text-lg">
 {product.priceMax ? `от ${product.price} до ${product.priceMax}` : product.price}
 </p>

 {product.colors?.length > 0 && (
 <div className="mt-1 flex gap-1">
 {product.colors.slice(0, 3).map((color) => (
 <span key={color} className={`h-2 w-2 rounded-full border ${dark ? "border-white/20" : "border-black/20"}`} style={{ backgroundColor: color }} />
 ))}
 </div>
 )}

 <div className="mt-2 w-full rounded-xl bg-blue-600 py-2 text-center text-[11px] font-medium text-white transition-all duration-300 group-hover:bg-blue-500 sm:mt-4 sm:py-3 sm:text-sm">
 Перейти
 </div>
 </div>
 </Link>
 );
}

function NewArrivals({
 dark,
 products,
 title = "Новинки",
 subtitle = "Техника, которая только появилась",
}: {
 dark: boolean;
 products: HomeProduct[];
 title?: string;
 subtitle?: string;
}) {
 const items = products
 .filter((product) => product.slug !== "catalog")
 .slice(0, 3);
 const [mainItem, ...secondaryItems] = items;

 if (!mainItem) {
 return (
 <section className="pb-3 sm:pb-8 lg:pb-10">
 <div className="mb-8 flex items-end justify-between gap-4">
 <div className="min-w-0">
 <h2 className="text-[23px] font-bold leading-none tracking-[-0.04em] sm:text-[36px] lg:text-[52px]">
 {title}
 </h2>
 <p className={`mt-1 text-xs sm:mt-3 sm:text-base ${mutedTextClass(dark)}`}>
 {subtitle}
 </p>
 </div>

 <Link
 href="/new"
 className={`mt-4 hidden shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 sm:inline-flex ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 >
 Перейти к новинкам
 </Link>
 </div>

 <div
 className={`rounded-3xl border p-8 text-sm ${
 dark
 ? "border-white/10 bg-white/[0.035] text-white/55"
 : "border-black/10 bg-white text-black/55"
 }`}
 >
 Новинки пока не выбраны. Добавьте товар в админке, включите галочку
 “Новинка” и загрузите фото для блока “Новинки”.
 </div>
 </section>
 );
 }

 return (
 <section className="pb-3 sm:pb-8 lg:pb-10">
 <div className="mb-5 flex items-end justify-between gap-4 sm:mb-8">
 <div className="min-w-0">
 <h2 className="text-[22px] font-bold leading-none tracking-[-0.04em] sm:text-[36px] lg:text-[52px]">
 {title}
 </h2>

 <p className={`mt-1.5 text-sm sm:mt-3 sm:text-base ${mutedTextClass(dark)}`}>
 {subtitle}
 </p>
 </div>

 <Link
 href="/new"
 className={`hidden shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 sm:inline-flex ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 >
 Перейти к новинкам
 </Link>
 </div>

 <div className="grid gap-3">
 <NewArrivalCard item={mainItem} dark={dark} featured />

 {secondaryItems.length > 0 ? (
 <div className="grid gap-3 lg:grid-cols-2">
 {secondaryItems.map((item) => (
 <NewArrivalCard key={`${item.slug}-${item.name}`} item={item} dark={dark} />
 ))}
 </div>
 ) : null}
 </div>
 </section>
 );
}


function NewArrivalCard({
 item,
 dark,
 featured = false,
}: {
 item: HomeProduct;
 dark: boolean;
 featured?: boolean;
}) {
 const promoImage = item.promoImage?.trim() ?? "";
 const fallbackImage = getProductImage(item);
 const image = promoImage || fallbackImage;
 const href = item.slug === "catalog" ? "/catalog" : `/product/${item.slug}`;
 const description =
 item.shortDescription ||
 "Новая модель в каталоге. Откройте карточку, чтобы выбрать конфигурацию.";

 return (
 <Link
 href={href}
 className={`group relative grid min-h-[110px] grid-cols-[minmax(0,1fr)_100px] overflow-hidden rounded-2xl border transition-all duration-500 hover:-translate-y-1 sm:min-h-[140px] sm:rounded-3xl ${
 featured
 ? "lg:min-h-[200px] lg:max-h-[320px] lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.9fr)]"
 : "lg:min-h-[150px] lg:max-h-[240px] lg:grid-cols-[minmax(0,1fr)_minmax(180px,0.85fr)]"
 } ${
 dark
 ? "border-white/10 bg-white/[0.035] hover:border-blue-500/35"
 : "border-black/10 bg-white hover:border-blue-500/35"
 }`}
 >
 <div className="relative z-10 flex flex-col items-start justify-center p-4 sm:p-6 lg:p-8">
 <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-500 sm:text-xs">
 Новинка
 </div>

 <h3 className={`mt-1.5 max-w-[420px] font-bold leading-[1.05] tracking-[-0.045em] sm:mt-2 ${featured ? "text-[16px] sm:text-2xl lg:text-3xl" : "text-[15px] sm:text-lg lg:text-xl"}`}>
 {item.name}
 </h3>

 <p className={`mt-1.5 hidden line-clamp-2 max-w-[360px] text-[11px] leading-snug sm:mt-2 sm:block sm:text-xs lg:text-sm ${mutedTextClass(dark)}`}>
 {description}
 </p>

 <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-3 sm:gap-3">
 <span className="inline-flex h-8 items-center justify-center rounded-xl bg-blue-600 px-3 text-[11px] font-medium text-white transition-colors group-hover:bg-blue-500 sm:h-9 sm:px-4 sm:text-xs">
 Подробнее
 </span>

 <span className={`text-[11px] sm:text-sm ${mutedTextClass(dark)}`}>{item.price}</span>
 </div>
 </div>

 <div className={`relative min-h-full overflow-hidden ${dark ? "bg-white/[0.025]" : "bg-white"}`}>
 {image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={image}
 alt={item.name}
 draggable={false}
 className="h-full w-full object-contain p-2 transition-transform duration-700 group-hover:scale-[1.03] sm:p-4"
 />
 ) : (
 <div className={`absolute inset-4 rounded-2xl border border-dashed sm:inset-6 sm:rounded-[28px] ${dark ? "border-white/10 bg-white/[0.025]" : "border-black/10 bg-white"}`} />
 )}
 </div>
 </Link>
 );
}

function bannerTitleSizeClass(size?: string) {
 if (size === "md") return "text-3xl lg:text-4xl";
 if (size === "xl") return "text-5xl lg:text-6xl";
 return "text-4xl lg:text-5xl";
}

function bannerTextSizeClass(size?: string) {
 if (size === "sm") return "text-sm";
 if (size === "lg") return "text-lg";
 return "text-base";
}

function PromoBanner({
 dark,
 settings,
 banner,
}: {
 dark: boolean;
 settings: Record<string, string | number | boolean | null>;
 banner?: HomeBanner;
}) {
 const title = banner?.title || getBlockText(settings, "title", "Промо-блок");
 const subtitle = banner?.subtitle || banner?.description || getBlockText(settings, "subtitle", "Добавьте текст и изображение в редакторе сайта.");
 const image = banner
 ? dark
 ? banner.imageDark || banner.imageLight || banner.imageMobile
 : banner.imageLight || banner.imageDark || banner.imageMobile
 : getBlockText(settings, "image", "");
 const label = banner?.label || getBlockText(settings, "label", "Промо");
 const buttonText = banner?.buttonText || getBlockText(settings, "buttonText", "Подробнее");
 const buttonHref = banner?.buttonHref || getBlockText(settings, "buttonHref", "/catalog");
 const secondaryButtonText = banner?.secondaryButtonText || "";
 const secondaryButtonHref = banner?.secondaryButtonHref || "";
 const isImageBackgroundLayout = banner?.layout === "image-bg";
 const titleSize = banner?.titleSize || getBlockText(settings, "titleSize", "lg");
 const textSize = banner?.textSize || getBlockText(settings, "textSize", "md");

 if (isImageBackgroundLayout) {
 return (
 <section className="pb-3 sm:pb-8 lg:pb-10">
 <div className={`overflow-hidden rounded-[22px] border sm:rounded-[34px] ${dark ? "border-white/10 bg-white/[0.035]" : "border-black/10 bg-white"}`}>
 {image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={image} alt={title} className="block h-[220px] w-full object-cover sm:h-[360px] lg:h-[520px]" />
 ) : (
 <div className={`h-[220px] rounded-[22px] border border-dashed sm:h-[360px] sm:rounded-[34px] lg:h-[520px] ${dark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-slate-50"}`} />
 )}
 </div>
 </section>
 );
 }

 return (
 <section className="pb-3 sm:pb-8 lg:pb-10">
 <div
 className={`group grid overflow-hidden rounded-[22px] border transition-all duration-500 hover:-translate-y-1 sm:min-h-[260px] sm:rounded-[34px] lg:grid-cols-[0.95fr_1.05fr] ${
 dark
 ? "border-blue-500/20 bg-blue-600/10 hover:border-blue-500/40"
 : "border-blue-100 bg-white hover:border-blue-400/40"
 }`}
 >
 <div className="flex flex-col items-start justify-center p-4 sm:p-8 lg:p-10">
 <div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">{label}</div>
 <h2 className={`mt-4 max-w-[520px] whitespace-pre-line font-bold leading-[1.05] tracking-[-0.05em] ${bannerTitleSizeClass(titleSize)}`}>
 {title}
 </h2>
 <p className={`mt-4 max-w-[430px] leading-relaxed ${bannerTextSizeClass(textSize)} ${mutedTextClass(dark)}`}>
 {subtitle}
 </p>
 <div className="mt-7 flex flex-wrap gap-3">
 <Link href={buttonHref} className="inline-flex rounded-xl bg-blue-600 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-blue-500">
 {buttonText}
 </Link>
 {secondaryButtonText && secondaryButtonHref ? (
 <Link href={secondaryButtonHref} className={`inline-flex rounded-xl border px-6 py-4 text-sm font-medium transition-colors ${dark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"}`}>
 {secondaryButtonText}
 </Link>
 ) : null}
 </div>
 </div>

 <div className={`flex aspect-[16/9] items-center justify-center sm:min-h-[220px] sm:aspect-auto ${dark ? "bg-white/[0.035]" : "bg-slate-50"}`}>
 {image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={image} alt={title} className="h-full max-h-[190px] w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105 sm:max-h-[360px] sm:p-6" />
 ) : (
 <div className={`mx-4 h-[120px] w-full rounded-2xl border border-dashed sm:mx-6 sm:h-[180px] sm:rounded-3xl ${dark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white"}`} />
 )}
 </div>
 </div>
 </section>
 );
}

function TextImageModule({
 dark,
 settings,
}: {
 dark: boolean;
 settings: Record<string, string | number | boolean | null>;
}) {
 const title = getBlockText(settings, "title", "Заголовок секции");
 const subtitle = getBlockText(settings, "subtitle", "Описание секции можно менять в редакторе сайта.");
 const image = getBlockText(settings, "image", "");
 const imageSide = getBlockText(settings, "imageSide", "right");

 return (
 <section className="pb-3 sm:pb-8 lg:pb-10">
 <div
 className={`grid overflow-hidden rounded-[34px] border lg:grid-cols-2 ${
 dark
 ? "border-white/10 bg-white/[0.035]"
 : "border-black/10 bg-white "
 }`}
 >
 <div className={`flex min-h-[300px] items-center justify-center p-8 ${imageSide === "left" ? "lg:order-1" : "lg:order-2"}`}>
 {image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={image} alt={title} className="max-h-[360px] w-full object-contain" />
 ) : (
 <div className={`h-[240px] w-full rounded-3xl border border-dashed ${dark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-slate-50"}`} />
 )}
 </div>
 <div className={`flex flex-col justify-center p-8 lg:p-12 ${imageSide === "left" ? "lg:order-2" : "lg:order-1"}`}>
 <h2 className="max-w-[520px] text-4xl font-bold leading-[1.05] tracking-[-0.05em] lg:text-5xl">
 {title}
 </h2>
 <p className={`mt-5 max-w-[520px] text-base leading-relaxed lg:text-lg ${mutedTextClass(dark)}`}>
 {subtitle}
 </p>
 </div>
 </div>
 </section>
 );
}


function SupportBlock({ dark }: { dark: boolean }) {
 const [activeFaqId, setActiveFaqId] = useState<string | null>(null);
 const [supportCards, setSupportCards] = useState<
 Array<{ id: string; title: string; text: string; icon: string; image: string }>
 >([]);
 const [questions, setQuestions] = useState<
 Array<{ id: string; question: string; answer: string }>
 >([]);

 useEffect(() => {
 let mounted = true;

 fetch("/api/support-content", { cache: "no-store" })
 .then((response) => (response.ok ? response.json() : Promise.reject()))
 .then((payload: {
 features?: Array<{ id: string; title: string; text: string; icon: string; image: string }>;
 questions?: Array<{ id: string; question: string; answer: string }>;
 }) => {
 if (!mounted) return;

 const nextFeatures = Array.isArray(payload.features) ? payload.features : [];
 const nextQuestions = Array.isArray(payload.questions) ? payload.questions : [];

 setSupportCards(nextFeatures);
 setQuestions(nextQuestions);
 setActiveFaqId((current) =>
 nextQuestions.some((item) => item.id === current)
 ? current
 : nextQuestions[0]?.id ?? null,
 );
 })
 .catch(() => {
 if (!mounted) return;
 setSupportCards([]);
 setQuestions([]);
 setActiveFaqId(null);
 });

 return () => {
 mounted = false;
 };
 }, []);

 if (supportCards.length === 0 && questions.length === 0) {
 return null;
 }

 return (
 <section className={`mb-10 rounded-[22px] border p-3 transition-all duration-700 sm:mb-20 sm:rounded-[32px] sm:p-8 md:p-10 ${panelClass(dark)}`}>
 <h2 className="text-xl font-bold tracking-[-0.04em] sm:text-4xl md:text-5xl">
 Сервис и поддержка Neontech
 </h2>

 <p className={`mt-1 text-[11px] sm:mt-4 sm:text-lg md:text-xl ${mutedTextClass(dark)}`}>
 Подскажем, чем отличаются модели и как оформить заказ.
 </p>

 <div className="mt-3 grid items-start gap-3 sm:mt-8 sm:gap-6 lg:grid-cols-2">
 <div className="grid grid-cols-2 gap-2 self-start sm:gap-5">
 {supportCards.map((item) => (
 <div
 key={item.id}
 className={`flex min-h-[110px] flex-col justify-start rounded-2xl border p-3 transition-colors duration-300 sm:min-h-[154px] sm:p-6 ${
 dark
 ? "border-white/10 bg-white/[0.025] hover:border-blue-500/25 hover:bg-blue-500/[0.03]"
 : "border-black/10 bg-white/80 hover:border-blue-500/25 hover:bg-blue-50/40"
 }`}
 >
 <div className="relative flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14">
 {dark && item.image ? (
 <div
 aria-hidden="true"
 className="pointer-events-none absolute inset-1 rounded-full bg-blue-500/[0.05] blur-xl"
 />
 ) : null}
 {item.image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={item.image}
 alt=""
 className="relative z-10 h-10 w-10 object-contain sm:h-12 sm:w-12"
 />
 ) : (
 <span className="relative z-10 text-base leading-none text-blue-500 sm:text-xl">
 {item.icon || "✓"}
 </span>
 )}
 </div>
 <h3 className="mt-2 text-[12px] font-bold leading-tight sm:mt-6 sm:text-base">
 {item.title}
 </h3>
 <p className={`mt-1 text-[10px] leading-relaxed sm:mt-3 sm:text-sm ${mutedTextClass(dark)}`}>
 {item.text}
 </p>
 </div>
 ))}
 </div>

 <div className="grid gap-2 sm:gap-4">
 {questions.map((item) => {
 const isOpen = activeFaqId === item.id;

 return (
 <motion.div
 key={item.id}
 layout
 transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
 className={`relative overflow-hidden rounded-2xl border transition-colors duration-300 ${
 dark
 ? "border-white/10 bg-[#08111f] hover:border-blue-500/30"
 : "border-black/10 bg-white hover:border-blue-500/30"
 }`}
 >
 <button
 type="button"
 onClick={() =>
 setActiveFaqId((prev) => (prev === item.id ? null : item.id))
 }
 className="group relative flex min-h-[58px] w-full items-center justify-between bg-transparent px-4 py-3 text-left sm:min-h-[68px] sm:px-6 sm:py-4"
 >
 <div className="flex items-center justify-between gap-3">
 <span className="text-[12px] font-semibold leading-tight sm:text-base">
 {item.question}
 </span>
 <span
 className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-blue-500 transition-all duration-300 ${
 dark
 ? "border-white/10 bg-white/[0.03] group-hover:border-blue-500/40 group-hover:bg-blue-500/10"
 : "border-black/10 bg-white group-hover:border-blue-500/40 group-hover:bg-blue-50"
 } ${isOpen ? "rotate-45" : "rotate-0"}`}
 >
 +
 </span>
 </div>
 </button>

 <AnimatePresence initial={false}>
 {isOpen && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: "auto" }}
 exit={{ opacity: 0, height: 0 }}
 transition={{ duration: 0.22 }}
 className="border-t border-theme px-4 py-4 sm:px-6 sm:py-5"
 >
 <p className={`text-[11px] leading-relaxed sm:text-sm ${mutedTextClass(dark)}`}>
 {item.answer}
 </p>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
 })}
 </div>
 </div>
 </section>
 );
}


function Footer({
 dark,
 siteSettings,
}: {
 dark: boolean;
 siteSettings: PublicSiteSettings | null;
}) {
 const contacts = siteSettings?.contacts;
 const branding = siteSettings?.branding;
 const logoLight = branding?.logoLight?.trim() || "/logo-light.webp";
 const logoDark = branding?.logoDark?.trim() || "/logo-dark.webp";
 const storeName = branding?.storeName?.trim() || "Neontech";

 return (
 <footer
 className={`hidden rounded-[32px] border p-10 transition-all duration-700 sm:block ${panelClass(
 dark
 )}`}
 >
 <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
 <div>
 <Link
 href="/"
 className="relative flex h-12 w-[170px] items-center justify-start overflow-hidden"
 >
 <Image
 src={dark ? logoLight : logoDark}
 alt={storeName}
 width={170}
 height={48}
 className="h-auto max-h-10 w-auto object-contain"
 />
 </Link>

 <div className="mt-8 space-y-6">
 <FooterContact
 icon="☎"
 title={contacts?.phone || footerData.contacts.phone}
 text={contacts?.phoneText || footerData.contacts.phoneText}
 dark={dark}
 />

 <FooterContact
 icon="✈"
 title={contacts?.telegram || footerData.contacts.telegram}
 text={contacts?.telegramText || footerData.contacts.telegramText}
 dark={dark}
 />

 <FooterContact
 icon="✉"
 title={contacts?.email || footerData.contacts.email}
 text={contacts?.emailText || footerData.contacts.emailText}
 dark={dark}
 />
 </div>

 <div
 className={`mt-8 border-t pt-7 ${
 dark ? "border-white/10" : "border-black/10"
 }`}
 >
 <h3 className="text-xl font-bold">Будьте в курсе новинок</h3>

 <p
 className={`mt-3 max-w-[360px] text-sm leading-relaxed ${mutedTextClass(
 dark
 )}`}
 >
 Подпишитесь и узнавайте первыми о новых поступлениях и акциях.
 </p>

 <div
 className={`mt-5 flex h-14 overflow-hidden rounded-xl border transition-all duration-700 ${
 dark ? "border-white/10 bg-black/20" : "border-black/10 bg-white"
 }`}
 >
 <input
 placeholder="Ваш e-mail"
 className={`min-w-0 flex-1 bg-transparent px-5 outline-none ${
 dark
 ? "text-white placeholder:text-white/35"
 : "text-black placeholder:text-black/35"
 }`}
 />

 <button className="w-16 bg-blue-600 text-2xl text-white transition-colors hover:bg-blue-500 flex items-center justify-center">
 <ArrowIcon width={18} height={18} />
 </button>
 </div>
 </div>
 </div>

 {footerData.columns.map((column) => (
 <FooterColumn
 key={column.title}
 title={column.title}
 items={column.links}
 />
 ))}
 </div>

 <div className="mt-10 grid gap-5 lg:grid-cols-3">
 {footerData.socials.map((item) => (
 <button
 key={item}
 className={`rounded-xl border px-10 py-4 text-blue-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-500/10 ${
 dark
 ? "border-blue-500/30 bg-white/[0.02]"
 : "border-blue-500/30 bg-white"
 }`}
 >
 {item}
 </button>
 ))}
 </div>

 <div
 className={`mt-10 flex flex-col gap-6 border-t pt-8 text-sm lg:flex-row lg:items-center lg:justify-between ${
 dark ? "border-white/10 text-white/45" : "border-black/10 text-black/45"
 }`}
 >
 <div>© 2024 {storeName}. Все права защищены.</div>

 <div className="flex flex-wrap gap-6">
 {footerData.legal.map((item) => (
 <Link
 key={item}
 href="#"
 className="transition-colors hover:text-blue-500"
 >
 {item}
 </Link>
 ))}
 </div>

 <div className="flex flex-wrap items-center gap-5 text-lg font-bold opacity-70">
 {footerData.payments.map((item) => (
 <span key={item}>{item}</span>
 ))}
 </div>
 </div>
 </footer>
 );
}

function FooterContact({
 icon,
 title,
 text,
 dark,
}: {
 icon: string;
 title: string;
 text: string;
 dark: boolean;
}) {
 return (
 <div className="flex items-start gap-4">
 <div
 className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-blue-500 transition-all duration-700 ${
 dark ? "bg-blue-500/10" : "bg-blue-50"
 }`}
 >
 {icon}
 </div>

 <div>
 <div className="font-semibold">{title}</div>
 <div className={`mt-0.5 text-xs leading-snug sm:mt-1 sm:text-sm ${mutedTextClass(dark)}`}>{text}</div>
 </div>
 </div>
 );
}

function FooterColumn({
 title,
 items,
}: {
 title: string;
 items: string[] | { label: string; href: string }[];
}) {
 return (
 <div>
 <h3 className="text-xl font-bold">{title}</h3>

 <div className="mt-6 flex flex-col gap-4 opacity-60">
 {items.map((item) => {
 const label = typeof item === "string" ? item : item.label;
 const href = typeof item === "string" ? "#" : item.href;

 return (
 <Link
 key={label}
 href={href}
 className="transition-colors hover:text-blue-500"
 >
 {label}
 </Link>
 );
 })}
 </div>
 </div>
 );
}
