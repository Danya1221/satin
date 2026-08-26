import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  normalizeOrderWorkflowSettings,
  type OrderWorkflowSettings,
} from "@/lib/order-status";

const SETTINGS_KEY = "order-workflow";

export async function getOrderWorkflowSettings() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: SETTINGS_KEY } });
  return normalizeOrderWorkflowSettings(setting?.value);
}

export async function saveOrderWorkflowSettings(value: unknown): Promise<OrderWorkflowSettings> {
  const settings = normalizeOrderWorkflowSettings(value);

  await prisma.siteSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: settings as unknown as Prisma.InputJsonValue },
    update: { value: settings as unknown as Prisma.InputJsonValue },
  });

  return settings;
}
