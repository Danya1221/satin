export const customerStatusValues = ["new", "regular", "vip"] as const;

export type CustomerStatus = (typeof customerStatusValues)[number];
export type DiscountType = "percent" | "fixed";

export type StatusDiscountTier = {
  id: string;
  minOrderTotal: number;
  minItemPrice: number;
  discountType: DiscountType;
  discountValue: number;
};

export type CustomerStatusRules = {
  minOrderTotal: number;
  regularOrders: number;
  vipOrders: number;
  vipTotalSpent: number;
  regularDiscountEnabled: boolean;
  regularDiscountTiers: StatusDiscountTier[];
  vipDiscountEnabled: boolean;
  vipDiscountTiers: StatusDiscountTier[];
};

export type CustomerStatusProgress = {
  status: CustomerStatus;
  statusLabel: string;
  automaticStatus: CustomerStatus;
  automaticStatusLabel: string;
  isManual: boolean;
  statusDate: string | null;
  completedOrders: number;
  countedOrders: number;
  countedSpent: number;
  nextStatus: CustomerStatus | null;
  nextStatusLabel: string | null;
  progressPercent: number;
  remainingOrders: number;
  remainingSpent: number;
  explanation: string;
};

export const defaultCustomerStatusRules: CustomerStatusRules = {
  minOrderTotal: 10000,
  regularOrders: 3,
  vipOrders: 10,
  vipTotalSpent: 500000,
  regularDiscountEnabled: true,
  regularDiscountTiers: [
    {
      id: "regular-10000",
      minOrderTotal: 10000,
      minItemPrice: 0,
      discountType: "percent",
      discountValue: 3,
    },
    {
      id: "regular-50000",
      minOrderTotal: 50000,
      minItemPrice: 0,
      discountType: "percent",
      discountValue: 5,
    },
  ],
  vipDiscountEnabled: true,
  vipDiscountTiers: [
    {
      id: "vip-10000",
      minOrderTotal: 10000,
      minItemPrice: 0,
      discountType: "percent",
      discountValue: 5,
    },
    {
      id: "vip-100000",
      minOrderTotal: 100000,
      minItemPrice: 0,
      discountType: "percent",
      discountValue: 10,
    },
  ],
};

export function getCustomerStatusLabel(status: CustomerStatus) {
  if (status === "vip") return "VIP";
  if (status === "regular") return "Постоянный клиент";
  return "Новый клиент";
}

export function isCustomerStatus(value: unknown): value is CustomerStatus {
  return typeof value === "string" && (customerStatusValues as readonly string[]).includes(value);
}
