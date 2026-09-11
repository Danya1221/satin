"use client";
import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeModule } from "@/app/home-client";
import { usePageContent } from "@/components/page-content";
export default function NewPage() {
  const content = usePageContent("new");
  const [visibleCount,setVisibleCount] = useState(24);
  const arrivals = content.data?.products?.filter(p=>p.isNew) || [];
  return <main className="storefront storefront-page"><div className="storefront-shell"><SiteHeader /><div className="store-document store-section"><span className="store-eyebrow">Свежий взгляд на привычное</span><h1>Новые поступления</h1></div>{content.data ? <>{content.data.pageBlocks?.filter(block => block.enabled).sort((a,b) => a.sortOrder - b.sortOrder).map(block => <HomeModule key={block.id} block={block.type === "new-arrivals" ? {...block, settings:{...block.settings,limit:visibleCount,showButton:false}} : block} data={content.data!} />)}{content.visible("new-arrivals") && arrivals.length > visibleCount && <div className="store-section"><button className="store-button" onClick={()=>setVisibleCount(n=>n+24)}>Показать ещё · осталось {arrivals.length-visibleCount}</button></div>}{content.visible("new-arrivals") && !content.data.products?.some(product => product.isNew) && <div className="store-info-card"><h2 className="text-2xl font-bold">Новинок пока нет</h2><p className="my-4">Загляните в каталог — там все доступные модели.</p><Link className="store-text-link" href="/catalog">Открыть каталог →</Link></div>}</> : content.failed ? <p role="alert" className="store-section">Не удалось загрузить страницу. <button className="store-text-link" onClick={content.retry}>Повторить</button></p> : <p role="status" className="store-section">Загружаем новые поступления…</p>}<SiteFooter /></div></main>;
}
