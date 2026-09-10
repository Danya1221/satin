/** Decode a single URL segment; malformed escape sequences never crash routing. */
export function decodeRouteSegment(value: string): string {
  try { return decodeURIComponent(value).normalize("NFC").trim(); }
  catch { return value.normalize("NFC").trim(); }
}
export function categoryPath(slug: string): string {
  return `/catalog/${encodeURIComponent(decodeRouteSegment(slug))}`;
}
export function safeStoreHref(value: unknown, fallback = "/catalog"): string {
  if (typeof value !== "string") return fallback;
  const href = value.trim();
  if (/^\/(?!\/)/.test(href) && !/[\\\x00-\x1f]/.test(href)) return href;
  if (/^(https:\/\/|mailto:|tel:)/i.test(href)) return href;
  return fallback;
}
