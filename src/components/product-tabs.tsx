"use client";

import { useEffect, useState, type ReactNode } from "react";

type ProductBenefit = {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: string;
  href: string;
};

type ProductTabsProps = {
  productName: string;
  brand: string;
  category: string;
  memory: string;
  color: string;
  sim: string;
  sku: string;
  description: string;
  shortDescription: string;
  benefits: ProductBenefit[];
};

const fallbackBenefits: ProductBenefit[] = [
  {
    id: "delivery",
    title: "Бесплатная доставка",
    description: "В день заказа в пределах МКАД.",
    icon: "✦",
    image: "",
    href: "",
  },
  {
    id: "order",
    title: "Под заказ",
    description: "Привозим редкие модели и конфигурации.",
    icon: "✦",
    image: "",
    href: "",
  },
  {
    id: "original",
    title: "Оригинальные товары",
    description: "Проверяем устройство перед передачей клиенту.",
    icon: "✦",
    image: "",
    href: "",
  },
];

export function ProductTabs({
  productName,
  brand,
  category,
  memory,
  color,
  sim,
  sku,
  description,
  shortDescription,
  benefits,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "description" | "characteristics" | "advantages"
  >("description");
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const visibleBenefits = benefits.length > 0 ? benefits : fallbackBenefits;
  const cleanDescription = description?.trim();
  const cleanShortDescription = shortDescription?.trim();

  return (
    <section className="card rounded-[32px] p-7">
      <div className="flex flex-wrap justify-center gap-2 border-b border-theme pb-4">
        <TabButton
          active={activeTab === "description"}
          onClick={() => setActiveTab("description")}
        >
          Описание
        </TabButton>

        <TabButton
          active={activeTab === "characteristics"}
          onClick={() => setActiveTab("characteristics")}
        >
          Характеристики
        </TabButton>

        <TabButton
          active={activeTab === "advantages"}
          onClick={() => setActiveTab("advantages")}
        >
          Преимущества
        </TabButton>
      </div>

      <div className="pt-6">
        {activeTab === "description" && (
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-500">
              О модели
            </div>

            <h2 className="text-3xl font-bold tracking-[-0.045em] text-main">
              {productName}
            </h2>

            <div
              className={`mt-4 max-w-[900px] overflow-hidden text-base leading-7 text-muted transition-all duration-300 ${
                descriptionOpen ? "max-h-[900px]" : "max-h-[120px]"
              }`}
            >
              <p>
                {cleanShortDescription ||
                  `${productName} — карточка общей модели. Выбранная конфигурация определяет память, цвет, SIM, цену, наличие и SKU.`}
              </p>

              {cleanDescription && cleanDescription !== cleanShortDescription && (
                <p className="mt-4">{cleanDescription}</p>
              )}

              <p className="mt-4">
                Перед оформлением менеджер подтвердит наличие, комплектацию,
                способ получения и итоговую стоимость заказа.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDescriptionOpen((current) => !current)}
              className="mt-5 rounded-2xl border border-theme px-5 py-3 text-sm font-semibold text-main transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
            >
              {descriptionOpen ? "Свернуть описание" : "Показать описание полностью"}
            </button>
          </div>
        )}

        {activeTab === "characteristics" && (
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-500">
              Характеристики
            </div>

            <h2 className="text-3xl font-bold tracking-[-0.045em] text-main">
              Основное
            </h2>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <Characteristic label="Бренд" value={brand} />
              <Characteristic label="Категория" value={category} />
              <Characteristic label="Модель" value={productName} />
              <Characteristic label="Память" value={memory} />
              <Characteristic label="Цвет" value={color} />
              <Characteristic label="SIM" value={sim} />
              <Characteristic label="SKU" value={sku} />
              <Characteristic label="Гарантия" value="12 месяцев" />
            </div>
          </div>
        )}

        {activeTab === "advantages" && (
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-500">
              Преимущества
            </div>

            <h2 className="text-3xl font-bold tracking-[-0.045em] text-main">
              Почему у нас удобно покупать
            </h2>

            <div className="mt-6 grid auto-rows-fr gap-4 md:grid-cols-2">
              {visibleBenefits.map((item) => (
                <BenefitCard key={item.id || item.title} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function BenefitCard({ item }: { item: ProductBenefit }) {
  const [imageFailed, setImageFailed] = useState(false);
  const cleanImage = item.image?.trim() || "";

  useEffect(() => {
    setImageFailed(false);
  }, [cleanImage]);

  const content = (
    <div className="h-full min-h-[126px] rounded-2xl border border-theme bg-blue-soft p-5 transition-colors hover:border-blue-500/40">
      <div className="flex h-full items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-theme bg-card text-lg text-blue-500">
          {cleanImage && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cleanImage}
              alt=""
              loading="eager"
              decoding="async"
              onError={() => setImageFailed(true)}
              className="h-7 w-7 object-contain"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center leading-none">
              {item.icon || "✦"}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 font-bold text-main">{item.title}</div>
          <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );

  if (!item.href) {
    return content;
  }

  return (
    <a href={item.href} className="block h-full">
      {content}
    </a>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "border border-theme bg-transparent text-muted hover:border-blue-500/40 hover:bg-blue-soft hover:text-main"
      }`}
    >
      {children}
    </button>
  );
}

function Characteristic({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl border border-theme bg-blue-soft px-5 py-4">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-bold text-main">{value}</span>
    </div>
  );
}
