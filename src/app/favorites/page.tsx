"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StoreProductCard, type StoreProduct } from "@/components/store-product-card";
export default function FavoritesPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const read = () => { try { const saved = JSON.parse(localStorage.getItem("netizen-favorite-slugs") || "[]"); setSlugs(Array.isArray(saved) ? saved.filter((value): value is string => typeof value === "string") : []); } catch { setSlugs([]); } };
    read(); window.addEventListener("netizen-favorites-updated", read); window.addEventListener("storage", read);
    fetch("/api/home", { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error(); const data = await r.json(); if (active) setProducts(data.products || []); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; window.removeEventListener("netizen-favorites-updated", read); window.removeEventListener("storage", read); };
  }, []);
  function remove(slug: string) { const next = slugs.filter(value => value !== slug); setSlugs(next); try { localStorage.setItem("netizen-favorite-slugs", JSON.stringify(next)); localStorage.setItem("netizen-favorites-count", String(next.length)); } catch {} window.dispatchEvent(new Event("netizen-favorites-updated")); }
  const favorites = products.filter(product => slugs.includes(product.slug));
  return <main className="storefront storefront-page"><div className="storefront-shell"><SiteHeader /><section className="store-section"><div className="store-document"><span className="store-eyebrow">Ваш выбор</span><h1>Избранное</h1><p>Модели, к которым хочется вернуться. Сохранённые на этом устройстве товары доступны без входа.</p></div>{loading ? <p role="status">Загружаем товары…</p> : error ? <p role="alert">Не удалось загрузить каталог. Обновите страницу.</p> : favorites.length ? <div className="store-catalog-grid mt-8">{favorites.map(product => <div key={product.slug}><StoreProductCard product={product} /><button type="button" className="store-text-link mt-4" onClick={() => remove(product.slug)}>Убрать из избранного</button></div>)}</div> : <div className="store-info-card mt-8"><h2 className="text-2xl font-bold">Сохраните то, что нравится</h2><p className="my-4">Нажмите «В избранное» в карточке товара.</p><Link className="store-button" href="/catalog">Выбрать в каталоге</Link></div>}</section><SiteFooter /></div></main>;
}
