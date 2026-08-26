export type OrderDeliveryKind = "courier" | "pickup" | string | null | undefined;

export type OrderStatusColor =
  | "blue"
  | "orange"
  | "purple"
  | "cyan"
  | "green"
  | "red"
  | "gray";

export type OrderWorkflowStatus = {
  id: string;
  label: string;
  color: OrderStatusColor;
  active: boolean;
  sortOrder: number;
};

export type OrderWorkflowSettings = {
  courierStatuses: OrderWorkflowStatus[];
  pickupStatuses: OrderWorkflowStatus[];
  defaultCourierStatus: string;
  defaultPickupStatus: string;
  resetStatusOnDeliveryChange: boolean;
};

const baseStatuses: Array<Omit<OrderWorkflowStatus, "label">> = [
  { id: "new", color: "blue", active: true, sortOrder: 10 },
  { id: "confirming", color: "orange", active: true, sortOrder: 20 },
  { id: "in_work", color: "purple", active: true, sortOrder: 30 },
  { id: "ready", color: "cyan", active: true, sortOrder: 40 },
  { id: "completed", color: "green", active: true, sortOrder: 50 },
  { id: "cancelled", color: "red", active: true, sortOrder: 60 },
];

const pickupLabels: Record<string, string> = {
  new: "Новая заявка",
  confirming: "Ожидает подтверждения",
  in_work: "Комплектуем",
  ready: "Готова к выдаче",
  completed: "Выдана",
  cancelled: "Отменена",
};

const courierLabels: Record<string, string> = {
  new: "Новая заявка",
  confirming: "Ожидает подтверждения",
  in_work: "Собираем заказ",
  ready: "Передана курьеру",
  completed: "Доставлена",
  cancelled: "Отменена",
};

export const defaultOrderWorkflowSettings: OrderWorkflowSettings = {
  courierStatuses: baseStatuses.map((status) => ({
    ...status,
    label: courierLabels[status.id] ?? status.id,
  })),
  pickupStatuses: baseStatuses.map((status) => ({
    ...status,
    label: pickupLabels[status.id] ?? status.id,
  })),
  defaultCourierStatus: "new",
  defaultPickupStatus: "new",
  resetStatusOnDeliveryChange: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeStatusId(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

function normalizeColor(value: unknown): OrderStatusColor {
  const allowed: OrderStatusColor[] = ["blue", "orange", "purple", "cyan", "green", "red", "gray"];
  return allowed.includes(value as OrderStatusColor) ? (value as OrderStatusColor) : "gray";
}

function normalizeStatuses(value: unknown, fallback: OrderWorkflowStatus[]) {
  if (!Array.isArray(value)) return fallback.map((status) => ({ ...status }));

  const seen = new Set<string>();
  const normalized = value
    .map((item, index): OrderWorkflowStatus | null => {
      if (!isRecord(item)) return null;

      const id = normalizeStatusId(item.id);
      const label = String(item.label ?? "").trim().slice(0, 80);
      if (!id || !label || seen.has(id)) return null;
      seen.add(id);

      const sortOrder = Number(item.sortOrder);
      return {
        id,
        label,
        color: normalizeColor(item.color),
        active: item.active !== false,
        sortOrder: Number.isFinite(sortOrder) ? Math.round(sortOrder) : (index + 1) * 10,
      };
    })
    .filter((status): status is OrderWorkflowStatus => Boolean(status))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return normalized.length ? normalized : fallback.map((status) => ({ ...status }));
}

export function normalizeOrderWorkflowSettings(value: unknown): OrderWorkflowSettings {
  const raw = isRecord(value) ? value : {};
  const courierStatuses = normalizeStatuses(raw.courierStatuses, defaultOrderWorkflowSettings.courierStatuses);
  const pickupStatuses = normalizeStatuses(raw.pickupStatuses, defaultOrderWorkflowSettings.pickupStatuses);

  const requestedCourierDefault = normalizeStatusId(raw.defaultCourierStatus);
  const requestedPickupDefault = normalizeStatusId(raw.defaultPickupStatus);

  return {
    courierStatuses,
    pickupStatuses,
    defaultCourierStatus:
      courierStatuses.find((status) => status.id === requestedCourierDefault && status.active)?.id ??
      courierStatuses.find((status) => status.active)?.id ??
      courierStatuses[0].id,
    defaultPickupStatus:
      pickupStatuses.find((status) => status.id === requestedPickupDefault && status.active)?.id ??
      pickupStatuses.find((status) => status.active)?.id ??
      pickupStatuses[0].id,
    resetStatusOnDeliveryChange: raw.resetStatusOnDeliveryChange !== false,
  };
}

export function getStatusesForDelivery(
  deliveryType?: OrderDeliveryKind,
  workflow: OrderWorkflowSettings = defaultOrderWorkflowSettings,
) {
  return deliveryType === "pickup" ? workflow.pickupStatuses : workflow.courierStatuses;
}

export function getDefaultOrderStatus(
  deliveryType?: OrderDeliveryKind,
  workflow: OrderWorkflowSettings = defaultOrderWorkflowSettings,
) {
  return deliveryType === "pickup" ? workflow.defaultPickupStatus : workflow.defaultCourierStatus;
}

export function getOrderStatusOptions(
  deliveryType?: OrderDeliveryKind,
  workflow: OrderWorkflowSettings = defaultOrderWorkflowSettings,
  currentStatus?: string,
) {
  return getStatusesForDelivery(deliveryType, workflow)
    .filter((status) => status.active || status.id === currentStatus)
    .map((status) => ({ value: status.id, label: status.label, color: status.color }));
}

export function getOrderStatusLabel(
  status: string,
  deliveryType?: OrderDeliveryKind,
  workflow: OrderWorkflowSettings = defaultOrderWorkflowSettings,
) {
  return getStatusesForDelivery(deliveryType, workflow).find((item) => item.id === status)?.label ?? status;
}

export function getOrderStatusClass(
  status: string,
  workflow: OrderWorkflowSettings = defaultOrderWorkflowSettings,
  deliveryType?: OrderDeliveryKind,
) {
  const color = getStatusesForDelivery(deliveryType, workflow).find((item) => item.id === status)?.color ?? "gray";

  const classes: Record<OrderStatusColor, string> = {
    blue: "border-blue-500/35 bg-blue-500/10 text-blue-400",
    orange: "border-orange-500/35 bg-orange-500/10 text-orange-300",
    purple: "border-purple-500/35 bg-purple-500/10 text-purple-300",
    cyan: "border-cyan-500/35 bg-cyan-500/10 text-cyan-300",
    green: "border-green-500/35 bg-green-500/10 text-green-300",
    red: "border-red-500/35 bg-red-500/10 text-red-300",
    gray: "border-white/10 bg-white/[0.03] text-white/55",
  };

  return classes[color];
}

export function getCombinedOrderStatuses(workflow: OrderWorkflowSettings) {
  const result: Array<{ value: string; label: string }> = [];
  const seen = new Set<string>();

  for (const status of [...workflow.courierStatuses, ...workflow.pickupStatuses]) {
    if (status.active && !seen.has(status.id)) {
      seen.add(status.id);
      result.push({ value: status.id, label: status.label });
    }
  }

  return result;
}
