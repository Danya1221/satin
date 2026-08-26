import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

const rows = [
  {
    productId: "",
    productSlug: "iphone-17-pro",
    model: "iPhone 17 Pro",
    brand: "Apple",
    category: "Смартфон",
    categorySlug: "smartfon",
    categorySortOrder: 10,
    productSortOrder: 40,
    productStatus: "active",
    isNew: "нет",
    isPopular: "да",
    productImage: "https://example.com/iphone-17-pro-main.png",
    promoImage: "",
    shortDescription: "Флагманский смартфон Apple",
    description: "Описание материнской карточки товара",
    slug: "iphone-17-pro-256-orange-esim",
    sku: "IP17PRO-256-ORANGE-ESIM",
    name: "Смартфон iPhone 17 Pro 256 GB Orange eSIM",
    memory: "256 GB",
    color: "Orange",
    colorHex: "#f97316",
    sim: "eSIM",
    price: 100990,
    oldPrice: 119990,
    stock: 5,
    status: "active",
    seoTitle: "Купить iPhone 17 Pro 256 GB Orange eSIM",
    seoKeywords: "iphone 17 pro, 256gb, orange, esim",
    seoDescription: "Короткое SEO-описание конкретной SKU-позиции.",
    images: "https://example.com/iphone-17-pro-orange-1.png; https://example.com/iphone-17-pro-orange-2.png",
  },
  {
    productId: "",
    productSlug: "samsung-s26-ultra",
    model: "Samsung S26 Ultra",
    brand: "Samsung",
    category: "Смартфон",
    categorySlug: "smartfon",
    categorySortOrder: 10,
    productSortOrder: 10,
    productStatus: "active",
    isNew: "да",
    isPopular: "да",
    productImage: "https://example.com/samsung-s26-ultra-main.png",
    promoImage: "",
    shortDescription: "Флагманский смартфон Samsung",
    description: "Описание материнской карточки товара",
    slug: "samsung-s26-ultra-512-white-2sim",
    sku: "S26ULTRA-512-WHITE-2SIM",
    name: "Смартфон Samsung S26 Ultra 512 GB White 2 SIM",
    memory: "512 GB",
    color: "White",
    colorHex: "#ffffff",
    sim: "2 SIM",
    price: 0,
    oldPrice: "",
    stock: 0,
    status: "out_of_stock",
    seoTitle: "Купить Samsung S26 Ultra 512 GB White 2 SIM",
    seoKeywords: "samsung s26 ultra, 512gb, white, 2 sim",
    seoDescription: "Короткое SEO-описание конкретной SKU-позиции.",
    images: "https://example.com/samsung-s26-ultra-white.png",
  },
];

const helpRows = [
  { column: "sku", required: "Да", purpose: "Уникальный артикул позиции. Если SKU уже есть — позиция обновится, если новый — создастся." },
  { column: "productId", required: "Нет", purpose: "ID материнской карточки. Самый точный способ привязки, но обычно можно оставить пустым." },
  { column: "productSlug", required: "Нет", purpose: "Slug материнской карточки. Используется для поиска/создания карточки." },
  { column: "model", required: "Для создания", purpose: "Название материнской карточки, например iPhone 17 Pro." },
  { column: "brand", required: "Для создания", purpose: "Бренд, например Apple/Samsung." },
  { column: "category / categorySlug", required: "Для создания", purpose: "Категория позиции. Если категории нет — импорт создаст её." },
  { column: "slug", required: "Нет", purpose: "Slug самой позиции. Если пусто — будет создан из SKU." },
  { column: "name", required: "Нет", purpose: "Название позиции. Если пусто — соберётся из модели, памяти, цвета и SIM." },
  { column: "memory, color, colorHex, sim", required: "Нет", purpose: "Параметры позиции из формы." },
  { column: "price", required: "Для создания", purpose: "Цена. Для обновления можно передавать только price/stock по SKU." },
  { column: "oldPrice", required: "Нет", purpose: "Старая цена. Пустая ячейка не затирает старую цену при обновлении." },
  { column: "stock", required: "Нет", purpose: "Остаток. Если статус пустой, по остатку будет выбран active/out_of_stock." },
  { column: "status", required: "Нет", purpose: "active, draft, hidden, out_of_stock. Также понимает русские значения." },
  { column: "seoTitle, seoKeywords, seoDescription", required: "Нет", purpose: "SEO конкретной позиции/SKU." },
  { column: "images", required: "Нет", purpose: "Фото позиции. Можно несколько ссылок через ; , | или перенос строки." },
  { column: "productImage, promoImage, description, shortDescription", required: "Нет", purpose: "Поля материнской карточки, если карточка создаётся через импорт." },
  { column: "productSortOrder, categorySortOrder", required: "Нет", purpose: "Порядок карточки товара и категории в каталоге." },
];

export async function GET() {
  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 24 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 10 },
    { wch: 12 },
    { wch: 54 },
    { wch: 42 },
    { wch: 34 },
    { wch: 54 },
    { wch: 34 },
    { wch: 30 },
    { wch: 48 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 44 },
    { wch: 36 },
    { wch: 58 },
    { wch: 70 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, "positions");

  const helpSheet = XLSX.utils.json_to_sheet(helpRows);
  helpSheet["!cols"] = [{ wch: 34 }, { wch: 16 }, { wch: 92 }];
  XLSX.utils.book_append_sheet(workbook, helpSheet, "readme");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="positions-import-full-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
