"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { usePageContent } from "@/components/page-content";
import { safeStoreHref } from "@/lib/route-paths";
type Question = { id: string; question: string; answer: string; image: string };
type Category = { id: string; title: string; description: string; image: string; questions: Question[] };
type Highlight = { id: string; title: string; description: string; image: string };
export default function FaqPage() {
  const content = usePageContent("faq");
  const [categories, setCategories] = useState<Category[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [active, setActive] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { let mounted = true; setLoading(true); setFailed(false); fetch("/api/faq", { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error(); const data = await r.json(); if (mounted) { setCategories(data.categories); setHighlights(data.highlights); } }).catch(() => { if (mounted) setFailed(true); }).finally(() => { if (mounted) setLoading(false); }); return () => { mounted = false; }; }, [attempt]);
  const settings = content.settings("faq-content");
  const header = content.settings("faq-header");
  const visible = categories.filter(category => !active || active === category.id).map(category => ({ ...category, questions: category.questions.filter(item => `${item.question} ${item.answer}`.toLocaleLowerCase("ru").includes(query.toLocaleLowerCase("ru"))) }));
  return <main className="storefront storefront-page"><div className="storefront-shell"><SiteHeader /><section className="store-document store-section" hidden={!content.visible("faq-header")}><span className="store-eyebrow">Помощь с покупкой</span><h1>{content.text("faq-header", "title", "Частые вопросы")}</h1><p>{content.text("faq-header", "subtitle", "Всё о выборе техники, покупке и поддержке.")}</p><div className="flex flex-wrap gap-4 mt-5">{header.showSupportButton !== false && <Link className="store-button" href={safeStoreHref(header.supportButtonHref, "/help")}>{content.text("faq-header", "supportButtonText", "Написать в поддержку")}</Link>}{header.showCatalogButton !== false && <Link className="store-text-link" href={safeStoreHref(header.catalogButtonHref, "/catalog")}>{content.text("faq-header", "catalogButtonText", "Открыть каталог")}</Link>}</div></section>
  <section className="store-document store-section" hidden={!content.visible("faq-content")}><label className="grid gap-3">Найти ответ<input className="rounded-xl border border-theme p-4" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Доставка, оплата, возврат…" /></label>{settings.layout !== "list" && <div className="flex flex-wrap gap-2 my-6" role="group" aria-label="Раздел вопросов">{[{ id: "", title: "Все вопросы" }, ...categories].map(category => <button type="button" className={active === category.id ? "store-button" : "store-button-secondary"} key={category.id} onClick={() => setActive(category.id)} aria-pressed={active === category.id}>{category.title}</button>)}</div>}
  {loading ? <p role="status">Загружаем ответы…</p> : failed ? <p role="alert">Не удалось загрузить ответы. <button className="store-text-link" onClick={() => setAttempt(x => x + 1)}>Повторить</button></p> : <>{visible.filter(category => category.questions.length).map(category => <section key={category.id}><h2>{category.title}</h2>{category.description && <p>{category.description}</p>}{category.questions.map(item => <details className="store-faq-item" key={item.id}><summary>{item.question}</summary><p>{item.answer}</p>{settings.showImages !== false && item.image && <img src={item.image} alt="" loading="lazy" />}</details>)}</section>)}{!visible.some(category => category.questions.length) && <p>Подходящих ответов пока нет. <Link href="/help">Задайте вопрос поддержке</Link> или прочитайте разделы <Link href="/delivery">доставки</Link>, <Link href="/payment">оплаты</Link> и <Link href="/returns">возврата</Link>.</p>}</>}
  {settings.showBenefits !== false && highlights.length > 0 && <div className="store-info-cards">{highlights.map(item => <article key={item.id} className="store-info-card">{settings.showImages !== false && item.image && <img src={item.image} alt="" loading="lazy" className="h-32 w-full object-contain mb-4" />}<h2>{item.title}</h2><p>{item.description}</p></article>)}</div>}</section><SiteFooter /></div></main>;
}
