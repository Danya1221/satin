/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { getPriceNumber } from "@/lib/product-pricing";
import { getCheckoutQuote } from "@/lib/checkout-discounts";
import { getOrderWorkflowSettings } from "@/lib/order-workflow-db";
import { getDefaultOrderStatus } from "@/lib/order-status";
import {
  normalizeEmailStrict,
  normalizeRuPhone,
  validateCourierAddress,
} from "@/lib/contact-validation";

type IncomingOrderItem = {
  sku?: string;
  quantity?: number;
  title?: string;
  productName?: string;
  brand?: string;
  price?: string | number;
  memory?: string;
  color?: string;
  sim?: string;
};

type IncomingOrderBody = {
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  delivery?: {
    method?: "courier" | "pickup" | null;
    city?: string;
    address?: string;
    savedAddress?: string;
    title?: string;
  };
  comment?: string;
  promoCode?: string;
  items?: IncomingOrderItem[];
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeQuantity(value: unknown) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
}

async function generateOrderPublicId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = `${Date.now().toString().slice(-6)}${attempt ? attempt : ""}`;
    const publicId = `NZ-${suffix}`;
    const existing = await prisma.order.findUnique({ where: { publicId } });

    if (!existing) {
      return publicId;
    }
  }

  return `NZ-${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    const body = (await request.json()) as IncomingOrderBody;
    const sessionCustomer =
      session?.role === "customer" && session.customerId
        ? await prisma.customer.findUnique({
            where: { id: session.customerId },
          })
        : null;
    const profileName = sessionCustomer
      ? [sessionCustomer.name, sessionCustomer.lastName]
          .map((part) => normalizeText(part))
          .filter(Boolean)
          .join(" ")
      : "";
    const customerName =
      profileName || normalizeText(body.customer?.name);
    const phone =
      normalizeRuPhone(sessionCustomer?.phone) ||
      normalizeRuPhone(body.customer?.phone);
    const rawEmail =
      normalizeText(sessionCustomer?.email) ||
      normalizeText(body.customer?.email);
    // E-mail is optional. Legacy/incorrect profile values must not block checkout.
    const email = rawEmail ? normalizeEmailStrict(rawEmail) : "";
    const deliveryMethod = body.delivery?.method === "pickup" ? "pickup" : "courier";
    const city = normalizeText(body.delivery?.city);
    const rawAddress = normalizeText(body.delivery?.savedAddress) || normalizeText(body.delivery?.address);
    const addressValidation =
      deliveryMethod === "courier"
        ? validateCourierAddress(city, rawAddress)
        : { ok: true as const, message: "", normalized: "" };
    const address = deliveryMethod === "courier" ? addressValidation.normalized : "";
    const pickupPoint = deliveryMethod === "pickup" ? rawAddress || "ПВЗ Neontech" : "";
    const comment = normalizeText(body.comment);
    const incomingItems = Array.isArray(body.items) ? body.items : [];

    if (!customerName) {
      return NextResponse.json(
        {
          ok: false,
          error: sessionCustomer
            ? "В профиле не указано имя. Добавьте имя в личном кабинете."
            : "Укажите имя для заказа.",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          ok: false,
          error: sessionCustomer
            ? "В профиле не указан корректный телефон РФ. Измените телефон в личном кабинете."
            : "Укажите корректный телефон РФ.",
        },
        { status: 400 }
      );
    }

    if (incomingItems.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Корзина пустая." },
        { status: 400 }
      );
    }

    if (deliveryMethod === "courier" && !addressValidation.ok) {
      return NextResponse.json(
        { ok: false, error: addressValidation.message },
        { status: 400 }
      );
    }

    const skus = incomingItems
      .map((item) => normalizeText(item.sku))
      .filter(Boolean);

    const variants = await prisma.productVariant.findMany({
      where: {
        sku: {
          in: skus,
        },
      },
      include: {
        product: true,
      },
    });

    const variantBySku = new Map(variants.map((variant) => [variant.sku, variant]));

    const preparedItems = incomingItems.map((item) => {
      const sku = normalizeText(item.sku);
      const variant = variantBySku.get(sku);
      const quantity = normalizeQuantity(item.quantity);
      const price = variant?.price ?? getPriceNumber(item.price);
      const title = variant?.title || normalizeText(item.title) || normalizeText(item.productName) || sku;
      const productTitle = variant?.product.name || normalizeText(item.productName) || title;
      const image = variant?.images?.[0] || variant?.product.image || variant?.product.images?.[0] || "";

      return {
        productId: variant?.productId,
        variantId: variant?.id,
        title,
        productTitle,
        brand: variant?.product.brand || normalizeText(item.brand),
        sku,
        memory: variant?.memory || normalizeText(item.memory),
        color: variant?.color || normalizeText(item.color),
        sim: variant?.sim || normalizeText(item.sim),
        image,
        quantity,
        price,
      };
    });

    const invalidItem = preparedItems.find(
      (item) => !item.sku || !item.variantId || item.price <= 0,
    );

    if (invalidItem) {
      return NextResponse.json(
        { ok: false, error: "Одна из позиций не найдена в каталоге или не имеет корректной цены." },
        { status: 400 }
      );
    }

    const customer =
      sessionCustomer ||
      (phone
        ? await prisma.customer.findFirst({ where: { phone } })
        : null);

    const savedCustomer = customer
      ? await prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: customerName,
            phone,
            email,
            city,
          },
        })
      : await prisma.customer.create({
          data: {
            name: customerName,
            phone,
            email,
            city,
          },
        });

    if (deliveryMethod === "courier" && address) {
      const existingAddress = await prisma.address.findFirst({
        where: {
          customerId: savedCustomer.id,
          value: address,
        },
        select: { id: true },
      });

      if (!existingAddress) {
        const addressesCount = await prisma.address.count({
          where: { customerId: savedCustomer.id },
        });

        await prisma.address.create({
          data: {
            customerId: savedCustomer.id,
            type: "courier",
            value: address,
            isDefault: addressesCount === 0,
          },
        });
      }
    }

    const requestedPromoCode = normalizeText(body.promoCode).toUpperCase();
    const quote = await getCheckoutQuote({
      items: preparedItems.map((item) => ({ sku: item.sku, quantity: item.quantity })),
      promoCode: requestedPromoCode,
      customerId: savedCustomer.id,
      phone,
    });

    if (requestedPromoCode && !quote.promoValid) {
      return NextResponse.json(
        { ok: false, error: quote.promoMessage || "Промокод больше не действует." },
        { status: 400 },
      );
    }

    const workflow = await getOrderWorkflowSettings();
    const initialStatus = getDefaultOrderStatus(deliveryMethod, workflow);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: ({
          publicId: await generateOrderPublicId(),
          customerId: savedCustomer.id,
          customerName,
          phone,
          email,
          deliveryType: deliveryMethod,
          address,
          pickupPoint,
          subtotal: quote.subtotal,
          statusDiscount: quote.statusDiscount,
          promoDiscount: quote.promoDiscount,
          promoCode: quote.promoCode,
          discountTotal: quote.discountTotal,
          total: quote.total,
          comment,
          status: initialStatus,
          items: {
            create: preparedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              title: item.title,
              productTitle: item.productTitle,
              brand: item.brand,
              sku: item.sku,
              memory: item.memory,
              color: item.color,
              sim: item.sim,
              image: item.image,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        } as any),
        include: { items: true },
      });

      if (quote.promoId && quote.promoDiscount > 0) {
        await (tx as any).promoCodeUsage.create({
          data: {
            promoCodeId: quote.promoId,
            customerId: savedCustomer.id,
            orderId: created.id,
            code: quote.promoCode,
            discount: quote.promoDiscount,
          },
        });
      }

      return created;
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        publicId: order.publicId,
        total: order.total,
      },
    });
  } catch (error) {
    console.error("Order create error", error);

    return NextResponse.json(
      { ok: false, error: "Не удалось создать заявку." },
      { status: 500 }
    );
  }
}
