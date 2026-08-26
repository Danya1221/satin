import { BackLink } from "@/components/back-link";
import Link from "next/link";

import { PositionCreateForm } from "@/components/admin/position-create-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminNewPositionPage({
  searchParams,
}: {
  searchParams?: Promise<{ product?: string; category?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      brand: true,
      categorySlug: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 sm:px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Новая позиция</span>
            <span>·</span>
            <span>SKU / конфигурация</span>
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

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="w-fit rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                SKU из БД
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
                Добавить позицию
              </h1>

              <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-white/55">
                Здесь создаётся конкретная продаваемая комплектация. Карточку выбираем из БД, а дальше задаём SKU, цену, наличие и параметры.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <PositionCreateForm products={products} initialProductSlug={resolvedSearchParams?.product} initialCategorySlug={resolvedSearchParams?.category} />
        </section>
      </div>
    </main>
  );
}
