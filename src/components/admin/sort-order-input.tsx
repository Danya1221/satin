"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SortOrderInput({
  id,
  value,
  apiPath,
  extraBody = {},
}: {
  id: string;
  value: number;
  apiPath: string;
  extraBody?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    const num = Number(order);
    if (!Number.isFinite(num) || num === value) return;

    setSaving(true);
    try {
      const res = await fetch(`${apiPath}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...extraBody, sortOrder: num }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Sort save error:", data);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        router.refresh();
      }
    } catch {
      alert("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="w-[60px] rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-center text-sm outline-none transition-colors focus:border-blue-500/50 focus:bg-blue-500/[0.06]"
      />
      {saved && <span className="text-xs text-green-400">✓</span>}
      {saving && <span className="text-xs text-white/40">...</span>}
    </div>
  );
}
