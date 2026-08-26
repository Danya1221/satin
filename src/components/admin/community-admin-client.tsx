"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Product = { id: string; name: string; brand: string; slug: string };
type Customer = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
};

type Review = {
  id: string;
  rating: number;
  text: string;
  images: string[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  isVisible: boolean;
  createdAt: string;
  product: Product;
  customer: Customer;
};

type Question = {
  id: string;
  authorName: string;
  authorEmail: string;
  text: string;
  answer: string;
  answeredAt: string | null;
  isVisible: boolean;
  createdAt: string;
  product: Product;
  customer: Customer | null;
};

type Tab = "questions" | "reviews";

export function CommunityAdminClient({
  initialTab = "questions",
  hideTabs = false,
}: {
  initialTab?: Tab;
  hideTabs?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // При переходе между ?section=reviews и ?section=questions Next.js может
  // сохранить экземпляр клиентского компонента. Синхронизируем внутреннюю
  // вкладку с серверным параметром, чтобы не оставаться на старом разделе.
  useEffect(() => {
    setTab(initialTab);
    setSearch("");
    setMessage("");
  }, [initialTab]);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/community?entity=${tab}&search=${encodeURIComponent(search)}`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Ошибка загрузки.");
      setReviews(Array.isArray(payload.reviews) ? payload.reviews : []);
      setQuestions(Array.isArray(payload.questions) ? payload.questions : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка загрузки.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function patch(body: Record<string, unknown>) {
    setMessage("");
    const response = await fetch("/api/admin/community", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Не удалось сохранить.");
      return;
    }
    setMessage("Сохранено.");
    await load();
  }

  async function remove(entity: "review" | "question", id: string) {
    if (!window.confirm("Удалить запись без возможности восстановления?")) return;
    const response = await fetch(
      `/api/admin/community?entity=${entity}&id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      setMessage("Не удалось удалить.");
      return;
    }
    setMessage("Удалено.");
    await load();
  }

  const unansweredCount = useMemo(
    () => questions.filter((item) => !item.answer.trim()).length,
    [questions],
  );

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
        {!hideTabs ? (
          <div className="flex gap-2">
            <button
              type="button"
              onPointerDown={() => setTab("questions")}
              onClick={() => setTab("questions")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                tab === "questions" ? "bg-blue-600 text-white" : "border border-white/10 bg-black/20"
              }`}
            >
              Вопросы {tab === "questions" && unansweredCount ? `· без ответа ${unansweredCount}` : ""}
            </button>
            <button
              type="button"
              onPointerDown={() => setTab("reviews")}
              onClick={() => setTab("reviews")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                tab === "reviews" ? "bg-blue-600 text-white" : "border border-white/10 bg-black/20"
              }`}
            >
              Отзывы
            </button>
          </div>
        ) : (
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">
              {tab === "reviews" ? "Отзывы покупателей" : "Вопросы покупателей"}
            </div>
            <div className="mt-1 text-sm text-white/45">
              {tab === "reviews"
                ? "Модерация отзывов и фотографий покупателей."
                : `Ответы на вопросы о товарах${unansweredCount ? ` · без ответа ${unansweredCount}` : ""}.`}
            </div>
          </div>
        )}

        <div className="flex w-full gap-2 sm:max-w-[520px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void load();
            }}
            placeholder="Поиск по товару или бренду"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-blue-500/50"
          />
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:border-blue-500/40"
          >
            Найти
          </button>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 rounded-[28px] border border-white/10 p-8 text-white/50">Загрузка…</div>
      ) : tab === "questions" ? (
        <div className="mt-5 grid gap-4">
          {questions.map((item) => (
            <QuestionCard
              key={item.id}
              item={item}
              onChange={(patchValue) =>
                setQuestions((current) =>
                  current.map((value) =>
                    value.id === item.id ? { ...value, ...patchValue } : value,
                  ),
                )
              }
              onSave={() =>
                void patch({
                  entity: "question",
                  id: item.id,
                  answer: item.answer,
                  isVisible: item.isVisible,
                })
              }
              onDelete={() => void remove("question", item.id)}
            />
          ))}
          {questions.length === 0 ? <Empty text="Вопросов не найдено." /> : null}
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {reviews.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              onVisibility={() =>
                void patch({
                  entity: "review",
                  id: item.id,
                  isVisible: !item.isVisible,
                })
              }
              onDelete={() => void remove("review", item.id)}
            />
          ))}
          {reviews.length === 0 ? <Empty text="Отзывов не найдено." /> : null}
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  item,
  onChange,
  onSave,
  onDelete,
}: {
  item: Question;
  onChange: (patch: Partial<Question>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/product/${item.product.slug}`} className="font-bold hover:text-blue-400">
            {item.product.brand} · {item.product.name}
          </Link>
          <div className="mt-1 text-xs text-white/45">
            {item.authorName || "Покупатель"} · {new Date(item.createdAt).toLocaleString("ru-RU")}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ isVisible: !item.isVisible })}
          className={`rounded-xl border px-3 py-2 text-xs ${
            item.isVisible
              ? "border-green-500/30 bg-green-500/10 text-green-300"
              : "border-white/10 bg-black/20 text-white/50"
          }`}
        >
          {item.isVisible ? "Показывается" : "Скрыт"}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-400">Вопрос</div>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/80">{item.text}</p>
      </div>

      <label className="mt-4 grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
          Ответ магазина
        </span>
        <textarea
          value={item.answer}
          onChange={(event) => onChange({ answer: event.target.value })}
          rows={4}
          placeholder="Введите ответ покупателю"
          className="w-full resize-y rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-blue-500/50"
        />
      </label>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onSave} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500">
          Сохранить ответ
        </button>
        <button type="button" onClick={onDelete} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
          Удалить
        </button>
      </div>
    </article>
  );
}

function ReviewCard({
  item,
  onVisibility,
  onDelete,
}: {
  item: Review;
  onVisibility: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/product/${item.product.slug}`} className="font-bold hover:text-blue-400">
            {item.product.brand} · {item.product.name}
          </Link>
          <div className="mt-1 text-xs text-white/45">
            {[item.customer.name, item.customer.lastName].filter(Boolean).join(" ") || "Покупатель"}
            {" · "}
            {new Date(item.createdAt).toLocaleString("ru-RU")}
          </div>
        </div>
        <div className="text-amber-400">{"★".repeat(item.rating)}<span className="text-white/20">{"★".repeat(5 - item.rating)}</span></div>
      </div>

      <p className="mt-4 whitespace-pre-line rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-white/80">
        {item.text}
      </p>

      {item.images.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.images.map((image, index) => (
            <a key={`${item.id}-${index}`} href={image} target="_blank" rel="noreferrer" className="h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="h-full w-full object-cover" />
            </a>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-white/45">
          Полезен: {item.helpfulCount} · Не полезен: {item.unhelpfulCount}
          {item.verifiedPurchase ? " · Подтверждённая покупка" : ""}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onVisibility}
            className={`rounded-xl border px-4 py-2.5 text-sm ${
              item.isVisible
                ? "border-orange-500/30 bg-orange-500/10 text-orange-200"
                : "border-green-500/30 bg-green-500/10 text-green-200"
            }`}
          >
            {item.isVisible ? "Скрыть" : "Показать"}
          </button>
          <button type="button" onClick={onDelete} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            Удалить
          </button>
        </div>
      </div>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[26px] border border-dashed border-white/10 p-8 text-white/45">{text}</div>;
}
