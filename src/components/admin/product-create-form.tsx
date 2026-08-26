"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ImageLibraryField } from "@/components/admin/image-library-field";
import {
  ProductDescriptionBlocksEditor,
  type ProductDescriptionBlock,
} from "@/components/admin/product-description-blocks-editor";
import type { AdminProductFormSuggestions } from "@/lib/admin-products-db";

type AdminCategoryOption = {
  id: string;
  slug: string;
  name: string;
};

type Props = {
  categories: AdminCategoryOption[];
  initialCategorySlug?: string;
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
    description: "Название, ссылка, категория, статус и связь с позициями.",
  },
  {
    id: "photos",
    label: "Фото",
    description: "Фото для каталога, галерея и изображение для новинок.",
  },
  {
    id: "description",
    label: "Описание и характеристики",
    description: "Тексты, красивые блоки и таблица характеристик.",
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

function getInitialCategorySlug(categories: AdminCategoryOption[], initialCategorySlug?: string) {
  if (initialCategorySlug && categories.some((category) => category.slug === initialCategorySlug)) {
    return initialCategorySlug;
  }

  return categories[0]?.slug ?? "";
}

function createCharacteristicRow(partial?: Partial<CharacteristicRow>): CharacteristicRow {
  return {
    id: partial?.id ?? `char-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: partial?.name ?? "",
    value: partial?.value ?? "",
  };
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

export function ProductCreateForm({ categories, initialCategorySlug, suggestions }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProductFormTab>("main");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("Apple");
  const [categorySlug, setCategorySlug] = useState(() => getInitialCategorySlug(categories, initialCategorySlug));
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionBlocks, setDescriptionBlocks] = useState<ProductDescriptionBlock[]>([]);
  const [characteristicRows, setCharacteristicRows] = useState<CharacteristicRow[]>([createCharacteristicRow()]);
  const [status, setStatus] = useState("active");
  const [isNew, setIsNew] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [cardImages, setCardImages] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [promoImages, setPromoImages] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const finalSlug = useMemo(() => slug || slugify(name), [name, slug]);
  const characteristics = useMemo(() => serializeCharacteristics(characteristicRows), [characteristicRows]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!name.trim() || !finalSlug || !brand.trim() || !categorySlug) {
        setActiveTab("main");
        throw new Error("Заполните название, slug, бренд и категорию.");
      }

      const images = galleryImages.length > 0 ? galleryImages : cardImages;
      const mainImage = cardImages[0] ?? images[0] ?? "";

      const productResponse = await fetch("/api/admin/products", {
        method: "POST",
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
          status,
          isNew,
          isPopular,
        }),
      });

      const productPayload = await productResponse.json();

      if (!productResponse.ok) {
        throw new Error(productPayload?.error ?? "Не удалось создать товар.");
      }

      router.push(`/nz-console/products/${finalSlug}`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Неизвестная ошибка.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-32">
      <FormTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "main" ? (
        <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <SectionTitle
            label="Карточка"
            title="Основная информация"
            text="Здесь только база карточки: название, ссылка, категория, статус и признаки витрины. Позиции/SKU добавляются после создания карточки."
          />

          {categories.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-orange-500/25 bg-orange-500/10 p-4 text-sm leading-relaxed text-orange-100/80">
              Сначала создайте хотя бы одну категорию в разделе «Категории». Без категории карточку товара сохранить нельзя.
            </div>
          ) : null}

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Field label="Название карточки">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => !slug && setSlug(slugify(name))}
                placeholder="Например: iPhone 17 Pro"
                className={inputClass}
              />
            </Field>

            <Field label="Slug карточки">
              <input
                value={finalSlug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                placeholder="iphone-17-pro"
                className={inputClass}
              />
            </Field>

            <Field label="Категория">
              <select
                value={categorySlug}
                onChange={(event) => setCategorySlug(event.target.value)}
                className={inputClass}
                disabled={categories.length === 0}
              >
                {categories.length === 0 ? <option value="">Нет категорий</option> : null}
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Бренд">
              <input
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder="Apple"
                list="product-brand-options"
                className={inputClass}
              />
              <datalist id="product-brand-options">
                {(suggestions?.brands ?? []).map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Field>

            <Field label="Статус карточки">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={inputClass}
              >
                <option value="active">Активна</option>
                <option value="draft">Черновик</option>
                <option value="hidden">Скрыта</option>
              </select>
            </Field>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <label className="flex items-center gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(event) => setIsNew(event.target.checked)}
                />
                Новинка
              </label>

              <label className="flex items-center gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(event) => setIsPopular(event.target.checked)}
                />
                Популярный товар
              </label>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm leading-relaxed text-blue-100/80">
            После сохранения карточки можно будет добавить к ней конкретные позиции/SKU: память, цвет, SIM, цену и остаток.
          </div>
        </section>
      ) : null}

      {activeTab === "photos" ? (
        <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <SectionTitle
            label="Фото"
            title="Фотографии карточки"
            text="Отдельно выберите фото для карточки в каталоге/на главной, галерею и широкое фото для блока «Новинки»."
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
              hint="Отдельное широкое промо-фото для главной."
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
            text="Тексты и характеристики находятся отдельно от основных полей, чтобы форма не превращалась в одну длинную простыню."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <Field label="Короткое описание">
              <textarea
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                placeholder="Короткий текст для каталога и карточки товара."
                className={textareaClass}
              />
            </Field>

            <Field label="Полное текстовое описание">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Текстовый fallback. Основное красивое описание собирается блоками ниже."
                className={textareaClass}
              />
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
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm">
            {error ? <span className="text-red-200">{error}</span> : <span className="text-white/45">Карточка сохранится со всеми данными из вкладок.</span>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/nz-console/products"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white"
            >
              Отмена
            </Link>

            <button
              type="submit"
              disabled={loading || categories.length === 0}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Сохраняю..." : "Создать карточку"}
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
            Не одно большое поле, а нормальные строки. Подсказки берутся из уже созданных карточек.
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

      <datalist id="characteristic-name-options">
        {(suggestions?.characteristicNames ?? []).map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>

      <div className="mt-4 grid gap-3">
        {rows.map((row, index) => {
          const valueListId = `characteristic-value-options-${row.id}`;
          const valueOptions = getValueOptions(row.name, suggestions);

          return (
            <div key={row.id} className="grid gap-2 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)_auto]">
              <input
                value={row.name}
                onChange={(event) => onChange(row.id, "name", event.target.value)}
                placeholder="Название: Процессор"
                list="characteristic-name-options"
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
    <label className="grid gap-2">
      <span className="text-sm font-medium text-white/70">{label}</span>
      {children}
    </label>
  );
}
