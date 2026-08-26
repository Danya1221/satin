import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/db";

type VariantStatus = "active" | "draft" | "hidden" | "out_of_stock";

type ImportRow = Record<string, unknown>;

const allowedStatuses = new Set<VariantStatus>(["active", "draft", "hidden", "out_of_stock"]);

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/g, "")
    .trim();
}

function normalizeRow(row: ImportRow) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeKey(key), value]),
  ) as ImportRow;
}

function getCell(row: ImportRow, keys: string[]) {
  const normalizedKeys = keys.map(normalizeKey);

  for (const key of normalizedKeys) {
    const value = row[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}

function toStringCell(row: ImportRow, keys: string[]) {
  return String(getCell(row, keys) ?? "").trim();
}

function toIntCell(row: ImportRow, keys: string[]) {
  const value = getCell(row, keys);

  if (value === "" || value === undefined || value === null) {
    return undefined;
  }

  const cleaned = String(value).replace(/[^0-9.,-]/g, "").replace(",", ".");
  const numberValue = Number(cleaned);

  if (!Number.isFinite(numberValue)) {
    return undefined;
  }

  return Math.max(0, Math.round(numberValue));
}

function normalizeStatus(value: string, stock?: number): VariantStatus | undefined {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return stock !== undefined ? (stock > 0 ? "active" : "out_of_stock") : undefined;
  }

  if (allowedStatuses.has(normalized as VariantStatus)) {
    return normalized as VariantStatus;
  }

  if (["active", "активна", "активный", "впродаже", "продажа", "sale"].includes(normalized.replace(/\s+/g, ""))) {
    return "active";
  }

  if (["draft", "черновик", "подзаказ", "order"].includes(normalized.replace(/\s+/g, ""))) {
    return "draft";
  }

  if (["hidden", "скрыта", "скрыт", "hide"].includes(normalized.replace(/\s+/g, ""))) {
    return "hidden";
  }

  if (["out_of_stock", "нетвналичии", "нет", "outofstock"].includes(normalized.replace(/\s+/g, ""))) {
    return "out_of_stock";
  }

  return undefined;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ё/g, "e")
    .replace(/й/g, "i")
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSku(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Неизвестная ошибка.";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Передайте XLSX-файл в поле file." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json({ error: "В XLSX нет листов." }, { status: 400 });
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [index, rawRow] of rawRows.entries()) {
      const rowNumber = index + 2;
      const row = normalizeRow(rawRow);
      const sku = normalizeSku(toStringCell(row, ["sku", "артикул", "код", "sku товара"]));

      if (!sku) {
        skipped += 1;
        errors.push(`Строка ${rowNumber}: нет SKU.`);
        continue;
      }

      const price = toIntCell(row, ["price", "цена", "цена продажи"]);
      const oldPrice = toIntCell(row, ["oldPrice", "old price", "старая цена", "цена до акции", "до акции"]);
      const stock = toIntCell(row, ["stock", "остаток", "наличие", "qty", "quantity", "количество"]);
      const status = normalizeStatus(toStringCell(row, ["status", "статус"]), stock);
      const existing = await prisma.productVariant.findUnique({ where: { sku } });

      if (existing) {
        await prisma.productVariant.update({
          where: { sku },
          data: {
            ...(price !== undefined ? { price } : {}),
            ...(oldPrice !== undefined ? { oldPrice } : {}),
            ...(stock !== undefined ? { stock } : {}),
            ...(status ? { status } : {}),
            ...(toStringCell(row, ["name", "title", "название", "позиция"]) ? { title: toStringCell(row, ["name", "title", "название", "позиция"]) } : {}),
            ...(toStringCell(row, ["color", "цвет"]) ? { color: toStringCell(row, ["color", "цвет"]) } : {}),
            ...(toStringCell(row, ["colorHex", "hex", "цвет hex"]) ? { colorHex: toStringCell(row, ["colorHex", "hex", "цвет hex"]) } : {}),
            ...(toStringCell(row, ["memory", "память"]) ? { memory: toStringCell(row, ["memory", "память"]) } : {}),
            ...(toStringCell(row, ["sim", "сим"]) ? { sim: toStringCell(row, ["sim", "сим"]) } : {}),
            ...(toStringCell(row, ["seoTitle", "seo title", "сео заголовок"]) ? { seoTitle: toStringCell(row, ["seoTitle", "seo title", "сео заголовок"]) } : {}),
            ...(toStringCell(row, ["seoDescription", "seo description", "сео описание"]) ? { seoDescription: toStringCell(row, ["seoDescription", "seo description", "сео описание"]) } : {}),
            ...(toStringCell(row, ["seoKeywords", "seo keywords", "ключи", "сео ключи"]) ? { seoKeywords: toStringCell(row, ["seoKeywords", "seo keywords", "ключи", "сео ключи"]) } : {}),
          },
        });
        updated += 1;
        continue;
      }

      const productSlug = toStringCell(row, ["productSlug", "modelSlug", "model", "product", "модель", "карточка"]);
      const product = productSlug
        ? await prisma.product.findFirst({
            where: {
              OR: [{ slug: productSlug }, { name: productSlug }],
            },
          })
        : null;

      const title = toStringCell(row, ["name", "title", "название", "позиция"]);

      if (!product || price === undefined || !title) {
        skipped += 1;
        errors.push(
          `Строка ${rowNumber}: SKU ${sku} не найден. Для создания новой позиции нужны model/productSlug, name/title и price.`,
        );
        continue;
      }

      const newStock = stock ?? 0;

      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku,
          slug: slugify(sku),
          title,
          memory: toStringCell(row, ["memory", "память"]),
          color: toStringCell(row, ["color", "цвет"]),
          colorHex: toStringCell(row, ["colorHex", "hex", "цвет hex"]),
          sim: toStringCell(row, ["sim", "сим"]),
          images: [],
          price,
          oldPrice: oldPrice ?? null,
          stock: newStock,
          status: status ?? (newStock > 0 ? "active" : "out_of_stock"),
          seoTitle: toStringCell(row, ["seoTitle", "seo title", "сео заголовок"]),
          seoDescription: toStringCell(row, ["seoDescription", "seo description", "сео описание"]),
          seoKeywords: toStringCell(row, ["seoKeywords", "seo keywords", "ключи", "сео ключи"]),
        },
      });
      created += 1;
    }

    return NextResponse.json({ ok: true, created, updated, skipped, errors });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Не удалось импортировать XLSX.",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
