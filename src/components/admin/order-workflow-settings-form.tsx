"use client";

import { useMemo, useState } from "react";

import {
  normalizeOrderWorkflowSettings,
  type OrderStatusColor,
  type OrderWorkflowSettings,
  type OrderWorkflowStatus,
} from "@/lib/order-status";

type StatusListKey = "courierStatuses" | "pickupStatuses";
type DefaultKey = "defaultCourierStatus" | "defaultPickupStatus";

const colorOptions: Array<{ value: OrderStatusColor; label: string }> = [
  { value: "blue", label: "Синий" },
  { value: "orange", label: "Оранжевый" },
  { value: "purple", label: "Фиолетовый" },
  { value: "cyan", label: "Голубой" },
  { value: "green", label: "Зелёный" },
  { value: "red", label: "Красный" },
  { value: "gray", label: "Серый" },
];

function slugifyStatus(value: string) {
  const transliteration: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };

  return value
    .toLowerCase()
    .split("")
    .map((letter) => transliteration[letter] ?? letter)
    .join("")
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export function OrderWorkflowSettingsForm({ initialSettings }: { initialSettings: OrderWorkflowSettings }) {
  const [settings, setSettings] = useState(() => normalizeOrderWorkflowSettings(initialSettings));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const statusCount = useMemo(
    () => settings.courierStatuses.length + settings.pickupStatuses.length,
    [settings],
  );

  function updateStatus(listKey: StatusListKey, index: number, patch: Partial<OrderWorkflowStatus>) {
    setSettings((current) => {
      const currentStatus = current[listKey][index];
      const defaultKey: DefaultKey = listKey === "pickupStatuses"
        ? "defaultPickupStatus"
        : "defaultCourierStatus";
      const nextId = patch.id || currentStatus.id;

      return {
        ...current,
        [listKey]: current[listKey].map((status, statusIndex) =>
          statusIndex === index ? { ...status, ...patch, id: nextId } : status,
        ),
        [defaultKey]: current[defaultKey] === currentStatus.id ? nextId : current[defaultKey],
      };
    });
  }

  function addStatus(listKey: StatusListKey) {
    setSettings((current) => {
      const nextNumber = current[listKey].length + 1;
      const id = `status_${Date.now().toString().slice(-6)}_${nextNumber}`;
      return {
        ...current,
        [listKey]: [
          ...current[listKey],
          {
            id,
            label: "Новый статус",
            color: "gray" as const,
            active: true,
            sortOrder: nextNumber * 10,
          },
        ],
      };
    });
  }

  function removeStatus(listKey: StatusListKey, defaultKey: DefaultKey, index: number) {
    setSettings((current) => {
      if (current[listKey].length <= 1) return current;
      const removing = current[listKey][index];
      const nextList = current[listKey].filter((_, statusIndex) => statusIndex !== index);
      return {
        ...current,
        [listKey]: nextList,
        [defaultKey]: current[defaultKey] === removing.id ? nextList[0].id : current[defaultKey],
      };
    });
  }

  function moveStatus(listKey: StatusListKey, index: number, direction: -1 | 1) {
    setSettings((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current[listKey].length) return current;
      const nextList = current[listKey].map((status) => ({ ...status }));
      [nextList[index], nextList[nextIndex]] = [nextList[nextIndex], nextList[index]];
      nextList.forEach((status, statusIndex) => {
        status.sortOrder = (statusIndex + 1) * 10;
      });
      return { ...current, [listKey]: nextList };
    });
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/orders/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        settings?: OrderWorkflowSettings;
      };

      if (!response.ok || !result.ok || !result.settings) {
        throw new Error(result.error || "Не удалось сохранить настройки.");
      }

      setSettings(normalizeOrderWorkflowSettings(result.settings));
      setMessage("Настройки заявок сохранены.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8 space-y-6 pb-12">
      <div className="grid gap-5 md:grid-cols-3">
        <Metric label="Всего статусов" value={String(statusCount)} />
        <Metric label="Курьер" value={String(settings.courierStatuses.length)} />
        <Metric label="Самовывоз" value={String(settings.pickupStatuses.length)} />
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.04em]">Поведение при смене получения</h2>
            <p className="mt-2 text-sm text-white/50">
              Когда менеджер меняет курьера на самовывоз или наоборот, выбирается стартовый статус нового способа.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <input
              type="checkbox"
              checked={settings.resetStatusOnDeliveryChange}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  resetStatusOnDeliveryChange: event.target.checked,
                }))
              }
              className="h-4 w-4"
            />
            <span className="text-sm font-semibold">Автоматически менять статус</span>
          </label>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <StatusEditor
          title="Курьерская доставка"
          description="Статусы для заявок с доставкой курьером."
          listKey="courierStatuses"
          defaultKey="defaultCourierStatus"
          statuses={settings.courierStatuses}
          defaultStatus={settings.defaultCourierStatus}
          onDefaultChange={(value) => setSettings((current) => ({ ...current, defaultCourierStatus: value }))}
          onUpdate={updateStatus}
          onAdd={addStatus}
          onRemove={removeStatus}
          onMove={moveStatus}
        />
        <StatusEditor
          title="Самовывоз / ПВЗ"
          description="Статусы для заявок с получением в магазине или ПВЗ."
          listKey="pickupStatuses"
          defaultKey="defaultPickupStatus"
          statuses={settings.pickupStatuses}
          defaultStatus={settings.defaultPickupStatus}
          onDefaultChange={(value) => setSettings((current) => ({ ...current, defaultPickupStatus: value }))}
          onUpdate={updateStatus}
          onAdd={addStatus}
          onRemove={removeStatus}
          onMove={moveStatus}
        />
      </div>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#07101d]/95 p-4 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-white/60">{message || "После сохранения статусы сразу появятся в заявках."}</div>
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Сохраняем..." : "Сохранить настройки"}
        </button>
      </div>
    </section>
  );
}

function StatusEditor({
  title,
  description,
  listKey,
  defaultKey,
  statuses,
  defaultStatus,
  onDefaultChange,
  onUpdate,
  onAdd,
  onRemove,
  onMove,
}: {
  title: string;
  description: string;
  listKey: StatusListKey;
  defaultKey: DefaultKey;
  statuses: OrderWorkflowStatus[];
  defaultStatus: string;
  onDefaultChange: (value: string) => void;
  onUpdate: (listKey: StatusListKey, index: number, patch: Partial<OrderWorkflowStatus>) => void;
  onAdd: (listKey: StatusListKey) => void;
  onRemove: (listKey: StatusListKey, defaultKey: DefaultKey, index: number) => void;
  onMove: (listKey: StatusListKey, index: number, direction: -1 | 1) => void;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.04em]">{title}</h2>
          <p className="mt-2 text-sm text-white/50">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(listKey)}
          className="shrink-0 rounded-xl border border-blue-500/35 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-500/20"
        >
          + Статус
        </button>
      </div>

      <label className="mt-5 block">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Стартовый статус</span>
        <select
          value={defaultStatus}
          onChange={(event) => onDefaultChange(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#07101d] px-4 text-sm text-white outline-none focus:border-blue-500/50"
        >
          {statuses.filter((status) => status.active).map((status) => (
            <option key={status.id} value={status.id}>{status.label}</option>
          ))}
        </select>
      </label>

      <div className="mt-5 space-y-3">
        {statuses.map((status, index) => (
          <div key={`${status.id}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
              <label>
                <span className="text-xs text-white/45">Название</span>
                <input
                  value={status.label}
                  onChange={(event) => {
                    const label = event.target.value;
                    const patch: Partial<OrderWorkflowStatus> = { label };
                    if (status.id.startsWith("status_")) patch.id = slugifyStatus(label) || status.id;
                    onUpdate(listKey, index, patch);
                  }}
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#07101d] px-3 text-sm text-white outline-none focus:border-blue-500/50"
                />
              </label>
              <label>
                <span className="text-xs text-white/45">Цвет</span>
                <select
                  value={status.color}
                  onChange={(event) => onUpdate(listKey, index, { color: event.target.value as OrderStatusColor })}
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#07101d] px-3 text-sm text-white outline-none"
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label>
                <span className="text-xs text-white/45">Системный код</span>
                <input
                  value={status.id}
                  onChange={(event) => onUpdate(listKey, index, { id: slugifyStatus(event.target.value) })}
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#07101d] px-3 font-mono text-xs text-white/70 outline-none focus:border-blue-500/50"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 text-xs">
                  <input
                    type="checkbox"
                    checked={status.active}
                    onChange={(event) => onUpdate(listKey, index, { active: event.target.checked })}
                  />
                  Активен
                </label>
                <button type="button" onClick={() => onMove(listKey, index, -1)} disabled={index === 0} className="h-11 rounded-xl border border-white/10 px-3 disabled:opacity-30">↑</button>
                <button type="button" onClick={() => onMove(listKey, index, 1)} disabled={index === statuses.length - 1} className="h-11 rounded-xl border border-white/10 px-3 disabled:opacity-30">↓</button>
                <button type="button" onClick={() => onRemove(listKey, defaultKey, index)} disabled={statuses.length <= 1} className="h-11 rounded-xl border border-red-500/30 px-3 text-red-300 disabled:opacity-30">Удалить</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
      <div className="text-sm text-white/45">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-[-0.04em]">{value}</div>
    </div>
  );
}
