"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ColorPickerField } from "@/components/admin/color-picker-field";
import { ImageLibraryField } from "@/components/admin/image-library-field";

type VariantStatus = "active" | "draft" | "hidden" | "out_of_stock";

type Variant = {
  id: string;
  sku: string;
  slug: string;
  title: string;
  memory: string;
  color: string;
  colorHex: string;
  sim: string;
  images?: string[];
  price: number;
  oldPrice: number | null;
  stock: number;
  status: VariantStatus | string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  relatedProductIds?: string[];
};

type RelatedProductOption = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
};

type Props = {
  productId: string;
  variant: Variant;
  relatedProductOptions?: RelatedProductOption[];
};

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500/70 dark:border-white/10 dark:bg-black/25 dark:text-white dark:placeholder:text-white/30";

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

function getStatusLabel(status: string) {
  if (status === "active") return "В продаже";
  if (status === "draft") return "Черновик";
  if (status === "hidden") return "Скрыта";
  if (status === "out_of_stock") return "Нет в наличии";
  return status;
}

export function ProductVariantEditForm({ productId, variant, relatedProductOptions = [] }: Props) {
  const router = useRouter();

  const [sku, setSku] = useState(variant.sku);
  const [slug, setSlug] = useState(variant.slug);
  const [title, setTitle] = useState(variant.title);
  const [memory, setMemory] = useState(variant.memory);
  const [color, setColor] = useState(variant.color);
  const [colorHex, setColorHex] = useState(variant.colorHex);
  const [sim, setSim] = useState(variant.sim);
  const [images, setImages] = useState<string[]>(Array.isArray(variant.images) ? variant.images : []);
  const [price, setPrice] = useState(String(variant.price));
  const [oldPrice, setOldPrice] = useState(variant.oldPrice ? String(variant.oldPrice) : "");
  const [stock, setStock] = useState(String(variant.stock));
  const [status, setStatus] = useState(String(variant.status || "active"));
  const [seoTitle, setSeoTitle] = useState(variant.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(variant.seoDescription ?? "");
  const [seoKeywords, setSeoKeywords] = useState(variant.seoKeywords ?? "");
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>(
    Array.isArray(variant.relatedProductIds) ? variant.relatedProductIds : [],
  );

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!sku || !slug || !title || !price) {
        throw new Error("Укажите SKU, ссылку позиции, название позиции и цену.");
      }

      const response = await fetch(`/api/admin/products/${productId}/variants/${variant.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: normalizeManualSku(sku),
          slug: normalizeVariantSlug(slug),
          title: title.trim(),
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
          relatedProductIds,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Не удалось сохранить позицию.");
      }

      setSuccess("Позиция сохранена.");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Неизвестная ошибка.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Удалить эту SKU-позицию? Действие нельзя отменить.");

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/${variant.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Не удалось удалить позицию.");
      }

      router.push("/nz-console/positions");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Неизвестная ошибка.");
    } finally {
      setDeleting(false);
    }
  }

  function toggleRelatedProduct(productId: string) {
    setRelatedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId].slice(0, 8),
    );
  }

  function moveRelatedProduct(productId: string, direction: "up" | "down") {
    setRelatedProductIds((current) => {
      const index = current.indexOf(productId);

      if (index < 0) return current;

      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-32">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
              Редактирование SKU
            </div>
            <h3 className="mt-1 max-w-[900px] text-2xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white">
              {title || variant.sku}
            </h3>
            <p className="mt-2 max-w-[780px] text-sm leading-relaxed text-slate-500 dark:text-white/50">
              Редактируйте SKU, ссылку, конфигурацию, цену, наличие и фото конкретной позиции.
            </p>
          </div>

          <span className="w-fit rounded-full border border-green-500/25 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-200">
            {getStatusLabel(status)}
          </span>
        </div>
      </section>

      <Section title="Основное">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Артикул / SKU">
            <input value={sku} onChange={(event) => setSku(event.target.value)} className={inputClass} />
          </Field>

          <Field label="Ссылка позиции">
            <input value={slug} onChange={(event) => setSlug(normalizeVariantSlug(event.target.value))} className={inputClass} />
          </Field>

          <Field label="Название позиции" className="md:col-span-2 xl:col-span-1">
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Конфигурация">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Память">
            <input value={memory} onChange={(event) => setMemory(event.target.value)} className={inputClass} />
          </Field>

          <Field label="SIM">
            <input value={sim} onChange={(event) => setSim(event.target.value)} className={inputClass} />
          </Field>

          <div className="md:col-span-2 xl:col-span-3">
            <ColorPickerField
              color={color}
              colorHex={colorHex}
              onColorChange={setColor}
              onColorHexChange={setColorHex}
            />
          </div>
        </div>
      </Section>

      <Section title="Цена и наличие">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Цена">
            <input value={price} onChange={(event) => setPrice(onlyDigits(event.target.value))} inputMode="numeric" className={inputClass} />
          </Field>

          <Field label="Старая цена">
            <input value={oldPrice} onChange={(event) => setOldPrice(onlyDigits(event.target.value))} inputMode="numeric" className={inputClass} />
          </Field>

          <Field label="Остаток">
            <input value={stock} onChange={(event) => setStock(onlyDigits(event.target.value))} inputMode="numeric" className={inputClass} />
          </Field>

          <Field label="Статус">
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              <option value="active">Активна</option>
              <option value="draft">Черновик</option>
              <option value="hidden">Скрыта</option>
              <option value="out_of_stock">Нет в наличии</option>
            </select>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-black/20">
          <button type="button" onClick={() => setStatus("active")} className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-500/20 dark:text-green-200">В продажу</button>
          <button type="button" onClick={() => setStatus("draft")} className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-500/20 dark:text-blue-200">В черновик</button>
          <button type="button" onClick={() => setStatus("hidden")} className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-500/20 dark:text-orange-100">Скрыть</button>
        </div>
      </Section>

      <Section title="SEO позиции">
        <p className="mb-4 text-sm leading-relaxed text-slate-500 dark:text-white/45">
          Описание товара остаётся у карточки, здесь задаются SEO-данные конкретной SKU-позиции.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="SEO title">
            <input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} className={inputClass} />
          </Field>
          <Field label="SEO keywords">
            <input value={seoKeywords} onChange={(event) => setSeoKeywords(event.target.value)} className={inputClass} />
          </Field>
          <Field label="SEO description" className="md:col-span-2">
            <textarea
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500/70 dark:border-white/10 dark:bg-black/25 dark:text-white dark:placeholder:text-white/30"
            />
          </Field>
        </div>
      </Section>

      <Section title="С этим товаром покупают">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-[680px] text-sm leading-relaxed text-slate-500 dark:text-white/50">
            Выберите до 8 товаров. Порядок ниже совпадает с порядком на сайте.
          </p>

          <div className="text-sm text-slate-500 dark:text-white/45">
            Выбрано: {relatedProductIds.length}
          </div>
        </div>

        {relatedProductIds.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {relatedProductIds.map((productId, index) => {
              const product = relatedProductOptions.find((item) => item.id === productId);

              if (!product) return null;

              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-white/[0.05]">
                    {product.image ? (
                      <img src={product.image} alt="" className="h-full w-full object-contain p-1" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">{product.name}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-white/45">{product.brand}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveRelatedProduct(product.id, "up")}
                      disabled={index === 0}
                      className="h-9 w-9 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRelatedProduct(product.id, "down")}
                      disabled={index === relatedProductIds.length - 1}
                      className="h-9 w-9 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRelatedProduct(product.id)}
                      className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-500/20 dark:text-red-200"
                    >
                      Убрать
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mt-4 grid max-h-[420px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
          {relatedProductOptions.map((product) => {
            const selected = relatedProductIds.includes(product.id);

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => toggleRelatedProduct(product.id)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                  selected
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-slate-200 bg-slate-50 hover:border-blue-500/35 hover:bg-blue-500/[0.05] dark:border-white/10 dark:bg-white/[0.02]"
                }`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-white/[0.05]">
                  {product.image ? (
                    <img src={product.image} alt="" className="h-full w-full object-contain p-1" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">{product.name}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-white/45">{product.brand}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Фотографии позиции">
        <ImageLibraryField
          value={images}
          onChange={setImages}
          label="Фотографии позиции / SKU"
          hint="Фотографии конкретной конфигурации товара."
          recommendedSize="1600×1600 px"
          recommendedFormat="PNG / WEBP, квадрат"
        />
      </Section>

      {error ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-200">{success}</div> : null}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.10)] backdrop-blur dark:border-white/10 dark:bg-[#070b16]/95">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm text-slate-500 dark:text-white/50">
            <div className="font-semibold text-slate-950 dark:text-white">Редактирование SKU</div>
            <div className="mt-0.5 truncate">
              {sku || "SKU не заполнен"} · {title || "Название не заполнено"}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || deleting}
              className="rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-200"
            >
              {deleting ? "Удаляю..." : "Удалить"}
            </button>

            <button
              type="submit"
              disabled={loading || deleting}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[220px]"
            >
              {loading ? "Сохраняю..." : "Сохранить позицию"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
        <h4 className="text-base font-bold text-slate-950 dark:text-white">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.025] dark:text-white/60 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-white/35">{label}</span>
      {children}
    </label>
  );
}
