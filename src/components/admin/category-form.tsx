"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { AdminCategoryItem } from "@/lib/admin-categories-db";
import { ImageDropZone } from "@/components/admin/image-drop-zone";

const inputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-500/60";

const textareaClass =
  "min-h-[110px] w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-500/60";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ё/g, "e")
    .replace(/й/g, "i")
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

type Props = {
  category?: AdminCategoryItem;
};

export function CategoryForm({ category }: Props) {
  const router = useRouter();
  const isEditing = Boolean(category);

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState(category?.image ?? "");
  const [status, setStatus] = useState<string>(category?.status ?? "active");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 100));
  const [seoTitle, setSeoTitle] = useState(category?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(category?.seoDescription ?? "");

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const finalSlug = useMemo(() => slugify(slug || name), [name, slug]);
  const categoryUrl = finalSlug ? `/catalog/${finalSlug}` : "/catalog/category-slug";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!name.trim() || !finalSlug) {
        throw new Error("Заполните название и slug категории.");
      }

      const response = await fetch(
        isEditing ? `/api/admin/categories/${category?.id}` : "/api/admin/categories",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            slug: finalSlug,
            description,
            image,
            status,
            sortOrder,
            seoTitle,
            seoDescription,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Не удалось сохранить категорию.");
      }

      setSuccess(isEditing ? "Категория сохранена." : "Категория создана.");
      const nextCategory = payload?.category;

      if (nextCategory?.id) {
        router.replace(`/nz-console/categories/${nextCategory.id}`);
      } else {
        router.replace("/nz-console/categories");
      }

      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Неизвестная ошибка.");
    } finally {
      setLoading(false);
    }
  }

  async function handleHide() {
    if (!category) {
      return;
    }

    setError("");
    setSuccess("");
    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Не удалось скрыть категорию.");
      }

      setStatus("hidden");
      setSuccess("Категория скрыта с публичного сайта.");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Неизвестная ошибка.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <SectionTitle
            label="Категория"
            title="Основная информация"
            text="Эти поля сохраняются в PostgreSQL через Prisma и используются на публичном сайте. Макетные категории из файла больше не нужны."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Field label="Название для клиента">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => !slug && setSlug(slugify(name))}
                placeholder="Смартфоны"
                className={inputClass}
              />
            </Field>

            <Field label="Slug / URL">
              <input
                value={finalSlug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                placeholder="smartphones"
                className={inputClass}
              />
            </Field>

            <Field label="Статус">
              <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
                <option value="active">Активна</option>
                <option value="draft">Черновик</option>
                <option value="hidden">Скрыта</option>
              </select>
            </Field>

            <Field label="Порядок сортировки">
              <input
                type="number"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                placeholder="100"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Описание категории">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="iPhone, Samsung и другие смартфоны."
                className={textareaClass}
              />
            </Field>
          </div>

          <div className="mt-6">
            <ImageDropZone
              value={image}
              onChange={setImage}
              label="Фото категории"
              hint="Загрузите отдельное изображение для плитки категории на главной. Лучше предмет на прозрачном фоне."
              recommendedSize="900×900 px"
              recommendedFormat="PNG / WEBP, прозрачный фон"
            />
          </div>
        </section>

        <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <SectionTitle
            label="SEO"
            title="SEO категории"
            text="Title и description берутся с категории из БД и используются на странице /catalog/[category]."
          />

          <div className="mt-8 grid gap-5">
            <Field label="SEO title">
              <input
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                placeholder="Купить смартфоны — Neontech"
                className={inputClass}
              />
            </Field>

            <Field label="SEO description">
              <textarea
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                placeholder="Описание для поисковой выдачи."
                className={textareaClass}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-[34px] border border-blue-500/25 bg-blue-500/10 p-6 sm:p-8">
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            Связь с товарами
          </div>

          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
            Товары привязываются к slug категории
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-white/55">
            При смене slug API автоматически обновит categorySlug у связанных товаров, чтобы каталог не развалился. Категории со статусом «Скрыта» или «Черновик» не выводятся на публичной витрине.
          </p>
        </section>
      </div>

      <aside className="h-fit space-y-6 lg:sticky lg:top-6">
        <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            {isEditing ? "Сохранение" : "Создание"}
          </div>

          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
            {isEditing ? "Сохранить категорию" : "Создать категорию"}
          </h2>

          <div className="mt-6 grid gap-3">
            <InfoLine label="URL" value={categoryUrl} />
            <InfoLine label="Название" value={name || "—"} />
            <InfoLine label="Фото" value={image ? "Загружено" : "Не задано"} />
            <InfoLine label="Slug" value={finalSlug || "—"} />
            <InfoLine label="Товаров" value={String(category?.productsCount ?? 0)} />
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Сохраняю..." : isEditing ? "Сохранить изменения" : "Создать категорию"}
          </button>

          <Link
            href="/nz-console/categories"
            className="mt-3 block rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            Назад к категориям
          </Link>
        </section>

        {category ? (
          <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-red-300">
              Скрытие
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em]">
              Убрать с сайта
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              Кнопка не удаляет строку из БД, а переводит категорию в статус «Скрыта».
            </p>
            <button
              type="button"
              onClick={handleHide}
              disabled={deleting || status === "hidden"}
              className="mt-5 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Скрываю..." : status === "hidden" ? "Уже скрыта" : "Скрыть категорию"}
            </button>
          </section>
        ) : null}
      </aside>
    </form>
  );
}

function SectionTitle({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
        {label}
      </div>
      <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-white">
        {title}
      </h2>
      <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-white/55">
        {text}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-white/65">
      <span>{label}</span>
      {children}
    </label>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
      <span className="text-white/45">{label}</span>
      <span className="break-all text-right font-semibold text-white">{value}</span>
    </div>
  );
}
