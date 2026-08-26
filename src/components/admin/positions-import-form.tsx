"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImportResult = {
  ok?: boolean;
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
  error?: string;
};

export function PositionsImportForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? "");
    setResult(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];

    if (!file) {
      setResult({ error: "Выберите XLSX-файл для импорта." });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/positions/import", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ImportResult;

      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось импортировать XLSX.");
      }

      setResult(payload);
      router.refresh();
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Не удалось импортировать XLSX." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] border border-blue-500/25 bg-blue-500/10 p-6">
      <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">XLSX</div>
      <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.035em] text-white">Импорт позиций</h2>
          <p className="mt-3 max-w-[980px] text-sm leading-relaxed text-white/55">
            Excel обновляет SKU-позиции по колонке <span className="font-semibold text-white">sku</span>. Для быстрой загрузки достаточно колонок: <span className="text-white">sku, price, oldPrice, stock</span>. Дополнительно можно передать model/productSlug, name, color, memory, sim, status, seoTitle, seoDescription и seoKeywords.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="cursor-pointer rounded-xl border border-white/10 bg-black/20 px-5 py-3 text-center text-sm font-medium text-white transition-colors hover:border-blue-500/40 hover:bg-blue-500/10">
            {fileName || "Выбрать XLSX"}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Импортирую..." : "Импортировать"}
          </button>
        </div>
      </div>

      {result ? (
        <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${result.error ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-green-500/30 bg-green-500/10 text-green-200"}`}>
          {result.error ? (
            result.error
          ) : (
            <>
              Готово: обновлено {result.updated ?? 0}, создано {result.created ?? 0}, пропущено {result.skipped ?? 0}.
              {result.errors?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-red-100/80">
                  {result.errors.slice(0, 6).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </form>
  );
}
