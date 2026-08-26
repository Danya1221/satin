"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ColorPickerField } from "@/components/admin/color-picker-field";
import { ImageLibraryField } from "@/components/admin/image-library-field";

type ProductOption = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  category?: {
    name: string;
  } | null;
};

type Props = {
  products: ProductOption[];
  initialProductSlug?: string;
  initialCategorySlug?: string;
};

const inputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-500/60";

function normalizeVariantSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeManualSku(value: string) {
  return value.trim();
}


function onlyDigits(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function getProductCategoryName(product?: ProductOption) {
  return product?.category?.name ?? product?.categorySlug ?? "Без категории";
}

export function PositionCreateForm({ products, initialProductSlug, initialCategorySlug }: Props) {
  const router = useRouter();
  const initialProduct =
    products.find((product) => product.slug === initialProductSlug) ??
    products.find((product) => product.categorySlug === initialCategorySlug) ??
    products[0];

  const [productId, setProductId] = useState(initialProduct?.id ?? "");
  const [sku, setSku] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [memory, setMemory] = useState("");
  const [color, setColor] = useState("");
  const [colorHex, setColorHex] = useState("");
  const [sim, setSim] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("active");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedProduct = products.find((product) => product.id === productId);
  const categoryProductsCount = initialCategorySlug
    ? products.filter((product) => product.categorySlug === initialCategorySlug).length
    : products.length;

  const suggestedTitle = useMemo(() => {
    return [selectedProduct?.name, memory, color, sim].filter(Boolean).join(" ").trim();
  }, [color, memory, selectedProduct?.name, sim]);

  const finalSku = normalizeManualSku(sku);
  const finalSlug = normalizeVariantSlug(slug);
  const finalTitle = title.trim() || suggestedTitle;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!productId || !finalSku || !finalSlug || !finalTitle || !price) {
        throw new Error("Выберите карточку, SKU, ссылку позиции, название и цену.");
      }

      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: finalSku,
          slug: finalSlug,
          title: finalTitle,
          memory: memory.trim(),
          color: color.trim(),
          colorHex: colorHex.trim(),
          sim: sim.trim(),
          images,
          price: Number(price),
          oldPrice: oldPrice ? Number(oldPrice) : null,
          stock: stock ? Number(stock) : 0,
          status,
          seoTitle: seoTitle.trim(),
          seoDescription: seoDescription.trim(),
          seoKeywords: seoKeywords.trim(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Не удалось создать позицию.");
      }

      router.push(`/nz-console/positions/${encodeURIComponent(finalSku)}`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Неизвестная ошибка.");
    } finally {
      setLoading(false);
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-[34px] border border-orange-500/25 bg-orange-500/10 p-6 text-sm leading-relaxed text-orange-100/80">
        Сначала создайте материнскую карточку товара и привяжите её к категории. После этого сюда можно будет добавить конкретную SKU-позицию.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28">
      <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <SectionTitle
          label="Новая позиция"
          title="Добавить SKU"
          text="Позиция — это конкретный товар, который продаётся: память, цвет, SIM, цена, старая цена, остаток и своя библиотека фото. Она привязывается к материнской карточке."
        />

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Материнская карточка">
            <select value={productId} onChange={(event) => setProductId(event.target.value)} className={inputClass}>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.brand} · {getProductCategoryName(product)}
                </option>
              ))}
            </select>
          </Field>

          {initialCategorySlug && categoryProductsCount === 0 ? (
            <div className="rounded-2xl border border-orange-500/25 bg-orange-500/10 p-4 text-sm leading-relaxed text-orange-100/80">
              В этой категории пока нет карточек товара. Сначала создайте карточку в этой категории, потом добавьте к ней SKU-позицию.
            </div>
          ) : null}

          <Field label="Артикул / SKU">
            <input
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="Например: IP17-256-BLUE-ESIM"
              className={inputClass}
            />
          </Field>

          <Field label="Ссылка позиции">
            <input
              value={slug}
              onChange={(event) => setSlug(normalizeVariantSlug(event.target.value))}
              placeholder="Например: iphone-17-256gb-blue-esim"
              className={inputClass}
            />
          </Field>

          <Field label="Название позиции">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Например: iPhone 17 Pro 256 GB Black eSIM"
              className={inputClass}
            />
          </Field>

          <Field label="Память">
            <input
              value={memory}
              onChange={(event) => setMemory(event.target.value)}
              placeholder="Например: 256 GB"
              className={inputClass}
            />
          </Field>

          <div className="md:col-span-2 xl:col-span-3">
            <ColorPickerField
              color={color}
              colorHex={colorHex}
              onColorChange={setColor}
              onColorHexChange={setColorHex}
            />
          </div>

          <Field label="SIM">
            <input
              value={sim}
              onChange={(event) => setSim(event.target.value)}
              placeholder="Например: eSIM или SIM + eSIM"
              className={inputClass}
            />
          </Field>

          <Field label="Цена">
            <input
              value={price}
              onChange={(event) => setPrice(onlyDigits(event.target.value))}
              inputMode="numeric"
              placeholder="Например: 109990"
              className={inputClass}
            />
          </Field>

          <Field label="Старая цена">
            <input
              value={oldPrice}
              onChange={(event) => setOldPrice(onlyDigits(event.target.value))}
              inputMode="numeric"
              placeholder="Например: 119990, если есть скидка"
              className={inputClass}
            />
          </Field>

          <Field label="Остаток">
            <input
              value={stock}
              onChange={(event) => setStock(onlyDigits(event.target.value))}
              inputMode="numeric"
              placeholder="Например: 3"
              className={inputClass}
            />
          </Field>

          <Field label="Статус">
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              <option value="active">Активна</option>
              <option value="draft">Черновик</option>
              <option value="hidden">Скрыта</option>
              <option value="out_of_stock">Нет в наличии</option>
            </select>
          </Field>

          <div className="md:col-span-2 xl:col-span-3 mt-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">SEO позиции</div>
            <p className="mt-2 text-xs leading-relaxed text-white/45">
              Описание остаётся у карточки товара, а у SKU можно задать SEO-заголовок, SEO-описание и ключи для конкретной комплектации.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="SEO title">
                <input
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  placeholder="Купить iPhone 17 Pro 256 GB Silver eSIM"
                  className={inputClass}
                />
              </Field>

              <Field label="SEO keywords">
                <input
                  value={seoKeywords}
                  onChange={(event) => setSeoKeywords(event.target.value)}
                  placeholder="iphone 17 pro, 256gb, silver, esim"
                  className={inputClass}
                />
              </Field>

              <div className="md:col-span-2 xl:col-span-3">
                <Field label="SEO description">
                  <textarea
                    value={seoDescription}
                    onChange={(event) => setSeoDescription(event.target.value)}
                    placeholder="Короткое SEO-описание конкретной SKU-позиции."
                    className="min-h-24 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-500/60"
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <ImageLibraryField
            value={images}
            onChange={setImages}
            label="Фотографии позиции / SKU"
            hint="Фотографии конкретной конфигурации: цвет, память и SIM."
            recommendedSize="1600×1600 px"
            recommendedFormat="PNG / WEBP, квадрат"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-relaxed text-white/45">
          <span className="text-white/65">Подсказка:</span> SKU и ссылку позиции заполняем вручную. Фото хранятся именно у позиции, а не у материнской карточки.
          {finalSku || finalTitle ? (
            <div className="mt-2 text-white/55">
              Будет создано: <span className="font-semibold text-white">{finalSku || "SKU не заполнен"}</span>{finalSlug ? <span> · /product/{finalSlug}</span> : null}
              {finalTitle ? <span> · {finalTitle}</span> : null}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.10)] backdrop-blur dark:border-white/10 dark:bg-[#070b16]/90">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm text-slate-500 dark:text-white/50">
            <div className="font-semibold text-slate-900 dark:text-white">Создание SKU</div>
            <div className="mt-0.5 truncate">
              {finalTitle || "Заполните данные позиции"}
              {finalSku ? <span> · {finalSku}</span> : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[220px]"
          >
            {loading ? "Сохраняю..." : "Создать позицию"}
          </button>
        </div>
      </div>
    </form>
  );
}

function SectionTitle({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">{label}</div>
      <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-white">{title}</h2>
      <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-white/55">{text}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-white/65">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">{label}</span>
      {children}
    </label>
  );
}
