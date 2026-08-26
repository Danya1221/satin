"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AddToCartButton() {
 const [quantity, setQuantity] = useState(0);

 useEffect(() => {
 const savedCount = Number(localStorage.getItem("netizen-cart-count") || "0");
 setQuantity(savedCount);
 }, []);

 function updateCartCount(nextQuantity: number) {
 const safeQuantity = Math.max(0, nextQuantity);

 setQuantity(safeQuantity);
 localStorage.setItem("netizen-cart-count", String(safeQuantity));
 window.dispatchEvent(new Event("netizen-cart-updated"));
 }

 function handleAddToCart() {
 updateCartCount(1);
 }

 if (quantity > 0) {
 return (
 <div className="flex flex-wrap items-center gap-3">
 <Link
 href="/cart"
 className="flex min-w-[138px] flex-col items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold leading-tight text-white transition-colors hover:bg-emerald-500"
 >
 <span>В корзине</span>
 <span className="mt-0.5 text-[11px] font-semibold opacity-90">
 Завтра
 </span>
 </Link>

 <div className="flex h-[56px] items-center gap-2 rounded-xl border border-theme bg-blue-soft px-2 ">
 <button
 type="button"
 onClick={() => updateCartCount(quantity - 1)}
 className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
 aria-label="Уменьшить количество"
 >
 −
 </button>

 <span className="card flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-base font-bold text-main">
 {quantity}
 </span>

 <button
 type="button"
 onClick={() => updateCartCount(quantity + 1)}
 className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
 aria-label="Увеличить количество"
 >
 +
 </button>
</div>
 </div>
 );
 }

 return (
 <button
 type="button"
 onClick={handleAddToCart}
 className="rounded-xl bg-blue-600 px-8 py-4 font-medium text-white transition-colors hover:bg-blue-500"
 >
 Добавить в корзину
 </button>
 );
}