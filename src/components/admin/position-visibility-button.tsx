"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type VariantStatus = "active" | "draft" | "hidden" | "out_of_stock";

type VariantPayload = {
  id: string;
  productId: string;
  sku: string;
  slug: string;
  title: string;
  memory: string;
  color: string;
  colorHex: string;
  sim: string;
  images: string[];
  price: number;
  oldPrice: number | null;
  stock: number;
  status: VariantStatus | string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

type Props = {
  variant: VariantPayload;
};

export function PositionVisibilityButton({ variant }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isHidden = variant.status === "hidden";
  const nextStatus: VariantStatus = isHidden ? "active" : "hidden";

  async function handleClick() {
    const confirmed = window.confirm(
      isHidden
        ? "Показать эту SKU-позицию на сайте?"
        : "Скрыть эту SKU-позицию с сайта и из каталога?",
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/products/${variant.productId}/variants/${variant.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: variant.sku,
          slug: variant.slug,
          title: variant.title,
          memory: variant.memory,
          color: variant.color,
          colorHex: variant.colorHex,
          sim: variant.sim,
          images: variant.images,
          price: variant.price,
          oldPrice: variant.oldPrice,
          stock: variant.stock,
          status: nextStatus,
          seoTitle: variant.seoTitle ?? "",
          seoDescription: variant.seoDescription ?? "",
          seoKeywords: variant.seoKeywords ?? "",
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Не удалось изменить статус позиции.");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось изменить статус позиции.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-xl border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        isHidden
          ? "border-green-500/30 bg-green-500/10 text-green-200 hover:bg-green-500/20"
          : "border-orange-500/30 bg-orange-500/10 text-orange-100 hover:bg-orange-500/20"
      }`}
    >
      {loading ? "..." : isHidden ? "Показать" : "Скрыть"}
    </button>
  );
}
