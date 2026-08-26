"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminProductStatus = "active" | "draft" | "hidden" | "out_of_stock";

type ProductVisibilityButtonProps = {
  productId: string;
  currentStatus: AdminProductStatus;
};

export function ProductVisibilityButton({ productId, currentStatus }: ProductVisibilityButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isHidden = currentStatus === "hidden";
  const nextStatus: AdminProductStatus = isHidden ? "active" : "hidden";
  const label = isHidden ? "Показать" : "Скрыть";

  async function updateVisibility() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "set-status",
          status: nextStatus,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Не удалось обновить статус.");
      }

      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось обновить статус.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 xl:items-end">
      <button
        type="button"
        onClick={updateVisibility}
        disabled={loading}
        className={`rounded-xl border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isHidden
            ? "border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20"
            : "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
        }`}
      >
        {loading ? "Сохранение..." : label}
      </button>
      {error ? <span className="max-w-[180px] text-right text-xs text-red-300">{error}</span> : null}
    </div>
  );
}
