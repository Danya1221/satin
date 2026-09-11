import { DeliverySettingsForm } from "@/components/admin/delivery-settings-form";
import { normalizeDeliverySettings } from "@/lib/delivery-settings";
import { prisma } from "@/lib/db";
import { SystemSettingsForm } from "@/components/admin/system-settings-form";
import { getSystemSettings } from "@/lib/site-settings-db";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();

  const delivery = await prisma.siteSetting.findUnique({ where: { key: "delivery-zones" } });
  return <><SystemSettingsForm initialSettings={settings} /><DeliverySettingsForm initialSettings={normalizeDeliverySettings(delivery?.value)} /></>;
}
