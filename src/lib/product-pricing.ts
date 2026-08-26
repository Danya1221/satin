import { productPositions } from "@/data/product-positions";

type PriceValue = string | number | null | undefined;

export function getPriceNumber(price: PriceValue) {
  if (typeof price === "number") {
    return price;
  }

  if (!price) {
    return 0;
  }

  return Number(String(price).replace(/[^\d]/g, ""));
}

export function formatPrice(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export function getModelPositions(modelSlug: string) {
  return productPositions.filter((position) => position.modelSlug === modelSlug);
}

export function getModelPriceRange(
  modelSlug: string,
  fallbackPrice = "Цена по запросу"
) {
  const prices = getModelPositions(modelSlug)
    .map((position) => getPriceNumber(position.price))
    .filter((price) => price > 0);

  if (prices.length === 0) {
    return fallbackPrice;
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }

  return `от ${formatPrice(minPrice)} до ${formatPrice(maxPrice)}`;
}