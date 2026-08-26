import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/product-pricing";
import { publicImageUrl } from "@/lib/public-image-urls";

export const dynamic = "force-dynamic";

function getVariantImage(variant: {
  sku: string;
  images: string[];
  updatedAt: Date;
  product: {
    slug: string;
    image: string;
    images: string[];
    updatedAt: Date;
  };
}) {
  const variantImage = Array.isArray(variant.images)
    ? String(variant.images[0] ?? "").trim()
    : "";

  if (variantImage) {
    return publicImageUrl(
      "variant",
      variant.sku,
      "images",
      variantImage,
      0,
      variant.updatedAt.getTime(),
    );
  }

  const productImages = Array.isArray(variant.product.images)
    ? variant.product.images.map(String).filter(Boolean)
    : [];
  const productImage = productImages[0] ?? String(variant.product.image ?? "").trim();

  if (!productImage) {
    return "";
  }

  return productImages.length > 0
    ? publicImageUrl(
        "product",
        variant.product.slug,
        "images",
        productImage,
        0,
        variant.product.updatedAt.getTime(),
      )
    : publicImageUrl(
        "product",
        variant.product.slug,
        "image",
        productImage,
        undefined,
        variant.product.updatedAt.getTime(),
      );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const skus = Array.from(
    new Set(
      (url.searchParams.get("skus") ?? "")
        .split(",")
        .map((sku) => sku.trim())
        .filter(Boolean),
    ),
  ).slice(0, 50);

  if (skus.length === 0) {
    return NextResponse.json({ items: [] });
  }

  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        sku: { in: skus },
        product: { status: "active" },
      },
      include: { product: true },
    });

    const items = variants.map((variant) => ({
      sku: variant.sku,
      modelSlug: variant.product.slug,
      productName: variant.product.name,
      brand: variant.product.brand,
      title: variant.title,
      memory: variant.memory,
      color: variant.color,
      colorHex: variant.colorHex,
      sim: variant.sim,
      price: formatPrice(variant.price),
      oldPrice: variant.oldPrice ? formatPrice(variant.oldPrice) : "",
      stock: variant.stock,
      status: variant.status,
      image: getVariantImage(variant),
    }));

    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
        },
      },
    );
  } catch (error) {
    console.error("Cart products lookup failed", error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
