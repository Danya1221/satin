"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SupportReplyForm({ requestId, managerName }: { requestId: string; managerName: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/support/requests/${requestId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "MANAGER", name: managerName, text }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Не удалось отправить сообщение.");
      setText("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка отправки.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} placeholder="Напишите клиенту..." className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-red-300">{message}</div>
        <button type="button" onClick={() => void send()} disabled={sending || !text.trim()} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">
          {sending ? "Отправляю..." : "Отправить клиенту"}
        </button>
      </div>
    </div>
  );
}
