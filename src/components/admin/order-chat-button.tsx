"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderChatButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openChat() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/chat`, { method: "POST" });
      const payload = (await response.json()) as { ok?: boolean; href?: string; error?: string };
      if (!response.ok || !payload.href) throw new Error(payload.error || "Не удалось открыть чат.");
      router.push(payload.href);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void openChat()} disabled={loading} className="w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
        {loading ? "Открываю чат..." : "Написать клиенту"}
      </button>
      {error ? <div className="mt-2 text-xs text-red-300">{error}</div> : null}
    </div>
  );
}
