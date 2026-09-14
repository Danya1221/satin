/** PostgreSQL Int values must be whole, non-negative and within range. */
export function variantInteger(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const result = Number(value);
  return Number.isInteger(result) && result >= 0 && result <= 2147483647 ? result : null;
}

export function variantText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function variantConflictMessage(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== "P2002") return null;
  const target = "meta" in error && error.meta && typeof error.meta === "object" && "target" in error.meta ? String(error.meta.target) : "";
  if (target.toLowerCase().includes("sku")) return "Этот артикул / SKU уже занят. Укажите другой артикул или откройте существующую позицию.";
  if (target.toLowerCase().includes("slug")) return "У этой модели уже есть позиция с такой ссылкой. Измените поле «Ссылка позиции».";
  return "Артикул или ссылка позиции уже заняты. Проверьте эти поля.";
}
