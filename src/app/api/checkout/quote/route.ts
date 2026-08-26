import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { getCheckoutQuote, type CheckoutQuoteItem } from "@/lib/checkout-discounts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    const body = (await request.json().catch(() => null)) as
      | { items?: CheckoutQuoteItem[]; promoCode?: string; phone?: string }
      | null;
    const quote = await getCheckoutQuote({
      items: Array.isArray(body?.items) ? body.items : [],
      promoCode: body?.promoCode,
      phone: body?.phone,
      customerId: session?.role === "customer" ? session.customerId : undefined,
    });

    return NextResponse.json({ ok: true, quote: { ...quote, promoId: undefined } });
  } catch (error) {
    console.error("Checkout quote error", error);
    return NextResponse.json({ ok: false, error: "Не удалось рассчитать скидку." }, { status: 500 });
  }
}
