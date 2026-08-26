"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColorPickerField } from "@/components/admin/color-picker-field";

type Props = {
  productId: string;
  productName: string;
};

const inputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-500/60";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ё/g, "e")
    .replace(/й/g, "i")
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function makeSku(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-ZА-Я0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductVariantCreateForm({ productId, productName }: Props) {
  const router = useRouter();

  const [sku, setSku] = useState("");
  const [title, setTitle] = useState("");
  const [memory, setMemory] = useState("256 GB");
  const [color, setColor] = useState("Black");
  const [colorHex, setColorHex] = useState("#111827");
  const [sim, setSim] = useState("eSIM");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [status, setStatus] = useState("active");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const finalTitle = useMemo(() => {
    return title.trim() || `${productName} ${memory} ${color} ${sim}`.trim();
  }, [color, memory, productName, sim, title]);

  const finalSku = useMemo(() => {
    return makeSku(sku || finalTitle);
  }, [finalTitle, sku]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!finalSku || !finalTitle || !price) {
        throw new Error("Укажите артикул, название позиции и цену.");
      }

      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: finalSku,
          slug: slugify(finalSku),
          title: finalTitle,
          memory,
          color,
          colorHex,
          sim,
          price: Number(price),
          oldPrice: oldPrice ? Number(oldPrice) : null,
          stock: Number(stock),
          status,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Не удалось создать SKU.");
      }

      setSuccess("Позиция создана. Список SKU обновился.");
      setSku("");
      setTitle("");
      setPrice("");
      setOldPrice("");
      setStock("1");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Неизвестная ошибка.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-[28px] border border-blue-500/20 bg-blue-500/[0.06] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Новая позиция
          </div>
          <h3 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white">
            Добавить SKU к карточке
          </h3>
          <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-white/55">
            SKU — это конкретная комплектация: память, цвет, SIM, цена и остаток. После создания она появится в списке позиций этой карточки.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">
          Будет создано: <span className="font-semibold text-white">{finalSku || "SKU"}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Артикул / SKU">
          <input
            value={sku}
            onChange={(event) => setSku(makeSku(event.target.value))}
            placeholder="IP17PRO-256-BLACK-ESIM"
            className={inputClass}
          />
        </Field>

        <Field label="Название позиции">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={`${productName} 256 GB Black eSIM`}
            className={inputClass}
          />
        </Field>

        <Field label="Память">
          <input
            value={memory}
            onChange={(event) => setMemory(event.target.value)}
            placeholder="256 GB"
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
            placeholder="eSIM"
            className={inputClass}
          />
        </Field>

        <Field label="Цена">
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value.replace(/[^0-9]/g, ""))}
            placeholder="109990"
            inputMode="numeric"
            className={inputClass}
          />
        </Field>

        <Field label="Старая цена">
          <input
            value={oldPrice}
            onChange={(event) => setOldPrice(event.target.value.replace(/[^0-9]/g, ""))}
            placeholder="119990"
            inputMode="numeric"
            className={inputClass}
          />
        </Field>

        <Field label="Остаток">
          <input
            value={stock}
            onChange={(event) => setStock(event.target.value.replace(/[^0-9]/g, ""))}
            placeholder="3"
            inputMode="numeric"
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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Создаём..." : "Создать позицию"}
        </button>

        <div className="text-sm text-white/40">
          После создания страница обновится, а SKU появится в таблице выше.
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">{label}</span>
      {children}
    </label>
  );
}
