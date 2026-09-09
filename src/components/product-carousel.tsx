"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { StoreProductCard, type StoreProduct } from "@/components/store-product-card";
import { StoreIcon } from "@/components/store-icon";

type ProductCarouselProps = { title: string; subtitle?: string; products: StoreProduct[]; actionLabel?: string; actionHref?: string; actionOnClick?: () => void; dark?: boolean };

export function ProductCarousel({ title, subtitle, products, actionLabel = "Смотреть все", actionHref = "/catalog", actionOnClick }: ProductCarouselProps) {
  const slider = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; scroll: number } | null>(null);
  const dragged = useRef(false);
  const [bounds, setBounds] = useState({ prev: false, next: false });
  const label = actionLabel.replace(/\s*[→➜➡]+\s*$/, "").trim();
  function update() {
    const element = slider.current;
    if (element) setBounds({ prev: element.scrollLeft > 2, next: element.scrollLeft < element.scrollWidth - element.clientWidth - 2 });
  }
  useEffect(() => {
    const element = slider.current;
    if (!element) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [products.length]);
  function scroll(direction: number) {
    const element = slider.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * .85, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || !slider.current) return;
    drag.current = { x: event.clientX, scroll: slider.current.scrollLeft }; dragged.current = false;
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !slider.current) return;
    const distance = drag.current.x - event.clientX;
    if (Math.abs(distance) > 6) { dragged.current = true; slider.current.scrollLeft = drag.current.scroll + distance; }
  }
  function click(event: MouseEvent<HTMLDivElement>) { if (dragged.current) { event.preventDefault(); event.stopPropagation(); dragged.current = false; } }
  if (!products.length) return null;
  return <section className="store-section" aria-label={title}>
    <div className="store-section-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      <div className="store-section-actions">
        {label && (actionOnClick ? <button type="button" className="store-text-link" onClick={actionOnClick}>{label}<StoreIcon name="arrow" /></button> : <Link className="store-text-link" href={actionHref}>{label}<StoreIcon name="arrow" /></Link>)}
        <button type="button" className="store-round-button" aria-label="Предыдущие товары" disabled={!bounds.prev} onClick={() => scroll(-1)}><StoreIcon name="back" /></button>
        <button type="button" className="store-round-button" aria-label="Следующие товары" disabled={!bounds.next} onClick={() => scroll(1)}><StoreIcon name="arrow" /></button>
      </div>
    </div>
    <div ref={slider} className="store-carousel" onScroll={update} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onClickCapture={click}>
      {products.map(product => <StoreProductCard key={product.slug} product={product} />)}
    </div>
  </section>;
}
