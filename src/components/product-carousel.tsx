"use client";

import Link from "next/link";
import Image from 'next/image';
import {
 useRef,
 useState,
 type MouseEvent,
 type PointerEvent,
} from "react";
import { ArrowIcon } from "./arrow-icon";

type CarouselProduct = {
 slug: string;
 name: string;
 price: string;
 colors: string[];
 brand?: string;
 image?: string;
 images?: string[];
};

type ProductCarouselProps = {
 title: string;
 subtitle?: string;
 products: CarouselProduct[];
 actionLabel?: string;
 actionHref?: string;
 actionOnClick?: () => void;
 dark?: boolean;
};

function mutedTextClass(dark: boolean) {
 return dark ? "text-white/55" : "text-black/55";
}

function withoutTrailingArrow(label: string) {
 return label.replace(/\s*[→➜➡]+\s*$/, "").trim();
}

function getProductImage(product: CarouselProduct) {
 const images = [
 product.image,
 ...(Array.isArray(product.images) ? product.images : []),
 ]
 .map((image) => image?.trim())
 .filter(Boolean) as string[];

 return images[0] ?? "";
}

export function ProductCarousel({
 title,
 subtitle,
 products,
 actionLabel = "Помочь с выбором",
 actionHref = "/help",
 actionOnClick,
 dark = false,
}: ProductCarouselProps) {
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

 slider.scrollBy({
 left: distance,
 behavior: "smooth",
 });

 window.setTimeout(updateProgress, 350);
 }

 function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
 const slider = sliderRef.current;

 if (!slider) return;

 dragStartXRef.current = event.clientX;
 scrollStartRef.current = slider.scrollLeft;
 didDragRef.current = false;
 }

 function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
 const slider = sliderRef.current;

 if (!slider || dragStartXRef.current === null) return;

 const distance = dragStartXRef.current - event.clientX;

 if (Math.abs(distance) > 6) {
 didDragRef.current = true;
 }

 slider.scrollLeft = scrollStartRef.current + distance;
 updateProgress();
 }

 function handlePointerUp() {
 dragStartXRef.current = null;

 window.setTimeout(() => {
 didDragRef.current = false;
 }, 120);
 }

 function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
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
 <section className="mt-5 sm:mt-12">
 <div className="flex flex-col gap-2 sm:gap-4 md:flex-row md:items-end md:justify-between">
 <div>
 <h2 className="text-xl font-bold tracking-[-0.04em] sm:text-3xl">{title}</h2>

 {subtitle && (
 <p className={`mt-1 text-sm sm:mt-2 ${mutedTextClass(dark)}`}>
 {subtitle}
 </p>
 )}
 </div>

 <div className="flex items-center gap-2">
 {actionOnClick ? (
 <button
 type="button"
 onClick={actionOnClick}
 className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 >
 {withoutTrailingArrow(actionLabel)}
 </button>
 ) : (
 <Link
 href={actionHref}
 className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 >
 {withoutTrailingArrow(actionLabel)}
 </Link>
 )}

 <div className="hidden items-center gap-2 sm:flex">
 <button
 type="button"
 onClick={() => scrollProducts("prev")}
 className={`flex h-10 w-10 items-center justify-center rounded-xl border text-base font-medium transition-all duration-300 hover:-translate-y-0.5 ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 aria-label="Предыдущие товары"
 >
 <ArrowIcon width={12} height={12} direction="left" />
 </button>

 <button
 type="button"
 onClick={() => scrollProducts("next")}
 className={`flex h-10 w-10 items-center justify-center rounded-xl border text-base font-medium transition-all duration-300 hover:-translate-y-0.5 ${
 dark
 ? "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-500"
 : "border-black/10 bg-white text-black hover:border-blue-500/40 hover:bg-blue-50"
 }`}
 aria-label="Следующие товары"
 >
 <ArrowIcon width={12} height={12} direction="right" />
 </button>
 </div>
 </div>
 </div>

 <div
 ref={sliderRef}
 onScroll={updateProgress}
 onPointerDown={handlePointerDown}
 onPointerMove={handlePointerMove}
 onPointerUp={handlePointerUp}
 onPointerCancel={handlePointerUp}
 onPointerLeave={handlePointerUp}
 onClickCapture={handleClickCapture}
 className="mt-3 cursor-grab select-none overflow-x-auto px-0.5 py-1.5 active:cursor-grabbing sm:mt-5 sm:px-1 sm:py-2 [&::-webkit-scrollbar]:hidden"
 style={{
 scrollbarWidth: "none",
 msOverflowStyle: "none",
 }}
 >
 <div className="flex gap-3 sm:gap-5">
 {products.map((product) => (
 <div
 key={product.slug}
 className="w-[calc(25vw-10px)] min-w-[80px] shrink-0 sm:w-[210px] md:w-[240px] lg:w-[280px]"
 >
 <CarouselProductCard product={product} dark={dark} />
 </div>
 ))}
 </div>
 </div>

 {products.length > 4 && (
 <div className="mt-4 flex justify-center">
 <div
 className={`h-1.5 w-[150px] overflow-hidden rounded-full ${
 dark ? "bg-white/10" : "bg-black/10"
 }`}
 >
 <div
 className="h-full rounded-full bg-blue-600 transition-all duration-300"
 style={{
 width: `${Math.max(18, scrollProgress * 100)}%`,
 }}
 />
 </div>
 </div>
 )}
 </section>
 );
}

function CarouselProductCard({
 product,
 dark,
}: {
 product: CarouselProduct;
 dark: boolean;
}) {
 const image = getProductImage(product);

 return (
 <Link
 href={`/product/${product.slug}`}
 draggable={false}
 className={`group relative block h-full rounded-[14px] border p-1.5 transition-all duration-500 hover:-translate-y-1 sm:rounded-3xl sm:p-4 ${
 dark
 ? "border-white/10 bg-white/[0.035] hover:border-blue-500/35 hover:bg-white/[0.025]"
 : "border-black/10 bg-white hover:border-blue-500/35"
 }`}
 >
 <div
 className="photo-white-box flex aspect-square w-full items-center justify-center overflow-hidden rounded-[10px] bg-white text-slate-400 transition-colors duration-700 dark:bg-white sm:aspect-[4/5] sm:rounded-2xl"
 >
 {image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <Image quality={75} src={image}
 alt={product.name}
 draggable={false}
 className="h-full w-full object-contain p-1 transition-transform duration-700 group-hover:scale-105 sm:p-3"
 />
 ) : (
 <span className="text-[9px] sm:text-xs">Фото</span>
 )}
 </div>

 {/* Mobile mini layout */}
 <div className="px-0.5 pb-0.5 pt-1.5 sm:hidden">
 <h3 className={`line-clamp-2 text-[10px] font-bold leading-tight ${dark ? "text-white" : "text-black"}`}>
 {product.name}
 </h3>
 <p className="mt-0.5 text-[10px] font-semibold text-blue-600">
 {product.price}
 </p>
 <div className="mt-1.5 flex items-center justify-between gap-1">
 <div className="flex gap-1">
 {product.colors.slice(0, 3).map((color) => (
 <span
 key={color}
 className={`h-2.5 w-2.5 rounded-full border ${dark ? "border-white/15" : "border-black/10"}`}
 style={{ backgroundColor: color }}
 />
 ))}
 </div>
 <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-[10px] text-white transition-colors group-hover:bg-blue-500">
 <ArrowIcon width={12} height={12} />
 </div>
 </div>
 </div>

 {/* Desktop full layout */}
 <div className="hidden px-1 pb-1 pt-4 sm:block">
 {product.brand && (
 <div className={`truncate text-xs ${mutedTextClass(dark)}`}>
 {product.brand}
 </div>
 )}

 <h3 className="mt-1 line-clamp-2 text-base font-bold leading-tight lg:text-[15px]">
 {product.name}
 </h3>

 <p className={`mt-1 text-sm ${mutedTextClass(dark)}`}>
 {product.price}
 </p>

 <div className="mt-4 flex gap-2">
 {product.colors.map((color) => (
 <span
 key={color}
 className={`h-4 w-4 rounded-full border ${dark ? "border-white/15" : "border-black/10"}`}
 style={{ backgroundColor: color }}
 />
 ))}
 </div>

 <div className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-medium text-white transition-all duration-300 group-hover:bg-blue-500">
 Перейти
 </div>
 </div>
 </Link>
 );
}
