import { BackLink } from "@/components/back-link";
import Link from "next/link";
import Image from 'next/image';
import { notFound } from "next/navigation";

import { ProductVariantEditForm } from "@/components/admin/product-variant-edit-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toLocaleString("ru-RU")} ₽`;
}

function getStatusLabel(status: string) {
  if (status === "active") {
    return "В продаже";
  }

  if (status === "out_of_stock") {
    return "Нет в наличии";
  }

  if (status === "draft") {
    return "Под заказ";
  }

  return "Скрыта";
}

function getStatusClass(status: string) {
  if (status === "active") {
    return "border-green-500/35 bg-green-500/10 text-green-300";
  }

  if (status === "out_of_stock") {
    return "border-orange-500/35 bg-orange-500/10 text-orange-300";
  }

  if (status === "draft") {
    return "border-blue-500/35 bg-blue-500/10 text-blue-400";
  }

  return "border-white/10 bg-white/[0.03] text-white/45";
}

export default async function AdminPositionDetailPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const decodedSku = decodeURIComponent(sku);

  const [variant, relatedProductOptions] = await Promise.all([
    prisma.productVariant.findUnique({
      where: { sku: decodedSku },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { status: "active" },
      select: {
        id: true,
        slug: true,
        name: true,
        brand: true,
        image: true,
        images: true,
      },
      orderBy: [{ brand: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!variant) {
    notFound();
  }

  const images = Array.isArray(variant.images) ? variant.images : [];
  const mainImage = images[0] || variant.product.image;

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 sm:px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Позиция / SKU</span>
            <span>·</span>
            <span>{variant.sku}</span>
          </div>

          <Link
            href="/nz-console/positions"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            К позициям
          </Link>
        </header>

        <section className="mt-10">
          <BackLink href="/nz-console/positions" label="Назад к позициям" variant="admin" />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white/[0.045] text-xs text-white/25">
                    {mainImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <Image quality={75} src={mainImage} alt={variant.title} className="h-full w-full object-cover" />
                    ) : (
                      "Фото"
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">Конкретная позиция</div>

                    <h1 className="mt-3 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">{variant.title}</h1>

                    <p className="mt-4 max-w-[760px] text-sm leading-relaxed text-white/55">
                      Это отдельная продаваемая SKU-позиция. Здесь редактируются цена, остаток, параметры и библиотека фото.
                    </p>
                  </div>
                </div>

                <span className={`inline-flex w-fit whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${getStatusClass(variant.status)}`}>
                  {getStatusLabel(variant.status)}
                </span>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <InfoCard label="SKU" value={variant.sku} />
                <InfoCard label="Цена" value={formatPrice(variant.price)} />
                <InfoCard label="Остаток" value={`${variant.stock} шт.`} />
                <InfoCard label="Фото" value={`${images.length} шт.`} />
              </div>
            </div>

            <aside className="rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">Связь</div>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Карточка товара</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                Позиция привязана к материнской карточке, но редактируется отдельно.
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-white/35">Модель</div>
                <div className="mt-2 font-semibold text-white">{variant.product.name}</div>
                <div className="mt-1 text-sm text-white/45">{variant.product.brand}</div>
              </div>

              <Link
                href={`/nz-console/products/${variant.product.slug}`}
                className="mt-4 block rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Открыть карточку
              </Link>
            </aside>
          </div>
        </section>

        <section className="mt-8">
          <ProductVariantEditForm
            productId={variant.productId}
            variant={{
              id: variant.id,
              sku: variant.sku,
              slug: variant.slug,
              title: variant.title,
              memory: variant.memory,
              color: variant.color,
              colorHex: variant.colorHex,
              sim: variant.sim,
              images,
              price: variant.price,
              oldPrice: variant.oldPrice,
              stock: variant.stock,
              status: variant.status,
              seoTitle: variant.seoTitle,
              seoDescription: variant.seoDescription,
              seoKeywords: variant.seoKeywords,
              relatedProductIds: Array.isArray(variant.relatedProductIds)
                ? variant.relatedProductIds
                : [],
            }}
            relatedProductOptions={relatedProductOptions
              .filter((product) => product.id !== variant.productId)
              .map((product) => ({
                id: product.id,
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                image: product.image || product.images?.[0] || "",
              }))}
          />
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-2 text-lg font-bold text-white">{value}</div>
    </div>
  );
}
