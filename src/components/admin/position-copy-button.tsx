"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  variantId: string;
};

export function PositionCopyButton({ productId, variantId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCopy() {
    const confirmed = window.confirm("Создать черновик-копию этой позиции?");

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/${variantId}/copy`, {
        method: "POST",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Не удалось скопировать позицию.");
      }

      const sku = payload?.variant?.sku;

      if (sku) {
        router.push(`/nz-console/positions/${encodeURIComponent(sku)}`);
        return;
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось скопировать позицию.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={loading}
      className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "..." : "Копировать"}
    </button>
  );
}
