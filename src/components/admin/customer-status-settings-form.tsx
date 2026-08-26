"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  CustomerStatusRules,
  StatusDiscountTier,
} from "@/lib/customer-status-types";

type SaveState = "idle" | "saving" | "saved" | "error";
type TierKey = "regularDiscountTiers" | "vipDiscountTiers";

export function CustomerStatusSettingsForm({
  initialRules,
}: {
  initialRules: CustomerStatusRules;
}) {
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState("");

  function update<K extends keyof CustomerStatusRules>(key: K, value: CustomerStatusRules[K]) {
    setRules((current) => ({ ...current, [key]: value }));
  }

  function updateNumber(key: keyof CustomerStatusRules, value: number) {
    update(key, Math.max(0, Math.round(value || 0)) as CustomerStatusRules[typeof key]);
  }

  function addTier(key: TierKey, prefix: string) {
    setRules((current) => {
      const tiers = current[key];
      const last = tiers[tiers.length - 1];
      const next: StatusDiscountTier = {
        id: `${prefix}-${Date.now()}`,
        minOrderTotal: last ? last.minOrderTotal + 10000 : 10000,
        minItemPrice: last?.minItemPrice ?? 0,
        discountType: last?.discountType ?? "percent",
        discountValue: last ? last.discountValue + 1 : 3,
      };

      return { ...current, [key]: [...tiers, next] };
    });
  }

  function updateTier(key: TierKey, id: string, patch: Partial<StatusDiscountTier>) {
    setRules((current) => ({
      ...current,
      [key]: current[key].map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)),
    }));
  }

  function removeTier(key: TierKey, id: string) {
    setRules((current) => ({
      ...current,
      [key]: current[key].filter((tier) => tier.id !== id),
    }));
  }

  async function save() {
    setState("saving");
    setError("");

    const response = await fetch("/api/admin/customer-status-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as
      | { rules?: CustomerStatusRules; error?: string }
      | null;

    if (!response?.ok || !payload?.rules) {
      setState("error");
      setError(payload?.error || "Не удалось сохранить правила.");
      return;
    }

    setRules(payload.rules);
    setState("saved");
    router.refresh();
    window.setTimeout(() => setState("idle"), 2200);
  }

  return (
    <section className="rounded-[30px] border border-blue-500/25 bg-blue-500/10 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-blue-500">
            Правила статусов и скидок
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">
            Новый → Постоянный → VIP
          </h2>
          <p className="mt-3 max-w-[900px] text-sm leading-relaxed text-muted">
            Статусы считаются по завершённым заказам. Для постоянных и VIP можно
            создать несколько ступеней скидки: например, от 10 000 ₽ — 3%, а от
            50 000 ₽ — уже 5%.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void save()}
          disabled={state === "saving"}
          className="shrink-0 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
        >
          {state === "saving" ? "Сохраняю..." : "Сохранить правила"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RuleField
          label="Заказ учитывается от"
          value={rules.minOrderTotal}
          suffix="₽"
          onChange={(value) => updateNumber("minOrderTotal", value)}
        />
        <RuleField
          label="Постоянный клиент от"
          value={rules.regularOrders}
          suffix="заказов"
          min={1}
          onChange={(value) => updateNumber("regularOrders", value)}
        />
        <RuleField
          label="VIP от количества"
          value={rules.vipOrders}
          suffix="заказов"
          min={1}
          onChange={(value) => updateNumber("vipOrders", value)}
        />
        <RuleField
          label="VIP от суммы"
          value={rules.vipTotalSpent}
          suffix="₽"
          onChange={(value) => updateNumber("vipTotalSpent", value)}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <StatusDiscountTiersEditor
          title="Скидки постоянного клиента"
          description="Выбирается самая высокая подходящая ступень по сумме текущего заказа."
          enabled={rules.regularDiscountEnabled}
          tiers={rules.regularDiscountTiers}
          onEnabled={(value) => update("regularDiscountEnabled", value)}
          onAdd={() => addTier("regularDiscountTiers", "regular")}
          onUpdate={(id, patch) => updateTier("regularDiscountTiers", id, patch)}
          onRemove={(id) => removeTier("regularDiscountTiers", id)}
        />

        <StatusDiscountTiersEditor
          title="Скидки VIP"
          description="Для VIP можно сделать отдельные, более выгодные ступени скидки."
          enabled={rules.vipDiscountEnabled}
          tiers={rules.vipDiscountTiers}
          onEnabled={(value) => update("vipDiscountEnabled", value)}
          onAdd={() => addTier("vipDiscountTiers", "vip")}
          onUpdate={(id, patch) => updateTier("vipDiscountTiers", id, patch)}
          onRemove={(id) => removeTier("vipDiscountTiers", id)}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-muted">
        При промокоде правило задаётся в самом промокоде: можно разрешить его вместе
        со скидкой статуса либо оставить только более выгодную скидку.
      </div>

      {state === "saved" ? (
        <div className="mt-4 text-sm text-green-500">Правила сохранены.</div>
      ) : null}
      {state === "error" ? <div className="mt-4 text-sm text-red-500">{error}</div> : null}
    </section>
  );
}

function StatusDiscountTiersEditor({
  title,
  description,
  enabled,
  tiers,
  onEnabled,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  description: string;
  enabled: boolean;
  tiers: StatusDiscountTier[];
  onEnabled: (value: boolean) => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<StatusDiscountTier>) => void;
  onRemove: (id: string) => void;
}) {
  const sortedTiers = [...tiers].sort((first, second) => first.minOrderTotal - second.minOrderTotal);

  return (
    <div className="rounded-2xl border border-theme bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-bold">{title}</div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabled(event.target.checked)}
          className="mt-1 h-5 w-5 accent-blue-600"
        />
      </div>

      <div className={`mt-5 grid gap-3 ${enabled ? "" : "pointer-events-none opacity-45"}`}>
        {sortedTiers.map((tier, index) => (
          <div key={tier.id} className="rounded-2xl border border-theme bg-page p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Ступень {index + 1}</div>
              <button
                type="button"
                onClick={() => onRemove(tier.id)}
                disabled={tiers.length <= 1}
                className="rounded-lg border border-red-500/25 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Удалить
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <CompactNumberField
                label="Заказ от"
                value={tier.minOrderTotal}
                suffix="₽"
                onChange={(value) => onUpdate(tier.id, { minOrderTotal: value })}
              />
              <CompactNumberField
                label="Товар от"
                value={tier.minItemPrice}
                suffix="₽"
                onChange={(value) => onUpdate(tier.id, { minItemPrice: value })}
              />
              <label className="rounded-xl border border-theme bg-card p-3">
                <span className="text-xs text-muted">Тип скидки</span>
                <select
                  value={tier.discountType}
                  onChange={(event) =>
                    onUpdate(tier.id, {
                      discountType: event.target.value === "fixed" ? "fixed" : "percent",
                    })
                  }
                  className="mt-2 h-9 w-full bg-transparent text-sm font-semibold outline-none"
                >
                  <option value="percent">Проценты</option>
                  <option value="fixed">Рубли</option>
                </select>
              </label>
              <CompactNumberField
                label="Размер скидки"
                value={tier.discountValue}
                suffix={tier.discountType === "percent" ? "%" : "₽"}
                max={tier.discountType === "percent" ? 100 : undefined}
                onChange={(value) => onUpdate(tier.id, { discountValue: value })}
              />
            </div>

            <div className="mt-3 rounded-xl border border-blue-500/15 bg-blue-500/5 px-3 py-2 text-xs text-muted">
              От {tier.minOrderTotal.toLocaleString("ru-RU")} ₽ — скидка {tier.discountValue.toLocaleString("ru-RU")}
              {tier.discountType === "percent" ? "%" : " ₽"}
              {tier.minItemPrice > 0
                ? ` на товары от ${tier.minItemPrice.toLocaleString("ru-RU")} ₽`
                : " на все товары"}.
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl border border-dashed border-blue-500/35 bg-blue-500/5 px-4 py-3 text-sm font-semibold text-blue-500 transition-colors hover:bg-blue-500/10"
        >
          + Добавить ступень скидки
        </button>
      </div>
    </div>
  );
}

function CompactNumberField({
  label,
  value,
  suffix,
  min = 0,
  max,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-xl border border-theme bg-card p-3">
      <span className="text-xs text-muted">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const next = Math.max(min, Math.round(Number(event.target.value) || 0));
            onChange(max === undefined ? next : Math.min(max, next));
          }}
          className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none"
        />
        <span className="text-xs text-muted">{suffix}</span>
      </div>
    </label>
  );
}

function RuleField({
  label,
  value,
  suffix,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-2xl border border-theme bg-card p-4">
      <span className="text-xs text-muted">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="number"
          min={min}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none"
        />
        <span className="text-sm text-muted">{suffix}</span>
      </div>
    </label>
  );
}
