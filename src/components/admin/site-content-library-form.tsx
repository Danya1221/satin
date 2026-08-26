"use client";

import { useState, type ReactNode } from "react";

import { ImageDropZone } from "@/components/admin/image-drop-zone";
import type { SiteBanner, SiteBenefit, SiteContentLibrary } from "@/lib/site-content-library-db";
import { SupportContentAdminClient } from "@/components/admin/support-content-admin-client";

type LibraryTab = "banners" | "store" | "product" | "service";
type SaveState = "idle" | "saving" | "saved" | "error";

type Props = {
  initialLibrary: SiteContentLibrary;
  onChange?: (library: SiteContentLibrary) => void;
};

const emptyBanner: Omit<SiteBanner, "id" | "createdAt" | "updatedAt"> = {
  adminTitle: "Новый баннер",
  label: "Промо",
  title: "Новый баннер",
  subtitle: "",
  description: "",
  buttonText: "Подробнее",
  buttonHref: "/catalog",
  secondaryButtonText: "Каталог",
  secondaryButtonHref: "/catalog",
  imageLight: "",
  imageDark: "",
  imageMobile: "",
  placement: "manual",
  tone: "blue",
  layout: "split",
  titleSize: "lg",
  textSize: "md",
  enabled: true,
  sortOrder: 100,
};

const emptyBenefit: Omit<SiteBenefit, "id" | "createdAt" | "updatedAt"> = {
  title: "Новое преимущество",
  description: "",
  icon: "✓",
  image: "",
  href: "",
  placement: "store",
  enabled: true,
  sortOrder: 100,
};

export function SiteContentLibraryForm({ initialLibrary, onChange }: Props) {
  const [library, setLibrary] = useState(initialLibrary);
  const [tab, setTab] = useState<LibraryTab>("banners");
  const [selectedBannerId, setSelectedBannerId] = useState(initialLibrary.banners[0]?.id ?? "");
  const [selectedBenefitId, setSelectedBenefitId] = useState(initialLibrary.benefits[0]?.id ?? "");
  const [state, setState] = useState<SaveState>("idle");

  const selectedBanner = library.banners.find((banner) => banner.id === selectedBannerId) ?? library.banners[0] ?? null;
  const activeBenefitPlacement = tab === "product" ? "product" : "store";
  const visibleBenefits = library.benefits.filter(
    (benefit) => benefit.placement === activeBenefitPlacement,
  );
  const selectedBenefit =
    visibleBenefits.find((benefit) => benefit.id === selectedBenefitId) ??
    visibleBenefits[0] ??
    null;

  function updateLibrary(next: SiteContentLibrary) {
    setLibrary(next);
    onChange?.(next);
  }

  function updateBanner(id: string, patch: Partial<SiteBanner>) {
    updateLibrary({
      ...library,
      banners: library.banners.map((banner) => (banner.id === id ? { ...banner, ...patch } : banner)),
    });
  }

  function updateBenefit(id: string, patch: Partial<SiteBenefit>) {
    updateLibrary({
      ...library,
      benefits: library.benefits.map((benefit) => (benefit.id === id ? { ...benefit, ...patch } : benefit)),
    });
  }

  async function refreshLibrary() {
    const [bannersResponse, benefitsResponse] = await Promise.all([
      fetch("/api/admin/site-banners", { cache: "no-store" }),
      fetch("/api/admin/site-benefits", { cache: "no-store" }),
    ]);

    const bannersPayload = bannersResponse.ok ? await bannersResponse.json() : { banners: library.banners };
    const benefitsPayload = benefitsResponse.ok ? await benefitsResponse.json() : { benefits: library.benefits };
    const next = {
      banners: Array.isArray(bannersPayload.banners) ? bannersPayload.banners : [],
      benefits: Array.isArray(benefitsPayload.benefits) ? benefitsPayload.benefits : [],
    };

    updateLibrary(next);
    if (!selectedBannerId && next.banners[0]) setSelectedBannerId(next.banners[0].id);
    if (!selectedBenefitId && next.benefits[0]) setSelectedBenefitId(next.benefits[0].id);
  }

  async function createBanner() {
    setState("saving");
    const response = await fetch("/api/admin/site-banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emptyBanner),
    }).catch(() => null);

    if (!response?.ok) {
      setState("error");
      return;
    }

    const payload = (await response.json()) as { banner?: SiteBanner };
    await refreshLibrary();
    if (payload.banner) setSelectedBannerId(payload.banner.id);
    setState("saved");
    window.setTimeout(() => setState("idle"), 1800);
  }

  async function createBenefit() {
    setState("saving");
    const response = await fetch("/api/admin/site-benefits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...emptyBenefit,
        placement: activeBenefitPlacement,
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setState("error");
      return;
    }

    const payload = (await response.json()) as { benefit?: SiteBenefit };
    await refreshLibrary();
    if (payload.benefit) setSelectedBenefitId(payload.benefit.id);
    setState("saved");
    window.setTimeout(() => setState("idle"), 1800);
  }

  async function saveBanner(banner: SiteBanner) {
    setState("saving");
    const response = await fetch(`/api/admin/site-banners/${banner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(banner),
    }).catch(() => null);

    if (!response?.ok) {
      setState("error");
      return;
    }

    await refreshLibrary();
    setState("saved");
    window.setTimeout(() => setState("idle"), 1800);
  }

  async function saveBenefit(benefit: SiteBenefit) {
    setState("saving");
    const response = await fetch(`/api/admin/site-benefits/${benefit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(benefit),
    }).catch(() => null);

    if (!response?.ok) {
      setState("error");
      return;
    }

    await refreshLibrary();
    setState("saved");
    window.setTimeout(() => setState("idle"), 1800);
  }

  async function deleteBanner(banner: SiteBanner) {
    if (!window.confirm(`Удалить баннер “${banner.adminTitle}”?`)) return;
    setState("saving");
    const response = await fetch(`/api/admin/site-banners/${banner.id}`, { method: "DELETE" }).catch(() => null);

    if (!response?.ok) {
      setState("error");
      return;
    }

    await refreshLibrary();
    setSelectedBannerId("");
    setState("saved");
    window.setTimeout(() => setState("idle"), 1800);
  }

  async function deleteBenefit(benefit: SiteBenefit) {
    if (!window.confirm(`Удалить преимущество “${benefit.title}”?`)) return;
    setState("saving");
    const response = await fetch(`/api/admin/site-benefits/${benefit.id}`, { method: "DELETE" }).catch(() => null);

    if (!response?.ok) {
      setState("error");
      return;
    }

    await refreshLibrary();
    setSelectedBenefitId("");
    setState("saved");
    window.setTimeout(() => setState("idle"), 1800);
  }

  return (
    <section className="mt-6 rounded-[34px] border border-white/10 bg-white/[0.035] p-5 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-blue-400">
            Библиотека контента
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.045em]">
            Баннеры и преимущества
          </h2>
          <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-white/50">
            Все группы находятся здесь и больше не повторяются под каждой страницей редактора.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
          {[
            { key: "banners", label: "Баннеры" },
            { key: "store", label: "Главная" },
            { key: "product", label: "Карточка товара" },
            { key: "service", label: "Сервис и поддержка" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onPointerDown={() => {
                const nextTab = item.key as LibraryTab;
                setTab(nextTab);
                if (nextTab === "store" || nextTab === "product") {
                  const placement = nextTab === "product" ? "product" : "store";
                  setSelectedBenefitId(
                    library.benefits.find((benefit) => benefit.placement === placement)?.id ?? "",
                  );
                }
              }}
              onClick={() => {
                const nextTab = item.key as LibraryTab;
                setTab(nextTab);
                if (nextTab === "store" || nextTab === "product") {
                  const placement = nextTab === "product" ? "product" : "store";
                  setSelectedBenefitId(
                    library.benefits.find((benefit) => benefit.placement === placement)?.id ?? "",
                  );
                }
              }}
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                tab === item.key ? "bg-blue-600 text-white" : "text-white/55 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {state === "saved" && <LibraryAlert tone="success">Сохранено.</LibraryAlert>}
      {state === "error" && <LibraryAlert tone="error">Не удалось сохранить.</LibraryAlert>}

      {tab === "banners" ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <LibraryList title="Баннеры" onCreate={createBanner} createText="+ Создать баннер">
            {library.banners.map((banner) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setSelectedBannerId(banner.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  selectedBanner?.id === banner.id
                    ? "border-blue-500/50 bg-blue-500/15"
                    : "border-white/10 bg-black/20 hover:border-blue-500/35"
                }`}
              >
                <div className="text-sm font-bold">{banner.adminTitle}</div>
                <div className="mt-1 line-clamp-1 text-xs text-white/45">{banner.title}</div>
                <div className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] ${
                  banner.enabled
                    ? "border-green-500/30 bg-green-500/10 text-green-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}>
                  {banner.enabled ? "Активен" : "Скрыт"}
                </div>
              </button>
            ))}
          </LibraryList>

          {selectedBanner ? (
            <BannerEditor
              banner={selectedBanner}
              disabled={state === "saving"}
              updateBanner={updateBanner}
              saveBanner={saveBanner}
              deleteBanner={deleteBanner}
            />
          ) : (
            <EmptyState>Создай или выбери баннер.</EmptyState>
          )}
        </div>
      ) : tab === "store" || tab === "product" ? (
        <div className="mt-6">
          <div className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="text-sm font-bold text-blue-200">
              {tab === "product" ? "Преимущества в карточке товара" : "Преимущества на главной"}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-white/50">
              {tab === "product"
                ? "Эта группа выводится во вкладке преимуществ на странице товара."
                : "Эта группа выводится полосой под главным баннером на главной странице."}
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <LibraryList
              title={tab === "product" ? "Преимущества товара" : "Преимущества главной"}
              onCreate={createBenefit}
              createText="+ Создать преимущество"
            >
              {visibleBenefits.map((benefit) => (
                <button
                  key={benefit.id}
                  type="button"
                  onClick={() => setSelectedBenefitId(benefit.id)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    selectedBenefit?.id === benefit.id
                      ? "border-blue-500/50 bg-blue-500/15"
                      : "border-white/10 bg-black/20 hover:border-blue-500/35"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300">
                      {benefit.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={benefit.image} alt="" className="h-9 w-9 object-contain" />
                      ) : (
                        benefit.icon || "✓"
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{benefit.title}</div>
                      <div className="mt-1 line-clamp-1 text-xs text-white/45">{benefit.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </LibraryList>

            {selectedBenefit ? (
              <BenefitEditor
                benefit={selectedBenefit}
                disabled={state === "saving"}
                updateBenefit={updateBenefit}
                saveBenefit={saveBenefit}
                deleteBenefit={deleteBenefit}
              />
            ) : (
              <EmptyState>Создай первое преимущество для этой группы.</EmptyState>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="text-sm font-bold text-blue-200">
              Редактор блока «Сервис и поддержка»
            </div>
            <p className="mt-1 text-sm leading-relaxed text-white/50">
              Здесь редактируются обе части блока: преимущества слева и вопросы с ответами справа.
            </p>
          </div>
          <SupportContentAdminClient />
        </div>
      )}
    </section>
  );
}

function LibraryList({ title, createText, onCreate, children }: { title: string; createText: string; onCreate: () => void; children: ReactNode }) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-bold">{title}</div>
        <button type="button" onClick={onCreate} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500">{createText}</button>
      </div>
      <div className="mt-4 grid gap-3">{children}</div>
    </aside>
  );
}

function BannerEditor({ banner, disabled, updateBanner, saveBanner, deleteBanner }: { banner: SiteBanner; disabled: boolean; updateBanner: (id: string, patch: Partial<SiteBanner>) => void; saveBanner: (banner: SiteBanner) => void; deleteBanner: (banner: SiteBanner) => void }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <LibraryField label="Название в админке"><input value={banner.adminTitle} onChange={(event) => updateBanner(banner.id, { adminTitle: event.target.value })} className="admin-input" /></LibraryField>
        <LibraryField label="Метка"><input value={banner.label} onChange={(event) => updateBanner(banner.id, { label: event.target.value })} className="admin-input" /></LibraryField>
        <LibraryField label="Заголовок"><textarea value={banner.title} onChange={(event) => updateBanner(banner.id, { title: event.target.value })} className="admin-textarea min-h-[80px]" /></LibraryField>
        <LibraryField label="Подзаголовок"><input value={banner.subtitle} onChange={(event) => updateBanner(banner.id, { subtitle: event.target.value })} className="admin-input" /></LibraryField>
        <LibraryField label="Описание"><textarea value={banner.description} onChange={(event) => updateBanner(banner.id, { description: event.target.value })} className="admin-textarea min-h-[110px]" /></LibraryField>
        <LibraryField label="Текст кнопки 1"><input value={banner.buttonText} onChange={(event) => updateBanner(banner.id, { buttonText: event.target.value })} className="admin-input" /></LibraryField>
        <LibraryField label="Ссылка кнопки 1"><input value={banner.buttonHref} onChange={(event) => updateBanner(banner.id, { buttonHref: event.target.value })} className="admin-input" /></LibraryField>
        <LibraryField label="Текст кнопки 2"><input value={banner.secondaryButtonText || ""} onChange={(event) => updateBanner(banner.id, { secondaryButtonText: event.target.value })} className="admin-input" placeholder="Например: Каталог" /></LibraryField>
        <LibraryField label="Ссылка кнопки 2"><input value={banner.secondaryButtonHref || ""} onChange={(event) => updateBanner(banner.id, { secondaryButtonHref: event.target.value })} className="admin-input" placeholder="Например: /catalog" /></LibraryField>
        <LibraryField label="Где использовать"><input value={banner.placement} onChange={(event) => updateBanner(banner.id, { placement: event.target.value })} className="admin-input" placeholder="home / catalog / product / manual" /></LibraryField>
        <LibraryField label="Порядок"><input type="number" value={banner.sortOrder} onChange={(event) => updateBanner(banner.id, { sortOrder: Number(event.target.value) })} className="admin-input" /></LibraryField>
        <LibraryField label="Размер заголовка"><select value={banner.titleSize || "lg"} onChange={(event) => updateBanner(banner.id, { titleSize: event.target.value })} className="admin-input"><option value="md">Средний</option><option value="lg">Большой</option><option value="xl">Очень большой</option></select></LibraryField>
        <LibraryField label="Размер описания"><select value={banner.textSize || "md"} onChange={(event) => updateBanner(banner.id, { textSize: event.target.value })} className="admin-input"><option value="sm">Компактный</option><option value="md">Обычный</option><option value="lg">Крупный</option></select></LibraryField>
        <LibraryField label="Тон"><select value={banner.tone} onChange={(event) => updateBanner(banner.id, { tone: event.target.value })} className="admin-input"><option value="blue">Синий</option><option value="dark">Тёмный</option><option value="light">Светлый</option></select></LibraryField>
        <LibraryField label="Макет"><select value={banner.layout} onChange={(event) => updateBanner(banner.id, { layout: event.target.value })} className="admin-input"><option value="split">Текст + фото</option><option value="image-bg">Фото фоном</option><option value="compact">Компактный</option></select></LibraryField>
        <div className="md:col-span-2 grid gap-4 lg:grid-cols-3">
          <ImageDropZone
            label="Фото светлая тема"
            hint="Загрузите фото баннера для светлой темы или вставьте ссылку ниже."
            recommendedSize="1920×800 px"
            recommendedFormat="JPG / WEBP, широкий баннер"
            value={banner.imageLight}
            onChange={(value) => updateBanner(banner.id, { imageLight: value })}
          />
          <ImageDropZone
            label="Фото тёмная тема"
            hint="Можно загрузить отдельную картинку для тёмной темы."
            recommendedSize="1920×800 px"
            recommendedFormat="JPG / WEBP, широкий баннер"
            value={banner.imageDark}
            onChange={(value) => updateBanner(banner.id, { imageDark: value })}
          />
          <ImageDropZone
            label="Фото для телефона"
            hint="Вертикальная или компактная версия для мобильного экрана."
            recommendedSize="900×1200 px"
            recommendedFormat="JPG / WEBP, 3:4"
            value={banner.imageMobile}
            onChange={(value) => updateBanner(banner.id, { imageMobile: value })}
          />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => updateBanner(banner.id, { enabled: !banner.enabled })} className={`rounded-xl border px-5 py-3 text-sm font-semibold ${banner.enabled ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>{banner.enabled ? "Активен" : "Скрыт"}</button>
        <button type="button" disabled={disabled} onClick={() => saveBanner(banner)} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50">Сохранить баннер</button>
        <button type="button" disabled={disabled} onClick={() => deleteBanner(banner)} className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/15 disabled:opacity-50">Удалить</button>
      </div>
    </div>
  );
}

function BenefitEditor({ benefit, disabled, updateBenefit, saveBenefit, deleteBenefit }: { benefit: SiteBenefit; disabled: boolean; updateBenefit: (id: string, patch: Partial<SiteBenefit>) => void; saveBenefit: (benefit: SiteBenefit) => void; deleteBenefit: (benefit: SiteBenefit) => void }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <LibraryField label="Название"><input value={benefit.title} onChange={(event) => updateBenefit(benefit.id, { title: event.target.value })} className="admin-input" /></LibraryField>
        <LibraryField label="Иконка"><input value={benefit.icon} onChange={(event) => updateBenefit(benefit.id, { icon: event.target.value })} className="admin-input" placeholder="✓ / 🚚 / 🛡️" /></LibraryField>
        <LibraryField label="Описание"><textarea value={benefit.description} onChange={(event) => updateBenefit(benefit.id, { description: event.target.value })} className="admin-textarea min-h-[110px]" /></LibraryField>
        <div className="md:col-span-2">
          <ImageDropZone
            label="Фото / иконка преимущества"
            hint="Если фото пустое, покажется текстовая иконка."
            recommendedSize="256×256 px"
            recommendedFormat="PNG / SVG / WEBP, прозрачный фон"
            value={benefit.image}
            onChange={(value) => updateBenefit(benefit.id, { image: value })}
          />
        </div>
        <LibraryField label="Ссылка, если нужна"><input value={benefit.href} onChange={(event) => updateBenefit(benefit.id, { href: event.target.value })} className="admin-input" /></LibraryField>
        <LibraryField label="Порядок"><input type="number" value={benefit.sortOrder} onChange={(event) => updateBenefit(benefit.id, { sortOrder: Number(event.target.value) })} className="admin-input" /></LibraryField>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => updateBenefit(benefit.id, { enabled: !benefit.enabled })} className={`rounded-xl border px-5 py-3 text-sm font-semibold ${benefit.enabled ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>{benefit.enabled ? "Активно" : "Скрыто"}</button>
        <button type="button" disabled={disabled} onClick={() => saveBenefit(benefit)} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50">Сохранить преимущество</button>
        <button type="button" disabled={disabled} onClick={() => deleteBenefit(benefit)} className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/15 disabled:opacity-50">Удалить</button>
      </div>
    </div>
  );
}

function LibraryField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><div className="mb-2 text-sm font-medium text-white/70">{label}</div>{children}</label>;
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-8 text-sm text-white/45">{children}</div>;
}

function LibraryAlert({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return <div className={`mt-5 rounded-2xl border px-5 py-4 text-sm ${tone === "success" ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>{children}</div>;
}