import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export default function NotFound() { return <main className="storefront storefront-page"><div className="storefront-shell"><SiteHeader /><section className="store-section store-document"><span className="store-eyebrow">404 · Страница не найдена</span><h1>Давайте найдём нужное</h1><p>Возможно, адрес изменился или товар больше не доступен. В каталоге — все актуальные категории и модели.</p><div className="flex flex-wrap gap-4 mt-6"><Link className="store-button" href="/catalog">Открыть каталог</Link><Link className="store-text-link" href="/help">Связаться с поддержкой</Link></div></section><SiteFooter /></div></main>; }
