"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  getDefaultOrderStatus,
  getOrderStatusOptions,
  type OrderWorkflowSettings,
} from "@/lib/order-status";

type OrderStatusFormProps = {
  orderId: string;
  initialStatus: string;
  initialComment: string;
  initialDeliveryType: string;
  initialAddress: string;
  initialPickupPoint: string;
  workflow: OrderWorkflowSettings;
};

export function OrderStatusForm({
  orderId,
  initialStatus,
  initialComment,
  initialDeliveryType,
  initialAddress,
  initialPickupPoint,
  workflow,
}: OrderStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [comment, setComment] = useState(initialComment);
  const [deliveryType, setDeliveryType] = useState(initialDeliveryType === "pickup" ? "pickup" : "courier");
  const [address, setAddress] = useState(initialAddress);
  const [pickupPoint, setPickupPoint] = useState(initialPickupPoint);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const statusOptions = useMemo(
    () => getOrderStatusOptions(deliveryType, workflow, status),
    [deliveryType, workflow, status],
  );

  function changeDeliveryType(nextType: "courier" | "pickup") {
    setDeliveryType(nextType);
    const nextOptions = getOrderStatusOptions(nextType, workflow);
    const statusExists = nextOptions.some((option) => option.value === status);

    if (workflow.resetStatusOnDeliveryChange || !statusExists) {
      setStatus(getDefaultOrderStatus(nextType, workflow));
    }

    setMessage("");
  }

  async function saveOrder() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          comment,
          deliveryType,
          address,
          pickupPoint,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Не удалось сохранить заявку.");
      }

      setMessage("Сохранено");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
      <div className="text-xs font-semibold uppercase tracking-[0.34em] text-blue-400">
        Управление
      </div>

      <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em]">
        Заявка
      </h2>

      <div className="mt-5 space-y-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Способ получения
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => changeDeliveryType("courier")}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                deliveryType === "courier"
                  ? "border-blue-500/60 bg-blue-500/15 text-blue-300"
                  : "border-white/10 bg-black/20 text-white/55 hover:text-white"
              }`}
            >
              Курьер
            </button>
            <button
              type="button"
              onClick={() => changeDeliveryType("pickup")}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                deliveryType === "pickup"
                  ? "border-blue-500/60 bg-blue-500/15 text-blue-300"
                  : "border-white/10 bg-black/20 text-white/55 hover:text-white"
              }`}
            >
              Самовывоз
            </button>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            {deliveryType === "pickup" ? "Пункт выдачи" : "Адрес доставки"}
          </span>
          <input
            value={deliveryType === "pickup" ? pickupPoint : address}
            onChange={(event) =>
              deliveryType === "pickup" ? setPickupPoint(event.target.value) : setAddress(event.target.value)
            }
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-blue-500/50"
            placeholder={deliveryType === "pickup" ? "Название или адрес ПВЗ" : "Город, улица, дом, квартира"}
          />
        </label>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Статус
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  status === option.value
                    ? "border-blue-500/60 bg-blue-500/15 text-blue-300"
                    : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Комментарий менеджера / клиента
          </span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={5}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-blue-500/50"
            placeholder="Например: клиент ждёт звонка после 18:00"
          />
        </label>

        <button
          type="button"
          onClick={saveOrder}
          disabled={isSaving}
          className="w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Сохраняем..." : "Сохранить заявку"}
        </button>

        {message && <div className="text-sm text-white/55">{message}</div>}
      </div>
    </div>
  );
}
