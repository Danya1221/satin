"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getDefaultOrderStatus,
  getOrderStatusOptions,
  type OrderStatusColor,
  type OrderWorkflowSettings,
} from "@/lib/order-status";

export type OrderCustomerOption = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  addresses: Array<{ id: string; type: string; value: string; isDefault: boolean }>;
};

export type OrderPositionOption = {
  id: string;
  productId: string;
  sku: string;
  title: string;
  productTitle: string;
  brand: string;
  memory: string;
  color: string;
  sim: string;
  price: number;
  stock: number;
  status: string;
  image: string;
};

export type OrderStaffOption = { id: string; name: string; login: string };

type DraftItem = {
  variantId: string;
  quantity: number;
  price: number;
};

type InitialOrder = {
  publicId: string;
  customerId: string;
  customerName: string;
  phone: string;
  email: string;
  deliveryType: "courier" | "pickup";
  address: string;
  pickupPoint: string;
  paymentMethod: string;
  status: string;
  comment: string;
  managerComment: string;
  assignedToId: string;
  items: DraftItem[];
};



function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9@+._-]+/gi, " ")
    .trim();
}

function positionLabel(position: OrderPositionOption) {
  return `${position.productTitle} · ${position.sku}`;
}

export function OrderEditorForm({
  mode,
  customers,
  positions,
  staff,
  initialOrder,
  defaultAssigneeId = "",
  defaultAssigneeName = "",
  workflow,
}: {
  mode: "create" | "edit";
  customers: OrderCustomerOption[];
  positions: OrderPositionOption[];
  staff: OrderStaffOption[];
  initialOrder?: InitialOrder;
  defaultAssigneeId?: string;
  defaultAssigneeName?: string;
  workflow: OrderWorkflowSettings;
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(initialOrder?.customerId || "");
  const [customerName, setCustomerName] = useState(initialOrder?.customerName || "");
  const [phone, setPhone] = useState(initialOrder?.phone || "");
  const [email, setEmail] = useState(initialOrder?.email || "");
  const [deliveryType, setDeliveryType] = useState<"courier" | "pickup">(initialOrder?.deliveryType || "courier");
  const [address, setAddress] = useState(initialOrder?.address || "");
  const [pickupPoint, setPickupPoint] = useState(initialOrder?.pickupPoint || "");
  const [paymentMethod, setPaymentMethod] = useState(initialOrder?.paymentMethod || "cash");
  const [status, setStatus] = useState(
    initialOrder?.status || getDefaultOrderStatus(initialOrder?.deliveryType || "courier", workflow),
  );
  const [comment, setComment] = useState(initialOrder?.comment || "");
  const [managerComment, setManagerComment] = useState(initialOrder?.managerComment || "");
  const [assignedToId, setAssignedToId] = useState(initialOrder?.assignedToId || defaultAssigneeId);
  const [items, setItems] = useState<DraftItem[]>(
    initialOrder?.items?.length
      ? initialOrder.items
      : positions.length
        ? [{ variantId: "", quantity: 1, price: 0 }]
        : [],
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const positionMap = useMemo(() => new Map(positions.map((position) => [position.id, position])), [positions]);
  const staffMap = useMemo(() => new Map(staff.map((member) => [member.id, member])), [staff]);
  const selectedAssignee = staffMap.get(assignedToId);
  const assigneeLabel =
    selectedAssignee?.name ||
    selectedAssignee?.login ||
    (assignedToId === defaultAssigneeId ? defaultAssigneeName : "") ||
    "Назначится автоматически";
  const total = items.reduce((sum, item) => sum + Math.max(1, item.quantity) * Math.max(0, item.price), 0);
  const orderStatuses = useMemo(
    () => getOrderStatusOptions(deliveryType, workflow, status),
    [deliveryType, workflow, status],
  );

  function chooseCustomer(id: string) {
    setCustomerId(id);
    const customer = customers.find((item) => item.id === id);
    if (!customer) return;
    setCustomerName(customer.fullName);
    setPhone(customer.phone);
    setEmail(customer.email);
    const preferredAddress = customer.addresses.find((item) => item.isDefault) || customer.addresses[0];
    if (preferredAddress) {
      if (preferredAddress.type === "pickup") {
        changeDeliveryType("pickup");
        setPickupPoint(preferredAddress.value);
      } else {
        changeDeliveryType("courier");
        setAddress(preferredAddress.value);
      }
    }
  }

  function startNewCustomer() {
    setCustomerId("");
    setCustomerName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setPickupPoint("");
  }

  function changePosition(index: number, variantId: string) {
    const position = positionMap.get(variantId);
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              variantId,
              quantity: item.quantity || 1,
              price: position?.price || 0,
            }
          : item,
      ),
    );
  }

  function changeDeliveryType(nextType: "courier" | "pickup") {
    setDeliveryType(nextType);
    const nextOptions = getOrderStatusOptions(nextType, workflow);
    const statusExists = nextOptions.some((option) => option.value === status);
    if (workflow.resetStatusOnDeliveryChange || !statusExists) {
      setStatus(getDefaultOrderStatus(nextType, workflow));
    }
    setMessage("");
  }

  function changeStatus(nextStatus: string) {
    setStatus(nextStatus);
    if (defaultAssigneeId) setAssignedToId(defaultAssigneeId);
  }

  async function submit() {
    if (!customerName.trim() || !phone.trim()) {
      setMessage("Укажи имя и телефон клиента.");
      return;
    }
    if (!items.length) {
      setMessage("Добавь хотя бы один товар.");
      return;
    }
    if (items.some((item) => !item.variantId || !positionMap.has(item.variantId))) {
      setMessage("Выбери позицию / SKU в каждой строке товара.");
      return;
    }
    if (!window.confirm(mode === "create" ? "Создать заявку?" : "Сохранить изменения заявки?")) return;

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        mode === "create" ? "/api/admin/orders" : `/api/admin/orders/${initialOrder?.publicId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId,
            customerName,
            phone,
            email,
            deliveryType,
            address,
            pickupPoint,
            paymentMethod,
            status,
            comment,
            managerComment,
            items,
          }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        order?: { publicId?: string };
      };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Не удалось сохранить заявку.");

      const publicId = payload.order?.publicId || initialOrder?.publicId;
      if (publicId) {
        router.push(`/nz-console/orders/${publicId}`);
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
            {mode === "create" ? "Новая заявка" : "Редактор заявки"}
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.045em]">
            {mode === "create" ? "Создать вручную" : "Изменить данные и товары"}
          </h2>
          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Статус</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {orderStatuses.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => changeStatus(item.value)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    status === item.value
                      ? activeStatusClass(item.color)
                      : "border-white/10 bg-black/20 text-white/65 hover:border-blue-500/40 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Link href="/nz-console/orders" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/65">
          К списку
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Найти существующего клиента">
          <CustomerSearch
            customers={customers}
            value={customerId}
            onChoose={chooseCustomer}
            onNew={startNewCustomer}
          />
        </Field>
        <Field label="Имя клиента"><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} /></Field>
        <Field label="Телефон"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></Field>
        <Field label="E-mail"><input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></Field>
        <Field label="Ответственный">
          <div className="mt-2 flex h-12 items-center rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 text-sm font-semibold text-blue-200">
            {assigneeLabel}
          </div>
          <div className="mt-1.5 text-[11px] leading-relaxed text-white/40">
            При создании и смене статуса назначается текущий сотрудник.
          </div>
        </Field>
        <Field label="Способ получения">
          <select value={deliveryType} onChange={(e) => changeDeliveryType(e.target.value as "courier" | "pickup")} className={inputClass}>
            <option value="courier">Курьерская доставка</option><option value="pickup">ПВЗ / самовывоз</option>
          </select>
        </Field>
        {deliveryType === "courier" ? (
          <Field label="Адрес доставки"><input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} /></Field>
        ) : (
          <Field label="ПВЗ / точка самовывоза"><input value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)} className={inputClass} /></Field>
        )}
        <Field label="Оплата">
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
            <option value="cash">Наличными при получении</option><option value="card_on_delivery">Картой при получении</option>
            <option value="bank_transfer">Перевод / счёт</option>
          </select>
        </Field>
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Товары и SKU</h3>
          <button
            type="button"
            disabled={!positions.length}
            onClick={() => setItems((current) => [...current, { variantId: "", quantity: 1, price: 0 }])}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            + Добавить товар
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {items.map((item, index) => {
            const position = positionMap.get(item.variantId);
            return (
              <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-[minmax(320px,1fr)_120px_150px_auto] lg:items-end">
                <Field label="Найти позицию / SKU">
                  <PositionSearch
                    positions={positions}
                    value={item.variantId}
                    onChoose={(variantId) => changePosition(index, variantId)}
                  />
                </Field>
                <Field label="Количество"><input type="number" min={1} max={position?.stock || undefined} value={item.quantity} onChange={(e) => setItems((current) => current.map((value, i) => i === index ? { ...value, quantity: Math.max(1, Number(e.target.value) || 1) } : value))} className={inputClass} /></Field>
                <Field label="Цена, ₽"><input type="number" min={1} value={item.price || ""} onChange={(e) => setItems((current) => current.map((value, i) => i === index ? { ...value, price: Math.max(0, Number(e.target.value) || 0) } : value))} className={inputClass} /></Field>
                <button type="button" onClick={() => setItems((current) => current.filter((_, i) => i !== index))} className="h-12 rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-sm text-red-200">Удалить</button>
                {position ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/45 lg:col-span-4">
                    <span>{position.brand}</span><span>{position.memory}</span><span>{position.color}</span><span>{position.sim}</span>
                    <span className={position.stock > 0 ? "text-green-400" : "text-red-300"}>Остаток: {position.stock}</span>
                  </div>
                ) : (
                  <div className="text-xs text-white/35 lg:col-span-4">Начни вводить название товара, SKU, цвет, память или SIM.</div>
                )}
              </div>
            );
          })}
          {!items.length ? <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-white/45">Товары не добавлены.</div> : null}
        </div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <Field label="Комментарий клиента"><textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className={textareaClass} /></Field>
        <Field label="Внутренний комментарий менеджера"><textarea value={managerComment} onChange={(e) => setManagerComment(e.target.value)} rows={4} className={textareaClass} /></Field>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-2xl font-bold">Итого: {new Intl.NumberFormat("ru-RU").format(total)} ₽</div>
        <button type="button" onClick={() => void submit()} disabled={saving} className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">
          {saving ? "Сохраняю..." : mode === "create" ? "Создать заявку" : "Сохранить изменения"}
        </button>
      </div>
      {message ? <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{message}</div> : null}
    </div>
  );
}

function CustomerSearch({
  customers,
  value,
  onChoose,
  onNew,
}: {
  customers: OrderCustomerOption[];
  value: string;
  onChoose: (id: string) => void;
  onNew: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = customers.find((item) => item.id === value);
  const [query, setQuery] = useState(selected ? `${selected.fullName} · ${selected.phone}` : "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const next = customers.find((item) => item.id === value);
    if (next) setQuery(`${next.fullName} · ${next.phone}`);
    if (!value && selected) setQuery("");
  }, [customers, selected, value]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return customers.slice(0, 12);
    return customers
      .filter((item) => normalizeSearch(`${item.fullName} ${item.phone} ${item.email} ${item.city}`).includes(needle))
      .slice(0, 20);
  }, [customers, query]);

  return (
    <div ref={rootRef} className="relative mt-2">
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        placeholder="Имя, телефон или e-mail"
        autoComplete="off"
        className={searchInputClass}
      />
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[120] max-h-80 overflow-y-auto rounded-2xl border border-white/15 bg-[#07111f] p-1.5 shadow-2xl shadow-black/40">
          <button
            type="button"
            onClick={() => {
              onNew();
              setQuery("");
              setOpen(false);
            }}
            className="w-full rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-3 text-left text-sm font-semibold text-blue-200 hover:bg-blue-500/15"
          >
            + Новый клиент / заполнить вручную
          </button>
          <div className="mt-1 grid gap-1">
            {filtered.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  onChoose(customer.id);
                  setQuery(`${customer.fullName} · ${customer.phone}`);
                  setOpen(false);
                }}
                className="rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.07]"
              >
                <div className="text-sm font-semibold text-white">{customer.fullName}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/45">
                  <span>{customer.phone || "Телефон не указан"}</span>
                  {customer.email ? <span>{customer.email}</span> : null}
                  {customer.city ? <span>{customer.city}</span> : null}
                </div>
              </button>
            ))}
            {!filtered.length ? <div className="px-3 py-5 text-sm text-white/45">Клиенты не найдены.</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PositionSearch({
  positions,
  value,
  onChoose,
}: {
  positions: OrderPositionOption[];
  value: string;
  onChoose: (id: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = positions.find((item) => item.id === value);
  const [query, setQuery] = useState(selected ? positionLabel(selected) : "");
  const [open, setOpen] = useState(false);
  const skipValueSyncRef = useRef(false);

  useEffect(() => {
    if (skipValueSyncRef.current && !value) {
      skipValueSyncRef.current = false;
      return;
    }
    const next = positions.find((item) => item.id === value);
    setQuery(next ? positionLabel(next) : "");
  }, [positions, value]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return positions.slice(0, 15);
    return positions
      .filter((item) =>
        normalizeSearch(`${item.productTitle} ${item.title} ${item.sku} ${item.brand} ${item.memory} ${item.color} ${item.sim}`).includes(needle),
      )
      .slice(0, 30);
  }, [positions, query]);

  return (
    <div ref={rootRef} className="relative mt-2">
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          if (value) {
            skipValueSyncRef.current = true;
            onChoose("");
          }
          setOpen(true);
        }}
        placeholder="Название, SKU, цвет, память или SIM"
        autoComplete="off"
        className={searchInputClass}
      />
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[130] max-h-96 overflow-y-auto rounded-2xl border border-white/15 bg-[#07111f] p-1.5 shadow-2xl shadow-black/40">
          {filtered.map((position) => (
            <button
              key={position.id}
              type="button"
              onClick={() => {
                onChoose(position.id);
                setQuery(positionLabel(position));
                setOpen(false);
              }}
              className="w-full rounded-xl px-3 py-3 text-left hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{position.productTitle}</div>
                  <div className="mt-1 truncate text-xs text-blue-300">{position.sku}</div>
                </div>
                <div className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${position.stock > 0 ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                  {position.stock > 0 ? `Остаток ${position.stock}` : "Нет в наличии"}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/45">
                <span>{position.brand}</span><span>{position.memory}</span><span>{position.color}</span><span>{position.sim}</span>
                <span>{new Intl.NumberFormat("ru-RU").format(position.price)} ₽</span>
              </div>
            </button>
          ))}
          {!filtered.length ? <div className="px-3 py-5 text-sm text-white/45">Позиции не найдены.</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function activeStatusClass(color: OrderStatusColor) {
  const classes: Record<OrderStatusColor, string> = {
    blue: "border-blue-400 bg-blue-600 text-white",
    orange: "border-orange-400 bg-orange-500 text-white",
    purple: "border-purple-400 bg-purple-600 text-white",
    cyan: "border-cyan-400 bg-cyan-600 text-white",
    green: "border-green-400 bg-green-500 text-white",
    red: "border-red-400 bg-red-500 text-white",
    gray: "border-white/30 bg-white/20 text-white",
  };
  return classes[color];
}

const inputClass = "mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-blue-500/50";
const searchInputClass = "h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-500/50";
const textareaClass = "mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{label}</span>{children}</label>;
}
