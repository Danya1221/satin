export const categories = [
  {
    id: "smartphones",
    name: "Смартфоны",
    description: "iPhone, Samsung и другие смартфоны.",
    href: "/catalog/smartphones",
  },
  {
    id: "laptops",
    name: "Ноутбуки",
    description: "MacBook и ноутбуки для работы, учёбы и игр.",
    href: "/catalog/laptops",
  },
  {
    id: "headphones",
    name: "Наушники",
    description: "AirPods и беспроводные модели.",
    href: "/catalog/headphones",
  },
  {
    id: "watches",
    name: "Умные часы",
    description: "Apple Watch и другие носимые устройства.",
    href: "/catalog/watches",
  },
  {
    id: "tablets",
    name: "Планшеты",
    description: "iPad и планшеты для работы, учёбы и развлечений.",
    href: "/catalog/tablets",
  },
  {
    id: "accessories",
    name: "Аксессуары",
    description: "Чехлы, зарядки, кабели, адаптеры и защита.",
    href: "/catalog/accessories",
  },
  {
    id: "home",
    name: "Для дома",
    description: "Умные устройства и техника для дома.",
    href: "/catalog/home",
  },
  {
    id: "vacuums",
    name: "Пылесосы",
    description: "Беспроводные и умные пылесосы.",
    href: "/catalog/vacuums",
  },
  {
    id: "beauty",
    name: "Фены и стайлеры",
    description: "Техника для ухода и укладки.",
    href: "/catalog/beauty",
  },
  {
    id: "monitors",
    name: "Мониторы",
    description: "Мониторы для работы, игр и контента.",
    href: "/catalog/monitors",
  },
  {
    id: "gaming",
    name: "Игровая техника",
    description: "Консоли, геймпады и игровые аксессуары.",
    href: "/catalog/gaming",
  },
  {
    id: "tv",
    name: "ТВ и мультимедиа",
    description: "Телевизоры, приставки и мультимедиа.",
    href: "/catalog/tv",
  },
];

export type CategoryId = (typeof categories)[number]["id"];