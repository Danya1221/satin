"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { CustomerStatus } from "@/lib/customer-status-types";

type Promo = {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number;
  minOrderTotal: number;
  minItemPrice: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number;
  perCustomerLimit: number;
  firstOrderOnly: boolean;
  minCompletedOrders: number;
  minTotalSpent: number;
  conditionMode: string;
  allowedStatuses: string[];
  allowWithStatusDiscount: boolean;
  active: boolean;
  _count?: { usages: number };
};

const emptyPromo: Promo = {
  id: "",
  code: "",
  name: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
  maxDiscount: 0,
  minOrderTotal: 0,
  minItemPrice: 0,
  startsAt: null,
  endsAt: null,
  usageLimit: 0,
  perCustomerLimit: 1,
  firstOrderOnly: false,
  minCompletedOrders: 0,
  minTotalSpent: 0,
  conditionMode: "all",
  allowedStatuses: [],
  allowWithStatusDiscount: true,
  active: true,
};

function localDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function PromocodesAdminClient() {
  const [items, setItems] = useState<Promo[]>([]);
  const [selected, setSelected] = useState<Promo>({ ...emptyPromo });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/promocodes", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as { promocodes?: Promo[]; error?: string } | null;
    if (response.ok && payload?.promocodes) {
      setItems(payload.promocodes);
      if (selected.id) {
        const refreshed = payload.promocodes.find((item) => item.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    } else setMessage(payload?.error || "Не удалось загрузить промокоды.");
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patch<K extends keyof Promo>(key: K, value: Promo[K]) {
    setSelected((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const method = selected.id ? "PATCH" : "POST";
    const response = await fetch("/api/admin/promocodes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...selected,
        startsAt: selected.startsAt || null,
        endsAt: selected.endsAt || null,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { promo?: Promo; error?: string } | null;
    if (!response.ok || !payload?.promo) setMessage(payload?.error || "Не удалось сохранить.");
    else {
      setSelected(payload.promo);
      setMessage("Промокод сохранён.");
      await load();
    }
    setSaving(false);
  }

  async function remove() {
    if (!selected.id || !window.confirm("Удалить промокод?")) return;
    const response = await fetch(`/api/admin/promocodes?id=${encodeURIComponent(selected.id)}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Не удалось удалить промокод.");
      return;
    }
    setSelected({ ...emptyPromo });
    setMessage("Промокод удалён.");
    await load();
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <style jsx global>{`
        .promo-admin-input,
        .promo-admin-textarea {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 0.9rem;
          background: rgba(0, 0, 0, 0.22);
          padding: 0.85rem 1rem;
          color: #ffffff;
          outline: none;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background-color 0.2s ease;
        }

        .promo-admin-input {
          min-height: 48px;
        }

        .promo-admin-textarea {
          resize: vertical;
        }

        .promo-admin-input:focus,
        .promo-admin-textarea:focus {
          border-color: rgba(59, 130, 246, 0.72);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
          background: rgba(0, 0, 0, 0.3);
        }

        .promo-admin-input::placeholder,
        .promo-admin-textarea::placeholder {
          color: rgba(255, 255, 255, 0.32);
        }

        .promo-admin-input option {
          background: #050b16;
          color: #ffffff;
        }

        [data-admin-theme="light"] .admin-theme-scope .promo-admin-input,
        [data-admin-theme="light"] .admin-theme-scope .promo-admin-textarea {
          border-color: rgba(15, 23, 42, 0.16) !important;
          background: #ffffff !important;
          color: #101828 !important;
          box-shadow: none;
        }

        [data-admin-theme="light"] .admin-theme-scope .promo-admin-input:focus,
        [data-admin-theme="light"] .admin-theme-scope .promo-admin-textarea:focus {
          border-color: rgba(37, 99, 235, 0.65) !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        [data-admin-theme="light"] .admin-theme-scope .promo-admin-input::placeholder,
        [data-admin-theme="light"] .admin-theme-scope .promo-admin-textarea::placeholder {
          color: rgba(16, 24, 40, 0.4) !important;
        }

        [data-admin-theme="light"] .admin-theme-scope .promo-admin-input option {
          background: #ffffff;
          color: #101828;
        }
      `}</style>
      <aside className="rounded-[28px] border border-white/10 bg-white/[0.035] p-4">
        <button
          type="button"
          onClick={() => setSelected({ ...emptyPromo })}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
        >
          + Создать промокод
        </button>
        <div className="mt-4 grid gap-3">
          {loading ? <div className="p-4 text-sm text-white/45">Загрузка…</div> : null}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className={`rounded-2xl border p-4 text-left ${
                selected.id === item.id
                  ? "border-blue-500/50 bg-blue-500/15"
                  : "border-white/10 bg-black/20 hover:border-blue-500/35"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-bold">{item.code}</div>
                <span className={item.active ? "text-xs text-green-300" : "text-xs text-white/35"}>
                  {item.active ? "Активен" : "Выключен"}
                </span>
              </div>
              <div className="mt-1 text-sm text-white/55">{item.name}</div>
              <div className="mt-2 text-xs text-white/35">Использований: {item._count?.usages ?? 0}</div>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">Промокод</div>
            <h2 className="mt-2 text-3xl font-bold">{selected.id ? selected.code : "Новый промокод"}</h2>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
            <input type="checkbox" checked={selected.active} onChange={(event) => patch("active", event.target.checked)} />
            Активен
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Код">
            <input value={selected.code} onChange={(event) => patch("code", event.target.value.toUpperCase())} className="promo-admin-input" placeholder="NETIZEN10" />
          </Field>
          <Field label="Название">
            <input value={selected.name} onChange={(event) => patch("name", event.target.value)} className="promo-admin-input" placeholder="Скидка 10%" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Описание для менеджера">
              <textarea value={selected.description} onChange={(event) => patch("description", event.target.value)} className="promo-admin-textarea min-h-[110px]" />
            </Field>
          </div>
          <Field label="Тип скидки">
            <select value={selected.discountType} onChange={(event) => patch("discountType", event.target.value)} className="promo-admin-input">
              <option value="percent">Проценты</option>
              <option value="fixed">Рубли</option>
            </select>
          </Field>
          <NumberField label="Размер скидки" value={selected.discountValue} onChange={(value) => patch("discountValue", value)} />
          <NumberField label="Максимальная скидка, ₽ (0 — без лимита)" value={selected.maxDiscount} onChange={(value) => patch("maxDiscount", value)} />
          <NumberField label="Минимальная сумма заказа, ₽" value={selected.minOrderTotal} onChange={(value) => patch("minOrderTotal", value)} />
          <NumberField label="Минимальная цена товара, ₽" value={selected.minItemPrice} onChange={(value) => patch("minItemPrice", value)} />
          <NumberField label="Общий лимит (0 — без лимита)" value={selected.usageLimit} onChange={(value) => patch("usageLimit", value)} />
          <NumberField label="Лимит на клиента (0 — без лимита)" value={selected.perCustomerLimit} onChange={(value) => patch("perCustomerLimit", value)} />
          <NumberField label="После завершённых заказов" value={selected.minCompletedOrders} onChange={(value) => patch("minCompletedOrders", value)} />
          <NumberField label="После суммы покупок, ₽" value={selected.minTotalSpent} onChange={(value) => patch("minTotalSpent", value)} />
          <Field label="Начало действия">
            <input type="datetime-local" value={localDate(selected.startsAt)} onChange={(event) => patch("startsAt", event.target.value || null)} className="promo-admin-input" />
          </Field>
          <Field label="Конец действия">
            <input type="datetime-local" value={localDate(selected.endsAt)} onChange={(event) => patch("endsAt", event.target.value || null)} className="promo-admin-input" />
          </Field>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <input type="checkbox" checked={selected.firstOrderOnly} onChange={(event) => patch("firstOrderOnly", event.target.checked)} />
            Только первый заказ
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <input type="checkbox" checked={selected.allowWithStatusDiscount} onChange={(event) => patch("allowWithStatusDiscount", event.target.checked)} />
            Разрешить вместе со скидкой статуса
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="font-semibold">Условия доступа</div>
          <div className="mt-3 flex flex-wrap gap-4">
            {(["new", "regular", "vip"] as CustomerStatus[]).map((status) => (
              <label key={status} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.allowedStatuses.includes(status)}
                  onChange={(event) =>
                    patch(
                      "allowedStatuses",
                      event.target.checked
                        ? [...selected.allowedStatuses, status]
                        : selected.allowedStatuses.filter((item) => item !== status),
                    )
                  }
                />
                {status === "new" ? "Новый" : status === "regular" ? "Постоянный" : "VIP"}
              </label>
            ))}
          </div>
          <select value={selected.conditionMode} onChange={(event) => patch("conditionMode", event.target.value)} className="promo-admin-input mt-4">
            <option value="all">Все заданные условия должны выполняться</option>
            <option value="any">Достаточно одного условия</option>
          </select>
        </div>

        {message ? <div className="mt-5 rounded-xl border border-blue-500/25 bg-blue-500/10 p-4 text-sm text-blue-200">{message}</div> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {selected.id ? <button type="button" onClick={() => void remove()} className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-200">Удалить</button> : null}
          <button type="button" disabled={saving} onClick={() => void save()} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            {saving ? "Сохраняю…" : "Сохранить промокод"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-white/65">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <Field label={label}><input type="number" min={0} value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} className="promo-admin-input" /></Field>;
}
