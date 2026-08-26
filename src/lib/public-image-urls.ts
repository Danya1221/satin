export type PublicImageKind = "category" | "product" | "variant" | "banner" | "benefit" | "setting" | "faq-category" | "faq-question" | "faq-highlight";

function isBase64Image(value: string) {
  return /^data:image\/[^;]+;base64,/.test(value.trim());
}

export function publicImageUrl(
  kind: PublicImageKind,
  id: string,
  field: string,
  value: string,
  index?: number,
  version?: string | number,
) {
  const cleanValue = typeof value === "string" ? value.trim() : "";

  if (!cleanValue || cleanValue.startsWith("/api/public-image/") || !isBase64Image(cleanValue)) {
    return cleanValue;
  }

  const path = [
    kind,
    encodeURIComponent(id),
    encodeURIComponent(field),
  ].join("/");

  const params = new URLSearchParams();

  if (typeof index === "number") {
    params.set("index", String(index));
  }

  if (version !== undefined && String(version)) {
    params.set("v", String(version));
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  return `/api/public-image/${path}${query}`;
}

export function publicImageUrls(
  kind: PublicImageKind,
  id: string,
  field: string,
  values: string[],
) {
  return values.map((value, index) => publicImageUrl(kind, id, field, value, index));
}
