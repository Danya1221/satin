export type ProductModel = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  description: string;
  colors: string[];
};

// Тестовые товары из кода убраны. Публичный каталог теперь получает товары из PostgreSQL.
export const products: ProductModel[] = [];
