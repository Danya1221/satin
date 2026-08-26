"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CategoryStatusToggle({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isActive = status === "active";

  const toggle = async () => {
    setLoading(true);
    try {
      if (isActive) {
        await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/categories/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "active" }),
        });
      }
      router.refresh();
    } catch {
      alert("Ошибка при обновлении статуса");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
        isActive
          ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          : "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
      } ${loading ? "opacity-50" : ""}`}
    >
      {loading ? "..." : isActive ? "Скрыть" : "Показать"}
    </button>
  );
}
