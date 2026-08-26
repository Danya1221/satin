"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ArrowIcon } from "@/components/arrow-icon";

type FaqQuestion = {
 id: string;
 question: string;
 answer: string;
 image: string;
};

type FaqCategory = {
 id: string;
 slug: string;
 eyebrow: string;
 title: string;
 icon: string;
 image: string;
 description: string;
 questions: FaqQuestion[];
};

type FaqHighlight = {
 id: string;
 eyebrow: string;
 title: string;
 description: string;
 image: string;
};

type FaqHeader = {
 title: string;
 subtitle: string;
 showSupportButton: boolean;
 supportButtonText: string;
 supportButtonHref: string;
 showCatalogButton: boolean;
 catalogButtonText: string;
 catalogButtonHref: string;
};

const defaultHeader: FaqHeader = {
 title: "Частые вопросы",
 subtitle: "Коротко объясняем, как работает выбор техники, корзина, доставка, оплата и связь с менеджером.",
 showSupportButton: true,
 supportButtonText: "Написать в поддержку",
 supportButtonHref: "/help",
 showCatalogButton: true,
 catalogButtonText: "Перейти в каталог",
 catalogButtonHref: "/catalog",
};

const emptyCategory: FaqCategory = {
 id: "",
 slug: "",
 eyebrow: "",
 title: "Вопросы скоро появятся",
 icon: "?",
 image: "",
 description: "Мы готовим ответы про заказ, доставку, оплату и гарантию.",
 questions: [],
};

export default function FaqPage() {
 const [faqCategories, setFaqCategories] = useState<FaqCategory[]>([]);
 const [faqHighlights, setFaqHighlights] = useState<FaqHighlight[]>([]);
 const [faqHeader, setFaqHeader] = useState<FaqHeader>(defaultHeader);
 const [activeCategoryId, setActiveCategoryId] = useState("");
 const [faqLoading, setFaqLoading] = useState(true);
 const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
 const activeQuestionRef = useRef<HTMLElement | null>(null);
 const questionsAreaRef = useRef<HTMLDivElement | null>(null);
 const [activeQuestionHeight, setActiveQuestionHeight] = useState(0);

 const activeCategory = useMemo(
 () =>
 faqCategories.find((category) => category.id === activeCategoryId) ??
 faqCategories[0] ??
 emptyCategory,
 [activeCategoryId, faqCategories],
 );

 useEffect(() => {
 let mounted = true;

 fetch("/api/faq", { cache: "no-store" })
 .then((response) => (response.ok ? response.json() : Promise.reject()))
 .then((payload: { categories?: FaqCategory[]; highlights?: FaqHighlight[]; header?: FaqHeader }) => {
 if (!mounted) return;

 const categories = Array.isArray(payload.categories)
 ? payload.categories
 : [];

 setFaqCategories(categories);
 setFaqHighlights(Array.isArray(payload.highlights) ? payload.highlights : []);
 setFaqHeader(payload.header ?? defaultHeader);
 setActiveCategoryId((current) =>
 categories.some((category) => category.id === current)
 ? current
 : categories[0]?.id ?? "",
 );
 })
 .catch(() => {
 if (!mounted) return;
 setFaqCategories([]);
 setActiveCategoryId("");
 })
 .finally(() => {
 if (mounted) setFaqLoading(false);
 });

 return () => {
 mounted = false;
 };
 }, []);

 const selectedQuestion =
 activeQuestion === null ? null : activeCategory.questions[activeQuestion] ?? null;

 useEffect(() => {
 if (!selectedQuestion || !activeQuestionRef.current) {
 setActiveQuestionHeight(0);
 return;
 }

 const element = activeQuestionRef.current;

 function updateHeight() {
 setActiveQuestionHeight(element.getBoundingClientRect().height);
 }

 updateHeight();

 const observer = new ResizeObserver(updateHeight);
 observer.observe(element);

 window.addEventListener("resize", updateHeight);

 return () => {
 observer.disconnect();
 window.removeEventListener("resize", updateHeight);
 };
 }, [selectedQuestion]);

 useEffect(() => {
 if (!selectedQuestion) {
 return;
 }

 function handleKeyDown(event: KeyboardEvent) {
 if (event.key === "Escape") {
 setActiveQuestion(null);
 }
 }

 document.addEventListener("keydown", handleKeyDown);

 return () => {
 document.removeEventListener("keydown", handleKeyDown);
 };
 }, [selectedQuestion]);

 function toggleQuestion(index: number) {
 setActiveQuestion((current) => (current === index ? null : index));
 }

 function selectCategory(categoryId: string) {
 setActiveCategoryId(categoryId);
 setActiveQuestion(null);
 }

 return (
 <main className="min-h-screen bg-page px-2 py-2.5 text-main transition-colors duration-700 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
 <div className="mx-auto max-w-[1440px]">
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
 <span className="font-medium text-main">FAQ</span>
 </nav>

 <div className="mt-2 border-b border-theme pb-4 sm:mt-5 sm:pb-6 lg:flex lg:items-end lg:justify-between lg:gap-8">
 <div>
 <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-500 sm:text-xs lg:hidden">
 Помощь
 </div>
 <h1 className="mt-1 max-w-[820px] text-[28px] font-bold leading-[1.05] tracking-[-0.05em] sm:text-4xl lg:mt-0 lg:text-6xl">
 {faqHeader.title}
 </h1>
 <p className="mt-2 max-w-[720px] text-xs leading-relaxed text-muted sm:text-sm lg:mt-3 lg:text-lg">
 {faqHeader.subtitle}
 </p>
 </div>

 <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:mt-0 lg:gap-3">
 {faqHeader.showSupportButton ? (
 <Link href={faqHeader.supportButtonHref} className="flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-3 py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-500 sm:min-h-12 sm:px-5 sm:text-sm lg:rounded-2xl lg:px-6 lg:py-4">
 {faqHeader.supportButtonText}
 </Link>
 ) : null}
 {faqHeader.showCatalogButton ? (
 <Link href={faqHeader.catalogButtonHref} className="flex min-h-10 items-center justify-center rounded-xl border border-theme px-3 py-2.5 text-center text-xs font-semibold transition-colors hover:border-blue-500/45 hover:text-blue-500 sm:min-h-12 sm:px-5 sm:text-sm lg:rounded-2xl lg:px-6 lg:py-4">
 {faqHeader.catalogButtonText}
 </Link>
 ) : null}
 </div>
 </div>
 </section>

 {faqLoading ? (
 <div className="mt-4 rounded-2xl border border-theme bg-card p-5 text-sm text-muted sm:mt-6 sm:rounded-3xl sm:p-8">
 Загружаем FAQ…
 </div>
 ) : null}

 {!faqLoading && faqCategories.length === 0 ? (
 <div className="mt-4 rounded-2xl border border-dashed border-theme bg-card p-5 sm:mt-6 sm:rounded-3xl sm:p-8">
 <div className="max-w-[720px]">
 <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">FAQ</div>
 <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">Вопросы скоро появятся</h2>
 <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
 Мы готовим ответы про заказ, доставку, оплату и гарантию. Если нужен ответ сейчас — напишите в поддержку.
 </p>
 <Link href="/help" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
 Написать в поддержку
 </Link>
 </div>
 </div>
 ) : null}

 {faqCategories.length > 0 ? (
 <section className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-[360px_1fr] lg:gap-7">
 <aside className="-mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 pb-2 sm:-mx-4 sm:gap-3 sm:px-4 lg:mx-0 lg:grid lg:h-fit lg:gap-3 lg:overflow-visible lg:px-0 lg:pb-0 lg:sticky lg:top-6">
 {faqCategories.map((category) => {
 const isActive = category.id === activeCategoryId;

 return (
 <button
 key={category.id}
 type="button"
 onClick={() => selectCategory(category.id)}
 className={`relative flex min-w-[104px] snap-start flex-col items-center rounded-2xl border px-2 py-3 text-center transition-colors sm:min-w-[122px] sm:px-3 sm:py-4 lg:min-w-0 lg:flex-row lg:items-start lg:gap-4 lg:rounded-[26px] lg:p-5 lg:text-left ${
 isActive ? "border-blue-500/55 bg-blue-soft" : "card"
 }`}
 >
 <div
 className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-base font-bold sm:h-14 sm:w-14 lg:h-12 lg:w-12 ${
 isActive ? "bg-blue-600 text-white" : "bg-blue-soft text-blue-500"
 }`}
 >
 {category.image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={category.image} alt="" className="h-full w-full object-contain p-1.5" />
 ) : (
 category.icon
 )}
 </div>

 <div className="min-w-0 lg:flex-1">
 <div className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-blue-500 lg:block">
 {category.eyebrow}
 </div>
 <h2 className="mt-2 line-clamp-2 text-xs font-bold leading-tight sm:text-sm lg:mt-1 lg:text-lg">
 {category.title}
 </h2>
 <p className="mt-2 hidden text-sm leading-relaxed text-muted lg:block">
 {category.description}
 </p>
 </div>

 {isActive ? <span className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-blue-600 lg:hidden" /> : null}
 </button>
 );
 })}
 </aside>

 <div className="card overflow-hidden rounded-[22px] sm:rounded-[28px] lg:rounded-[34px]">
 <div className="border-b border-theme p-4 sm:p-6 lg:p-9">
 <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-500 sm:text-xs lg:text-sm lg:tracking-[0.22em]">
 {activeCategory.eyebrow}
 </div>

 <div className="mt-1 flex items-start justify-between gap-3 sm:mt-2 lg:mt-3 lg:items-end">
 <div className="min-w-0">
 <h2 className="text-[22px] font-bold leading-tight tracking-[-0.04em] sm:text-3xl lg:text-4xl">
 {activeCategory.title}
 </h2>
 <p className="mt-1.5 line-clamp-2 max-w-[640px] text-xs leading-relaxed text-muted sm:text-sm lg:mt-3 lg:line-clamp-none lg:text-base">
 {activeCategory.description}
 </p>
 </div>

 <div className="shrink-0 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-blue-500 sm:px-3 sm:py-2 sm:text-xs lg:rounded-2xl lg:px-5 lg:py-4 lg:text-sm">
 {activeCategory.questions.length}
 </div>
 </div>
 </div>

 {/* Mobile and compact-tablet accordion */}
 <div className="grid gap-2 p-3 sm:gap-3 sm:p-5 lg:hidden">
 {activeCategory.questions.map((item, index) => {
 const isOpen = activeQuestion === index;

 return (
 <article key={item.id || item.question} className={`overflow-hidden rounded-2xl border bg-[var(--card)] transition-colors ${isOpen ? "border-blue-500/40" : "border-theme"}`}>
 <button
 type="button"
 onClick={() => toggleQuestion(index)}
 className="flex w-full items-start justify-between gap-3 px-3.5 py-3 text-left sm:px-4 sm:py-4"
 >
 <span className="min-w-0 break-words text-sm font-bold leading-snug tracking-[-0.02em] sm:text-base">
 {item.question}
 </span>
 <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-lg font-medium ${isOpen ? "bg-blue-600 text-white" : "bg-blue-soft text-blue-500"}`}>
 {isOpen ? "×" : "+"}
 </span>
 </button>

 {isOpen ? (
 <div className="border-t border-theme px-3.5 pb-4 pt-3 sm:px-4 sm:pb-5">
 <p className="break-words text-xs leading-relaxed text-muted sm:text-sm">
 {item.answer}
 </p>
 {item.image ? (
 <div className="mt-3 overflow-hidden rounded-xl border border-theme bg-white p-2">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={item.image} alt="" className="max-h-[300px] w-full object-contain" />
 </div>
 ) : null}
 </div>
 ) : null}
 </article>
 );
 })}
 </div>

 {/* Desktop question layout */}
 <div
 ref={questionsAreaRef}
 className="relative hidden p-5 pb-8 lg:block lg:p-7 lg:pb-10"
 style={{
 minHeight: selectedQuestion
 ? `${Math.max(activeQuestionHeight + 48, 260)}px`
 : undefined,
 }}
 >
 {selectedQuestion && (
 <article
 ref={activeQuestionRef}
 role="button"
 tabIndex={0}
 onClick={() => setActiveQuestion(null)}
 onKeyDown={(event) => {
 if (event.key === "Enter" || event.key === " ") {
 event.preventDefault();
 setActiveQuestion(null);
 }
 }}
 className="absolute left-7 right-7 top-7 z-30 cursor-pointer rounded-[24px] border border-blue-500/45 bg-[var(--card)] p-6 ring-1 ring-blue-500/10"
 >
 <div className="flex items-start justify-between gap-4">
 <h3 className="min-w-0 max-w-[920px] break-words text-xl font-bold leading-snug tracking-[-0.03em]">
 {selectedQuestion.question}
 </h3>
 <button type="button" onClick={(event) => { event.stopPropagation(); setActiveQuestion(null); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-soft text-lg font-medium text-blue-500 transition-colors hover:bg-blue-600 hover:text-white" aria-label="Свернуть вопрос">×</button>
 </div>
 <p className="mt-4 max-w-[860px] break-words text-base leading-relaxed text-muted">{selectedQuestion.answer}</p>
 {selectedQuestion.image ? (
 <div className="mt-5 overflow-hidden rounded-2xl border border-theme bg-white">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={selectedQuestion.image} alt="" className="max-h-[420px] w-full object-contain" />
 </div>
 ) : null}
 </article>
 )}

 <div className="relative z-10 grid gap-3">
 {activeCategory.questions.map((item, index) => {
 const isActiveRow = activeQuestion === index;
 return (
 <button key={item.id || item.question} type="button" onClick={() => toggleQuestion(index)} className={`group relative z-0 flex w-full items-start justify-between gap-4 rounded-[22px] border bg-[var(--card)] px-5 py-4 text-left transition-colors duration-300 hover:border-blue-500/40 hover:bg-blue-soft ${isActiveRow ? "border-blue-500/35" : "border-theme"}`}>
 <span className="min-w-0 break-words text-lg font-bold leading-snug tracking-[-0.02em]">{item.question}</span>
 <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-lg font-medium transition-colors ${isActiveRow ? "border-blue-600 bg-blue-600 text-white" : "border-theme bg-[var(--card)] text-blue-500 group-hover:border-blue-500/40 group-hover:bg-blue-600 group-hover:text-white"}`}>{isActiveRow ? "×" : "+"}</span>
 </button>
 );
 })}
 </div>
 </div>
 </div>
 </section>
 ) : null}

 {faqHighlights.length > 0 ? (
 <section className="-mx-2 mt-4 flex snap-x gap-3 overflow-x-auto px-2 pb-2 sm:-mx-4 sm:mt-6 sm:px-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0">
 {faqHighlights.map((item) => (
 <div key={item.id} className="card min-w-[260px] snap-start overflow-hidden rounded-[22px] sm:min-w-[320px] lg:min-w-0 lg:rounded-[28px]">
 {item.image ? (
 <div className="flex h-32 items-center justify-center border-b border-theme bg-white p-3 sm:h-40 lg:h-44 lg:p-4">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={item.image} alt="" className="h-full w-full object-contain" />
 </div>
 ) : null}
 <div className="p-4 sm:p-5 lg:p-7">
 <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-500 sm:text-xs lg:tracking-[0.22em]">{item.eyebrow}</div>
 <h3 className="mt-2 text-lg font-bold tracking-[-0.04em] sm:text-xl lg:mt-4 lg:text-2xl">{item.title}</h3>
 <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted sm:text-sm lg:mt-3 lg:line-clamp-none">{item.description}</p>
 </div>
 </div>
 ))}
 </section>
 ) : null}
 </div>
 </main>
 );
}
