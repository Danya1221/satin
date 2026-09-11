export type DeliveryZone = { id: string; name: string; price: number; description: string };
export type DeliverySettings = { mapImage: string; zones: DeliveryZone[] };
export function normalizeDeliverySettings(value: unknown): DeliverySettings {
 const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
 const zones: DeliveryZone[] = [];
 for (const item of Array.isArray(input.zones) ? input.zones.slice(0,100) : []) {
  if (!item || typeof item !== "object") continue;
  const row = item as Record<string, unknown>, price = Number(row.price);
  const id = typeof row.id === "string" ? row.id.trim().slice(0,80) : "";
  const name = typeof row.name === "string" ? row.name.trim().slice(0,100) : "";
  if(!id || !name || !Number.isSafeInteger(price) || price < 0 || price > 1000000 || zones.some(z=>z.id===id)) continue;
  zones.push({id,name,price,description:typeof row.description === "string" ? row.description.trim().slice(0,500) : ""});
 }
 const image = typeof input.mapImage === "string" ? input.mapImage : "";
 return {zones,mapImage: /^(\/[^/]|https:\/\/|data:image\/(png|jpeg|webp);base64,)/.test(image) && image.length <= 3000000 ? image : ""};
}
export function deliveryQuote(settings: DeliverySettings, carrier: string, zoneId?: string) {
 if(carrier === "pickup") return { fee:0, zone:"" };
 if(carrier === "cdek") return { fee:null, zone:"" };
 const zone = settings.zones.find(z=>z.id===zoneId);
 return {fee:zone?.price ?? null,zone:zone?.name ?? ""};
}
