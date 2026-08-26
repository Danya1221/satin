"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ImageLibraryField } from "@/components/admin/image-library-field";
import {
  ProductDescriptionBlocksEditor,
  normalizeDescriptionBlocks,
  type ProductDescriptionBlock,
} from "@/components/admin/product-description-blocks-editor";
import type { AdminProductFormSuggestions } from "@/lib/admin-products-db";

type AdminCategoryOption = {
  id: string;
  slug: string;
  name: string;
};

type ProductVariantSummary = {
  id: string;
  sku: string;
  title: string;
  memory: string;
  color: string;
  sim: string;
  price: number;
  stock: number;
  status: string;
};

type ProductForEdit = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  descriptionBlocks?: ProductDescriptionBlock[];
  characteristics?: string;
  status: string;
  image: string;
  promoImage?: string;
  images?: string[];
  isNew: boolean;
  isPopular: boolean;
  variants?: ProductVariantSummary[];
};

type Props = {
  product: ProductForEdit;
  categories: AdminCategoryOption[];
  suggestions?: AdminProductFormSuggestions;
};

type ProductFormTab = "main" | "photos" | "description";

type CharacteristicRow = {
  id: string;
  name: string;
  value: string;
};

const inputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-500/60";

const textareaClass =
  "min-h-[110px] w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-500/60";

const tabs: Array<{ id: ProductFormTab; label: string; description: string }> = [
  {
    id: "main",
    label: "Основная информация",
    description: "Название, ссылка, статус и привязанные позиции.",
  },
  {
    id: "photos",
    label: "Фото",
    description: "Карточка, галерея и фото для новинок.",
  },
  {
    id: "description",
    label: "Описание и характеристики",
    description: "Описание, блоки и характеристики строками.",
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ё/g, "e")
    .replace(/й/g, "i")
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }

  return `${Number(value).toLocaleString("ru-RU")} ₽`;
}

function statusLabel(status: string) {
  if (status === "active") {
    return "Активна";
  }

  if (status === "draft") {
    return "Черновик";
  }

  if (status === "hidden") {
    return "Скрыта";
  }

  if (status === "out_of_stock") {
    return "Нет в наличии";
  }

  return status;
}

function createCharacteristicRow(partial?: Partial<CharacteristicRow>): CharacteristicRow {
  return {
    id: partial?.id ?? `char-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: partial?.name ?? "",
    value: partial?.value ?? "",
  };
}

function parseCharacteristics(value: string): CharacteristicRow[] {
  const rows = value
    .split("\n")
    .map((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return null;
      }

      const separatorIndex = trimmed.indexOf(":");

      if (separatorIndex === -1) {
        return createCharacteristicRow({ id: `char-initial-${index}`, name: trimmed, value: "" });
      }

      return createCharacteristicRow({
        id: `char-initial-${index}`,
        name: trimmed.slice(0, separatorIndex).trim(),
        value: trimmed.slice(separatorIndex + 1).trim(),
      });
    })
    .filter(Boolean) as CharacteristicRow[];

  return rows.length > 0 ? rows : [createCharacteristicRow({ id: "char-initial-empty" })];
}

function serializeCharacteristics(rows: CharacteristicRow[]) {
  return rows
    .map((row) => {
      const name = row.name.trim();
      const value = row.value.trim();

      if (!name && !value) {
        return "";
      }

      if (!name) {
        return value;
      }

      return value ? `${name}: ${value}` : name;
    })
    .filter(Boolean)
    .join("\n");
}

function getValueOptions(rowName: string, suggestions?: AdminProductFormSuggestions) {
  if (!suggestions) {
    return [];
  }

  const directValues = suggestions.characteristicValuesByName[rowName.trim()] ?? [];

  if (directValues.length > 0) {
    return directValues;
  }

  return suggestions.characteristicValues;
}

export function ProductEditForm({ product, categories, suggestions }: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ProductFormTab>("main");
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [brand, setBrand] = useState(product.brand);
  const [categorySlug, setCategorySlug] = useState(product.categorySlug);
  const [shortDescription, setShortDescription] = useState(product.shortDescription);
  const [description, setDescription] = useState(product.description);
  const [descriptionBlocks, setDescriptionBlocks] = useState<ProductDescriptionBlock[]>(
    normalizeDescriptionBlocks(product.descriptionBlocks)
  );
  const [characteristicRows, setCharacteristicRows] = useState<CharacteristicRow[]>(() =>
    parseCharacteristics(product.characteristics || "")
  );
  const [status, setStatus] = useState(product.status);
  const [cardImages, setCardImages] = useState<string[]>(product.image ? [product.image] : []);
  const [galleryImages, setGalleryImages] = useState<string[]>(
    Array.isArray(product.images) && product.images.length > 0 ? product.images : []
  );
  const [promoImages, setPromoImages] = useState<string[]>(product.promoImage ? [product.promoImage] : []);
  const [isNew, setIsNew] = useState(product.isNew);
  const [isPopular, setIsPopular] = useState(product.isPopular);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const finalSlug = slug.trim() || slugify(name);
  const characteristics = useMemo(() => serializeCharacteristics(characteristicRows), [characteristicRows]);
  const variants = product.variants ?? [];

  function updateCharacteristicRow(id: string, key: keyof Omit<CharacteristicRow, "id">, value: string) {
    setCharacteristicRows((rows) => rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function addCharacteristicRow() {
    setCharacteristicRows((rows) => [...rows, createCharacteristicRow()]);
  }

  function removeCharacteristicRow(id: string) {
    setCharacteristicRows((rows) => {
      const nextRows = rows.filter((row) => row.id !== id);
      return nextRows.length > 0 ? nextRows : [createCharacteristicRow()];
    });
  }

  async function saveProduct(statusOverride?: string) {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!name.trim() || !finalSlug || !brand.trim() || !categorySlug) {
        setActiveTab("main");
        throw new Error("Заполните название, slug, бренд и категорию.");
      }

      const images = galleryImages.length > 0 ? galleryImages : cardImages;
      const mainImage = cardImages[0] ?? images[0] ?? "";

      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug: finalSlug,
          brand,
          categorySlug,
          shortDescription,
          description,
          descriptionBlocks,
          characteristics,
          image: mainImage,
          promoImage: promoImages[0] ?? "",
          images,
          status: statusOverride ?? status,
          isNew,
          isPopular,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Не удалось сохранить карточку.");
      }

      if (statusOverride) {
        setStatus(statusOverride);
      }

      setSuccess(statusOverride === "draft" ? "Карточка отправлена в черновик." : statusOverride === "hidden" ? "Карточка скрыта." : "Карточка сохранена.");
      router.replace(`/nz-console/products/${finalSlug}`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Неизвестная ошибка.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveProduct();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-32">
      <div className="rounded-[28px] border border-blue-500/20 bg-blue-500/[0.06] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              Редактирование
            </div>
            <h3 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white">
              Изменить карточку товара
            </h3>
            <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-white/55">
              Форма разделена на три вкладки, а сохранение закреплено снизу — кнопку больше не нужно искать.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">
            Slug: <span className="font-semibold text-white">{finalSlug || "—"}</span>
          </div>
        </div>
      </div>

      <FormTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "main" ? (
        <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <SectionTitle
            label="Карточка"
            title="Основная информация"
            text="Название, ссылка, категория, бренд, статус и все привязанные к карточке позиции/SKU."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Название карточки">
              <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
            </Field>

            <Field label="Slug карточки">
              <input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} className={inputClass} placeholder="iphone-17-pro" />
            </Field>

            <Field label="Категория">
              <select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} className={inputClass}>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Бренд">
              <input value={brand} onChange={(event) => setBrand(event.target.value)} list="product-edit-brand-options" className={inputClass} />
              <datalist id="product-edit-brand-options">
                {(suggestions?.brands ?? []).map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Field>

            <Field label="Статус">
              <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
                <option value="active">Активна</option>
                <option value="draft">Черновик</option>
                <option value="hidden">Скрыта</option>
                <option value="out_of_stock">Нет в наличии</option>
              </select>
            </Field>

            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white/70">
              <input type="checkbox" checked={isNew} onChange={(event) => setIsNew(event.target.checked)} />
              Новинка
            </label>

            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white/70">
              <input type="checkbox" checked={isPopular} onChange={(event) => setIsPopular(event.target.checked)} />
              Популярный товар
            </label>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Привязанные позиции / SKU</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Конкретные комплектации этой карточки: память, цвет, SIM, цена и остаток.
                </p>
              </div>

              <Link
                href={`/nz-console/positions/new?product=${product.slug}`}
                className="w-fit rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-100 transition-colors hover:bg-blue-500/20"
              >
                + Добавить позицию
              </Link>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              {variants.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {variants.map((variant) => (
                    <Link
                      key={variant.id}
                      href={`/nz-console/positions/${encodeURIComponent(variant.sku)}`}
                      className="grid gap-2 bg-white/[0.015] p-4 transition-colors hover:bg-white/[0.04] lg:grid-cols-[1fr_0.7fr_0.7fr_0.5fr] lg:items-center"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">{variant.title}</div>
                        <div className="mt-1 text-xs text-white/40">{variant.sku}</div>
                      </div>

                      <div className="text-sm text-white/65">
                        {[variant.memory, variant.color, variant.sim].filter(Boolean).join(" · ") || "—"}
                      </div>

                      <div className="text-sm font-semibold text-white">{formatPrice(variant.price)}</div>

                      <div className="text-sm text-white/55">
                        {variant.stock} шт. · {statusLabel(variant.status)}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-white/45">
                  У карточки пока нет позиций. Добавьте первую SKU после сохранения основной информации.
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "photos" ? (
        <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <SectionTitle
            label="Фото"
            title="Фотографии карточки"
            text="Главное фото карточки отделено от галереи и фото для блока «Новинки»."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <ImageLibraryField
              value={cardImages}
              onChange={setCardImages}
              label="Фото карточки для главной и каталога"
              hint="Одно красивое фото, которое будет показываться в карточке товара на главной и в каталоге."
              recommendedSize="1600×1600 px"
              recommendedFormat="PNG / WEBP, квадрат"
              maxImages={1}
            />

            <ImageLibraryField
              value={promoImages}
              onChange={setPromoImages}
              label="Фото для блока «Новинки»"
              hint="Отдельное широкое промо-фото для главной. Используется только в промо-блоке новинок."
              recommendedSize="1920×1080 px"
              recommendedFormat="JPG / WEBP, 16:9"
              maxImages={1}
            />

            <div className="lg:col-span-2">
              <ImageLibraryField
                value={galleryImages}
                onChange={setGalleryImages}
                label="Галерея карточки"
                hint="Дополнительные фото модели для страницы товара."
                recommendedSize="1600×1600 px"
                recommendedFormat="PNG / WEBP, квадрат"
                maxImages={10}
              />
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "description" ? (
        <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <SectionTitle
            label="Описание"
            title="Описание и характеристики"
            text="Описание, красивые блоки и характеристики находятся отдельно от основных полей."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <Field label="Короткое описание">
              <textarea value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} className={textareaClass} />
            </Field>

            <Field label="Полное текстовое описание">
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} className={textareaClass} />
            </Field>
          </div>

          <div className="mt-6">
            <ProductDescriptionBlocksEditor
              value={descriptionBlocks}
              onChange={setDescriptionBlocks}
            />
          </div>

          <CharacteristicsEditor
            rows={characteristicRows}
            suggestions={suggestions}
            onChange={updateCharacteristicRow}
            onAdd={addCharacteristicRow}
            onRemove={removeCharacteristicRow}
          />
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#020814]/95 px-4 py-3 text-white shadow-[0_-18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-h-5 text-sm">
            {error ? <span className="text-red-200">{error}</span> : null}
            {success ? <span className="text-green-200">{success}</span> : null}
            {!error && !success ? <span className="text-white/45">Изменения сохраняются сразу для всех вкладок.</span> : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => saveProduct("draft")}
              className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-5 py-3 text-sm font-semibold text-orange-100 transition-colors hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              В черновик
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => saveProduct("hidden")}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Скрыть
            </button>

            {status !== "active" ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => saveProduct("active")}
                className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-3 text-sm font-semibold text-green-100 transition-colors hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Опубликовать
              </button>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Сохраняю..." : "Сохранить карточку"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function FormTabs({ activeTab, onChange }: { activeTab: ProductFormTab; onChange: (tab: ProductFormTab) => void }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-2">
      <div className="grid gap-2 lg:grid-cols-3">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded-2xl px-4 py-4 text-left transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-black/20 text-white/60 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className={`mt-1 block text-xs leading-relaxed ${active ? "text-white/75" : "text-white/40"}`}>
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CharacteristicsEditor({
  rows,
  suggestions,
  onChange,
  onAdd,
  onRemove,
}: {
  rows: CharacteristicRow[];
  suggestions?: AdminProductFormSuggestions;
  onChange: (id: string, key: keyof Omit<CharacteristicRow, "id">, value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Характеристики</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            Каждая характеристика отдельной строкой. Подсказки берутся из уже созданных карточек.
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="w-fit rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-100 transition-colors hover:bg-blue-500/20"
        >
          + Добавить характеристику
        </button>
      </div>

      <datalist id="product-edit-characteristic-name-options">
        {(suggestions?.characteristicNames ?? []).map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>

      <div className="mt-4 grid gap-3">
        {rows.map((row, index) => {
          const valueListId = `product-edit-characteristic-value-options-${row.id}`;
          const valueOptions = getValueOptions(row.name, suggestions);

          return (
            <div key={row.id} className="grid gap-2 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)_auto]">
              <input
                value={row.name}
                onChange={(event) => onChange(row.id, "name", event.target.value)}
                placeholder="Название: Процессор"
                list="product-edit-characteristic-name-options"
                className={inputClass}
              />

              <input
                value={row.value}
                onChange={(event) => onChange(row.id, "value", event.target.value)}
                placeholder="Значение: A17 Pro"
                list={valueListId}
                className={inputClass}
              />

              <datalist id={valueListId}>
                {valueOptions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>

              <button
                type="button"
                onClick={() => onRemove(row.id)}
                className="h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/55 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-100"
                aria-label={`Удалить характеристику ${index + 1}`}
              >
                Удалить
              </button>
            </div>
          );
        })}
      </div>
    </div>
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
