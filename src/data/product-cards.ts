export type ProductCard = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  shortDescription: string;
  image: string;
  colors: string[];
  status: string;
};

// Тестовые карточки из кода убраны. Карточки товаров теперь приходят из PostgreSQL.
export const productCards: ProductCard[] = [];
