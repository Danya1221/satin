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
      text: delivery.text,
      addressId: delivery.addressId,
      address: delivery.addressId
        ? addresses.find((address) => address.id === delivery.addressId) ?? null
        : null,
    }));

  return NextResponse.json({ deliveries, addresses });
}
