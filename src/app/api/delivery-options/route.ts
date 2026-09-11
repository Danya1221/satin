import { prisma } from "@/lib/db";
import { normalizeDeliverySettings } from "@/lib/delivery-settings";
import { NextResponse } from "next/server";

import { getSiteEditorSettings, getSystemSettings } from "@/lib/site-settings-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [site, system] = await Promise.all([getSiteEditorSettings(), getSystemSettings()]);
  const addresses = site.contacts.addresses.filter((address) => address.active);

  const deliveries = system.deliveries
    .filter((delivery) => delivery.active)
    .map((delivery) => ({
      key: delivery.key,
      title: delivery.title,
      type: delivery.type,
      text: delivery.type === "pickup" ? "Бесплатный самовывоз" : delivery.text,
      addressId: delivery.addressId,
      address: delivery.addressId
        ? addresses.find((address) => address.id === delivery.addressId) ?? null
        : null,
    }));

  if (!deliveries.some(d => d.key === "cdek")) deliveries.push({ key: "cdek", title: "СДЭК", type: "courier", text: "Стоимость и пункт выдачи согласует оператор", addressId: "", address: null });
  const saved = await prisma.siteSetting.findUnique({where:{key:"delivery-zones"}});
  return NextResponse.json({ deliveries, addresses, deliverySettings: normalizeDeliverySettings(saved?.value) });
}
