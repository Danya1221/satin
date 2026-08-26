export type ProductPosition = {
  modelSlug: string;
  sku: string;
  slug: string;
  title: string;
  memory: string;
  color: string;
  colorHex: string;
  sim: string;
  price: string;
  oldPrice: string;
  stock: number;
  status: string;
  images?: string[];
  seoTitle: string;
  seoDescription: string;
};

// Тестовые SKU из кода убраны. Позиции теперь приходят из PostgreSQL.
export const productPositions: ProductPosition[] = [];
