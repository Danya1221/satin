"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  CustomerStatus,
  CustomerStatusProgress,
  CustomerStatusRules,
} from "@/lib/customer-status-types";

const stages: Array<{ value: CustomerStatus; label: string }> = [
  { value: "new", label: "Новый" },
  { value: "regular", label: "Постоянный" },
  { value: "vip", label: "VIP" },
];

function rank(status: CustomerStatus) {
  return stages.findIndex((item) => item.value === status);
}

export function CustomerStatusCard({
  customerId,
  progress,
  rules,
}: {
  customerId: string;
  progress: CustomerStatusProgress;
  rules: CustomerStatusRules;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(progress.isManual ? progress.status : "auto");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const automaticRank = rank(progress.automaticStatus);
  const statusDateLabel = progress.statusDate
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(progress.statusDate))
    : "";

  async function saveStatus() {
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/admin/customers/${customerId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: selected }),
    }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as { error?: string } | null;

    if (!response?.ok) {
      setMessage(payload?.error || "Не удалось изменить статус.");
      setSaving(false);
      return;
    }

    setMessage(selected === "auto" ? "Автоматический расчёт включён." : "Статус назначен вручную.");
    setSaving(false);
    router.refresh();
  }

  return (
    <section className="rounded-[34px] border border-blue-500/25 bg-gradient-to-br from-blue-500/15 to-purple-500/10 p-6 sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            Статус клиента
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
            {progress.statusLabel}
          </h2>
          <p className="mt-2 text-sm text-white/55">
            {progress.isManual
              ? `Назначен вручную. Автоматически сейчас: ${progress.automaticStatusLabel}.`
              : progress.explanation}
          </p>
          {statusDateLabel ? (
            <p className="mt-2 text-xs text-white/40">
              Текущий статус получен: {statusDateLabel}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[320px]">
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value as CustomerStatus | "auto")}
            className="h-12 rounded-xl border border-white/10 bg-[#07101f] px-4 text-sm outline-none"
          >
            <option value="auto">Автоматически по правилам</option>
            <option value="new">Новый клиент — вручную</option>
            <option value="regular">Постоянный клиент — вручную</option>
            <option value="vip">VIP — вручную</option>
          </select>
          <button
            type="button"
            onClick={() => void saveStatus()}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Сохраняю..." : "Изменить статус"}
          </button>
          {message ? <div className="text-xs text-white/55">{message}</div> : null}
        </div>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-3 gap-2">
          {stages.map((stage, index) => {
            const reached = index <= automaticRank;
            return (
              <div key={stage.value} className="text-center">
                <div
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
                    reached
                      ? "border-blue-400 bg-blue-600 text-white"
                      : "border-white/15 bg-black/20 text-white/35"
                  }`}
                >
                  {index + 1}
                </div>
                <div className={`mt-2 text-xs font-semibold ${reached ? "text-white" : "text-white/35"}`}>
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/40">
          <span>{progress.progressPercent}% до следующего автоматического уровня</span>
          <span>{progress.countedOrders} учтённых заказов</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusMetric label="Завершённых заказов" value={String(progress.completedOrders)} />
        <StatusMetric label="Учтённых заказов" value={String(progress.countedOrders)} />
        <StatusMetric label="Учтённая сумма" value={`${progress.countedSpent.toLocaleString("ru-RU")} ₽`} />
        <StatusMetric
          label="Учитывается заказ от"
          value={`${rules.minOrderTotal.toLocaleString("ru-RU")} ₽`}
        />
      </div>

      {progress.nextStatus ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-white/60">
          <b className="text-white">Чтобы получить «{progress.nextStatusLabel}»:</b>{" "}
          {progress.nextStatus === "regular"
            ? `нужно ещё ${progress.remainingOrders} завершённых заказов стоимостью от ${rules.minOrderTotal.toLocaleString("ru-RU")} ₽.`
            : `нужно ещё ${progress.remainingOrders} заказов или покупок на ${progress.remainingSpent.toLocaleString("ru-RU")} ₽.`}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-purple-500/25 bg-purple-500/10 p-4 text-sm text-purple-200">
          Максимальный автоматический статус получен.
        </div>
      )}
    </section>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-2 font-bold">{value}</div>
    </div>
  );
}
