"use client";

import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { SiteContentLibraryForm } from "@/components/admin/site-content-library-form";
import { FaqAdminClient } from "@/components/admin/faq-admin-client";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import type {
  ModuleDefinition,
  PageBlockSettings,
  PageBlockType,
  PageBuilderState,
  PageKey,
  SitePageBlock,
} from "@/lib/page-builder-db";
import type { SiteEditorSettings } from "@/lib/site-settings-db";
import type { SiteContentLibrary } from "@/lib/site-content-library-db";

type SaveState = "idle" | "saving" | "saved" | "error";
type BuilderState = "idle" | "saving" | "saved" | "error";
type SettingsTab = "branding" | "contacts" | "seo";

type Props = {
  initialSettings: SiteEditorSettings;
  initialPageBuilder: PageBuilderState;
  initialContentLibrary: SiteContentLibrary;
};

const settingTabs: Array<{ key: SettingsTab; title: string; text: string }> = [
  { key: "branding", title: "Бренд", text: "Логотип, название и тема сайта." },
  { key: "contacts", title: "Контакты", text: "Телефон, адреса, ПВЗ и соцсети." },
  { key: "seo", title: "SEO", text: "Title, description и ключевые слова." },
];

export function SiteEditorForm({ initialSettings, initialPageBuilder, initialContentLibrary }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [pageBuilder, setPageBuilder] = useState(initialPageBuilder);
  const [contentLibrary, setContentLibrary] = useState(initialContentLibrary);
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>("branding");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [builderState, setBuilderState] = useState<BuilderState>("idle");
  const [moduleToAdd, setModuleToAdd] = useState<PageBlockType>(
    initialPageBuilder.modules.find((module) => module.pageKeys.includes("home"))?.type ?? "promo-banner"
  );

  const activePageMeta = pageBuilder.pages.find((page) => page.key === activePage) ?? pageBuilder.pages[0];
  const activeBlocks = useMemo(
    () => [...(pageBuilder.blocks[activePage] ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [activePage, pageBuilder.blocks]
  );
  const selectedBlock = activeBlocks.find((block) => block.id === selectedBlockId) ?? activeBlocks[0] ?? null;
  const availableModules = useMemo(
    () => pageBuilder.modules.filter((module) => module.pageKeys.includes(activePage)),
    [activePage, pageBuilder.modules],
  );
  const enabledBlocks = activeBlocks.filter((block) => block.enabled).length;

  function switchActivePage(pageKey: PageKey) {
    setActivePage(pageKey);
    setSelectedBlockId("");
    const firstModule = pageBuilder.modules.find((module) => module.pageKeys.includes(pageKey));
    if (firstModule) setModuleToAdd(firstModule.type);
  }

  function switchSettingsTab(tabKey: SettingsTab) {
    setActiveSettingsTab(tabKey);
  }

  useEffect(() => {
    if (availableModules.some((module) => module.type === moduleToAdd)) return;
    const firstModule = availableModules[0];
    if (firstModule) setModuleToAdd(firstModule.type);
  }, [activePage, availableModules, moduleToAdd]);

  function updateBranding<K extends keyof SiteEditorSettings["branding"]>(key: K, value: SiteEditorSettings["branding"][K]) {
    setSettings((current) => ({
      ...current,
      branding: {
        ...current.branding,
        [key]: value,
      },
    }));
  }

  function updateContacts<K extends keyof SiteEditorSettings["contacts"]>(key: K, value: SiteEditorSettings["contacts"][K]) {
    setSettings((current) => ({
      ...current,
      contacts: {
        ...current.contacts,
        [key]: value,
      },
    }));
  }

  function updateAddress(
    id: string,
    patch: Partial<SiteEditorSettings["contacts"]["addresses"][number]>
  ) {
    setSettings((current) => {
      const nextAddresses = current.contacts.addresses.map((address) =>
        address.id === id ? { ...address, ...patch } : address
      );
      const normalizedAddresses = patch.isMain
        ? nextAddresses.map((address) => ({ ...address, isMain: address.id === id }))
        : nextAddresses;
      const mainAddress = normalizedAddresses.find((address) => address.isMain) ?? normalizedAddresses[0];

      return {
        ...current,
        contacts: {
          ...current.contacts,
          address: mainAddress?.address ?? current.contacts.address,
          city: mainAddress?.city ?? current.contacts.city,
          workingHours: mainAddress?.workingHours ?? current.contacts.workingHours,
          addresses: normalizedAddresses,
        },
      };
    });
  }

  function addAddress() {
    const id = `address-${Date.now()}`;

    setSettings((current) => ({
      ...current,
      contacts: {
        ...current.contacts,
        addresses: [
          ...current.contacts.addresses,
          {
            id,
            title: "Новая точка",
            type: "pickup",
            city: current.contacts.city || "Москва",
            address: "",
            metro: "",
            workingHours: current.contacts.workingHours || "Ежедневно, 10:00–21:00",
            phone: current.contacts.phone,
            active: true,
            isMain: false,
          },
        ],
      },
    }));
  }

  function removeAddress(id: string) {
    setSettings((current) => {
      const nextAddresses = current.contacts.addresses.filter((address) => address.id !== id);
      const normalizedAddresses = nextAddresses.length
        ? nextAddresses.some((address) => address.isMain)
          ? nextAddresses
          : nextAddresses.map((address, index) => ({ ...address, isMain: index === 0 }))
        : current.contacts.addresses;
      const mainAddress = normalizedAddresses.find((address) => address.isMain) ?? normalizedAddresses[0];

      return {
        ...current,
        contacts: {
          ...current.contacts,
          address: mainAddress?.address ?? current.contacts.address,
          city: mainAddress?.city ?? current.contacts.city,
          workingHours: mainAddress?.workingHours ?? current.contacts.workingHours,
          addresses: normalizedAddresses,
        },
      };
    });
  }

  function updateSeo<K extends keyof SiteEditorSettings["seo"]>(key: K, value: SiteEditorSettings["seo"][K]) {
    setSettings((current) => ({
      ...current,
      seo: {
        ...current.seo,
        [key]: value,
      },
    }));
  }

  function updateLocalBlock(id: string, patch: Partial<SitePageBlock>) {
    setPageBuilder((current) => ({
      ...current,
      blocks: {
        ...current.blocks,
        [activePage]: (current.blocks[activePage] ?? []).map((block) =>
          block.id === id ? { ...block, ...patch } : block
        ),
      },
    }));
  }

  function updateBlockSetting(id: string, key: string, value: PageBlockSettings[string]) {
    setPageBuilder((current) => ({
      ...current,
      blocks: {
        ...current.blocks,
        [activePage]: (current.blocks[activePage] ?? []).map((block) =>
          block.id === id
            ? {
                ...block,
                settings: {
                  ...block.settings,
                  [key]: value,
                },
              }
            : block
        ),
      },
    }));
  }

  async function refreshBuilder() {
    const response = await fetch("/api/admin/page-blocks", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Не удалось обновить список модулей.");
    }

    const payload = (await response.json()) as PageBuilderState;
    setPageBuilder(payload);
  }

  async function saveBlock(block: SitePageBlock) {
    setBuilderState("saving");

    const response = await fetch(`/api/admin/page-blocks/${block.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: block.title,
        description: block.description,
        enabled: block.enabled,
        sortOrder: block.sortOrder,
        type: block.type,
        settings: block.settings,
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setBuilderState("error");
      return;
    }

    await refreshBuilder().catch(() => null);
    setBuilderState("saved");
    window.setTimeout(() => setBuilderState("idle"), 2200);
  }

  async function toggleBlock(block: SitePageBlock) {
    updateLocalBlock(block.id, { enabled: !block.enabled });
    await saveBlock({ ...block, enabled: !block.enabled });
  }

  async function moveBlock(block: SitePageBlock, direction: "up" | "down") {
    setBuilderState("saving");

    const response = await fetch(`/api/admin/page-blocks/${block.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", direction }),
    }).catch(() => null);

    if (!response?.ok) {
      setBuilderState("error");
      return;
    }

    await refreshBuilder().catch(() => null);
    setBuilderState("saved");
    window.setTimeout(() => setBuilderState("idle"), 1600);
  }

  async function addBlock() {
    if (!availableModules.some((module) => module.type === moduleToAdd)) {
      setBuilderState("error");
      return;
    }

    setBuilderState("saving");

    const response = await fetch("/api/admin/page-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageKey: activePage, type: moduleToAdd }),
    }).catch(() => null);

    if (!response?.ok) {
      setBuilderState("error");
      return;
    }

    await refreshBuilder().catch(() => null);
    setBuilderState("saved");
    window.setTimeout(() => setBuilderState("idle"), 1800);
  }

  async function removeBlock(block: SitePageBlock) {
    const confirmed = window.confirm(`Удалить модуль “${block.title}”? Его можно будет добавить заново.`);

    if (!confirmed) return;

    setBuilderState("saving");

    const response = await fetch(`/api/admin/page-blocks/${block.id}`, {
      method: "DELETE",
    }).catch(() => null);

    if (!response?.ok) {
      setBuilderState("error");
      return;
    }

    await refreshBuilder().catch(() => null);
    setSelectedBlockId("");
    setBuilderState("saved");
    window.setTimeout(() => setBuilderState("idle"), 1800);
  }

  async function saveSettings() {
    setSaveState("saving");

    const response = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "site", value: settings }),
    }).catch(() => null);

    if (!response?.ok) {
      setSaveState("error");
      return;
    }

    const payload = (await response.json().catch(() => null)) as { site?: SiteEditorSettings } | null;

    if (payload?.site) {
      setSettings(payload.site);
    }

    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 2500);
  }

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex min-h-[76px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 sm:px-6">
          <Link href="/nz-console" className="text-xl font-bold tracking-[-0.04em]">
            Neontech Console
          </Link>

          <div className="hidden items-center gap-3 text-sm text-white/55 md:flex">
            <span>Редактор сайта</span>
            <span>·</span>
            <span>простая настройка блоков</span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            Предпросмотр
          </Link>
        </header>

        <section className="mt-8 rounded-[34px] border border-white/10 bg-white/[0.035] p-5 sm:p-8">
          <BackLink href="/nz-console" label="В админку" variant="admin" />

          <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
                Конструктор сайта
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">Редактор сайта</h1>
              <p className="mt-4 max-w-[820px] text-sm leading-relaxed text-white/55">
                Проще: выбери страницу, выбери блок, измени пару понятных полей и сохрани. Все сложные настройки спрятаны ниже в “Глобальные настройки”.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                target="_blank"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Открыть сайт
              </Link>
              <button
                type="button"
                onClick={saveSettings}
                disabled={saveState === "saving"}
                className="rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveState === "saving" ? "Сохраняю..." : "Сохранить настройки"}
              </button>
            </div>
          </div>

          {saveState === "saved" && <Alert tone="success">Глобальные настройки сохранены.</Alert>}
          {saveState === "error" && <Alert tone="error">Не удалось сохранить настройки.</Alert>}
          {builderState === "saved" && <Alert tone="success">Модуль обновлён.</Alert>}
          {builderState === "error" && <Alert tone="error">Не удалось сохранить модуль.</Alert>}
        </section>

        <section className="mt-6 rounded-[34px] border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {pageBuilder.pages.map((page) => (
              <button
                type="button"
                key={page.key}
                onPointerDown={() => switchActivePage(page.key)}
                onClick={() => switchActivePage(page.key)}
                className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition-all ${
                  activePage === page.key
                    ? "border-blue-500/50 bg-blue-500/15 text-white"
                    : "border-white/10 bg-black/20 text-white/60 hover:border-blue-500/35 hover:bg-blue-500/10 hover:text-white"
                }`}
              >
                {page.title}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="rounded-[34px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-blue-400">Страница</div>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]">{activePageMeta?.title ?? "Страница"}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{activePageMeta?.description}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/50">
                {enabledBlocks}/{activeBlocks.length} вкл
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Добавить блок</div>
              <div className="mt-3 grid gap-3">
                <select
                  value={moduleToAdd}
                  onChange={(event) => setModuleToAdd(event.target.value as PageBlockType)}
                  className="admin-input"
                >
                  {availableModules.map((module) => (
                    <option key={module.type} value={module.type}>
                      {module.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addBlock}
                  disabled={builderState === "saving"}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  + Добавить блок
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {activeBlocks.map((block) => (
                <BlockListItem
                  key={block.id}
                  block={block}
                  module={availableModules.find((module) => module.type === block.type)}
                  active={selectedBlock?.id === block.id}
                  onSelect={() => setSelectedBlockId(block.id)}
                  onToggle={() => toggleBlock(block)}
                  disabled={builderState === "saving"}
                />
              ))}

              {activeBlocks.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/45">
                  На этой странице нет блоков. Добавь первый блок выше.
                </div>
              )}
            </div>
          </aside>

          <section className="rounded-[34px] border border-white/10 bg-white/[0.035] p-5 sm:p-8">
            {selectedBlock ? (
              <ModuleInspector
                block={selectedBlock}
                module={availableModules.find((module) => module.type === selectedBlock.type)}
                first={activeBlocks[0]?.id === selectedBlock.id}
                last={activeBlocks[activeBlocks.length - 1]?.id === selectedBlock.id}
                onChange={(patch) => updateLocalBlock(selectedBlock.id, patch)}
                onSettingChange={(key, value) => updateBlockSetting(selectedBlock.id, key, value)}
                onSave={() => saveBlock(selectedBlock)}
                onToggle={() => toggleBlock(selectedBlock)}
                onMove={(direction) => moveBlock(selectedBlock, direction)}
                onDelete={() => removeBlock(selectedBlock)}
                disabled={builderState === "saving"}
                contentLibrary={contentLibrary}
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-8 text-sm text-white/45">
                Выбери блок слева или добавь новый.
              </div>
            )}
          </section>
        </section>

        {activePage === "home" ? (
          <SiteContentLibraryForm
            initialLibrary={contentLibrary}
            onChange={setContentLibrary}
          />
        ) : null}

        <details className="mt-6 rounded-[34px] border border-white/10 bg-white/[0.035] p-5 sm:p-8">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-blue-400">Дополнительно</div>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]">Глобальные настройки сайта</h2>
                <p className="mt-2 text-sm text-white/45">Логотипы, контакты, адреса и SEO. Обычно сюда заходят реже.</p>
              </div>
              <span className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">Открыть настройки</span>
            </div>
          </summary>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {settingTabs.map((tab) => (
              <button
                type="button"
                key={tab.key}
                onPointerDown={() => switchSettingsTab(tab.key)}
                onClick={() => switchSettingsTab(tab.key)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  activeSettingsTab === tab.key
                    ? "border-blue-500/50 bg-blue-500/15"
                    : "border-white/10 bg-black/20 hover:border-blue-500/35 hover:bg-blue-500/10"
                }`}
              >
                <div className="text-sm font-bold">{tab.title}</div>
                <div className="mt-2 text-xs leading-relaxed text-white/45">{tab.text}</div>
              </button>
            ))}
          </div>

          <div className="mt-8">
            {activeSettingsTab === "branding" && (
              <BrandingEditor settings={settings} updateBranding={updateBranding} />
            )}
            {activeSettingsTab === "contacts" && (
              <ContactsEditor
                settings={settings}
                updateContacts={updateContacts}
                updateAddress={updateAddress}
                addAddress={addAddress}
                removeAddress={removeAddress}
              />
            )}
            {activeSettingsTab === "seo" && <SeoEditor settings={settings} updateSeo={updateSeo} />}
          </div>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saveState === "saving"}
            className="mt-8 w-full rounded-2xl bg-blue-600 px-7 py-5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveState === "saving" ? "Сохраняю..." : "Сохранить глобальные настройки"}
          </button>
        </details>

        <AdminStyle />
      </div>
    </main>
  );
}

function BlockListItem({
  block,
  module,
  active,
  onSelect,
  onToggle,
  disabled,
}: {
  block: SitePageBlock;
  module?: ModuleDefinition;
  active: boolean;
  onSelect: () => void;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        active ? "border-blue-500/55 bg-blue-500/15" : "border-white/10 bg-black/20 hover:border-blue-500/35"
      }`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{block.title}</div>
            <div className="mt-1 text-xs text-white/40">{module?.title ?? block.type}</div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${
              block.enabled
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {block.enabled ? "Вкл" : "Скрыт"}
          </span>
        </div>
      </button>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onSelect} className="admin-mini-button flex-1">
          Настроить
        </button>
        <button type="button" onClick={onToggle} disabled={disabled} className="admin-mini-button">
          {block.enabled ? "Скрыть" : "Показать"}
        </button>
      </div>
    </div>
  );
}

function ModuleInspector({
  block,
  module,
  first,
  last,
  onChange,
  onSettingChange,
  onSave,
  onToggle,
  onMove,
  onDelete,
  disabled,
  contentLibrary,
}: {
  block: SitePageBlock;
  module?: ModuleDefinition;
  first: boolean;
  last: boolean;
  onChange: (patch: Partial<SitePageBlock>) => void;
  onSettingChange: (key: string, value: PageBlockSettings[string]) => void;
  onSave: () => void;
  onToggle: () => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
  disabled: boolean;
  contentLibrary: SiteContentLibrary;
}) {
  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/45">
              #{block.sortOrder}
            </span>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
              {module?.title ?? block.type}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs ${
                block.enabled
                  ? "border-green-500/30 bg-green-500/10 text-green-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {block.enabled ? "Включён" : "Скрыт"}
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">Настройки блока</h2>
          <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-white/50">
            Тип блока выбирается только при добавлении. Так проще не запутаться и случайно не сломать структуру страницы.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:w-[260px] lg:grid-cols-1">
          <button type="button" onClick={onToggle} disabled={disabled} className="admin-action-button">
            {block.enabled ? "Скрыть блок" : "Показать блок"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onMove("up")} disabled={disabled || first} className="admin-action-button disabled:opacity-35">
              ↑ Выше
            </button>
            <button type="button" onClick={() => onMove("down")} disabled={disabled || last} className="admin-action-button disabled:opacity-35">
              ↓ Ниже
            </button>
          </div>
          <button type="button" onClick={onSave} disabled={disabled} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50">
            Сохранить блок
          </button>
          <button type="button" onClick={onDelete} disabled={disabled} className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/15 disabled:opacity-50">
            Удалить блок
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Field label="Название в админке">
          <input value={block.title} onChange={(event) => onChange({ title: event.target.value })} className="admin-input" />
        </Field>
        <Field label="Комментарий для себя">
          <input value={block.description} onChange={(event) => onChange({ description: event.target.value })} className="admin-input" />
        </Field>
      </div>

      <ModuleSettings block={block} onSettingChange={onSettingChange} contentLibrary={contentLibrary} />
    </div>
  );
}

function ModuleSettings({ block, onSettingChange, contentLibrary }: { block: SitePageBlock; onSettingChange: (key: string, value: PageBlockSettings[string]) => void; contentLibrary: SiteContentLibrary }) {
  const settings = block.settings;

  if (block.type === "faq-header") {
    return (
      <div className="mt-7 grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6 md:grid-cols-2">
        <Field label="Заголовок страницы">
          <input
            value={getSettingText(settings, "title")}
            onChange={(event) => onSettingChange("title", event.target.value)}
            className="admin-input"
          />
        </Field>

        <Field label="Подзаголовок">
          <input
            value={getSettingText(settings, "subtitle")}
            onChange={(event) => onSettingChange("subtitle", event.target.value)}
            className="admin-input"
          />
        </Field>

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={getSettingBoolean(settings, "showSupportButton", true)}
            onChange={(event) => onSettingChange("showSupportButton", event.target.checked)}
          />
          Показывать кнопку поддержки
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={getSettingBoolean(settings, "showCatalogButton", true)}
            onChange={(event) => onSettingChange("showCatalogButton", event.target.checked)}
          />
          Показывать кнопку каталога
        </label>

        <Field label="Текст кнопки поддержки">
          <input
            value={getSettingText(settings, "supportButtonText") || "Написать в поддержку"}
            onChange={(event) => onSettingChange("supportButtonText", event.target.value)}
            className="admin-input"
          />
        </Field>

        <Field label="Ссылка кнопки поддержки">
          <input
            value={getSettingText(settings, "supportButtonHref") || "/help"}
            onChange={(event) => onSettingChange("supportButtonHref", event.target.value)}
            className="admin-input"
          />
        </Field>

        <Field label="Текст кнопки каталога">
          <input
            value={getSettingText(settings, "catalogButtonText") || "Перейти в каталог"}
            onChange={(event) => onSettingChange("catalogButtonText", event.target.value)}
            className="admin-input"
          />
        </Field>

        <Field label="Ссылка кнопки каталога">
          <input
            value={getSettingText(settings, "catalogButtonHref") || "/catalog"}
            onChange={(event) => onSettingChange("catalogButtonHref", event.target.value)}
            className="admin-input"
          />
        </Field>
      </div>
    );
  }

  if (block.type === "promo-banner") {
    return <BannerModuleEditor settings={settings} onSettingChange={onSettingChange} contentLibrary={contentLibrary} />;
  }

  if (block.type === "benefits") {
    return <BenefitsModuleEditor settings={settings} onSettingChange={onSettingChange} contentLibrary={contentLibrary} />;
  }

  if (block.type === "faq-content") {
    return (
      <div className="mt-7">
        <div className="mb-5 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-blue-300">
            Контент страницы FAQ
          </div>
          <h3 className="mt-2 text-xl font-bold">Разделы, вопросы, ответы, фото и нижние карточки</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Всё редактируется здесь. Отдельно переходить в другой раздел админки больше не нужно.
          </p>
        </div>
        <FaqAdminClient />
      </div>
    );
  }

  const hasTextFields = ["category-grid", "popular-products", "new-arrivals", "text-image", "product-carousel", "catalog-header", "catalog-empty", "support"].includes(block.type);
  const hasButtonFields = ["category-grid", "popular-products", "new-arrivals", "product-carousel"].includes(block.type);
  const hasImageField = ["text-image"].includes(block.type);
  const hasLimitField = ["category-grid", "popular-products", "new-arrivals", "product-carousel", "related-products", "catalog-grid"].includes(block.type);
  const hasFilterField = block.type === "product-carousel";
  const hasToneField = ["text-image"].includes(block.type);

  return (
    <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Основные поля</div>
          <h3 className="mt-2 text-xl font-bold tracking-[-0.035em]">Что видно на сайте</h3>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {hasTextFields && (
          <>
            <Field label="Заголовок">
              <input value={getSettingText(settings, "title")} onChange={(event) => onSettingChange("title", event.target.value)} className="admin-input" />
            </Field>
            <Field label="Описание">
              <input value={getSettingText(settings, "subtitle")} onChange={(event) => onSettingChange("subtitle", event.target.value)} className="admin-input" />
            </Field>
          </>
        )}

        {hasButtonFields && (
          <>
            <Field label="Текст кнопки">
              <input value={getSettingText(settings, "buttonText")} onChange={(event) => onSettingChange("buttonText", event.target.value)} className="admin-input" />
            </Field>
            <Field label="Куда ведёт кнопка">
              <input value={getSettingText(settings, "buttonHref")} onChange={(event) => onSettingChange("buttonHref", event.target.value)} className="admin-input" />
            </Field>
          </>
        )}

        {hasImageField && (
          <Field label="Картинка / баннер · рекомендуется 1600×900 px">
            <input value={getSettingText(settings, "image")} onChange={(event) => onSettingChange("image", event.target.value)} className="admin-input" placeholder="/uploads/banner.png или https://..." />
          </Field>
        )}

        {hasLimitField && (
          <Field label="Сколько показывать">
            <input type="number" min={1} value={getSettingNumber(settings, "limit", 12)} onChange={(event) => onSettingChange("limit", Number(event.target.value))} className="admin-input" />
          </Field>
        )}

        {hasFilterField && (
          <Field label="Какие товары брать">
            <select value={getSettingText(settings, "filter") || "all"} onChange={(event) => onSettingChange("filter", event.target.value)} className="admin-input">
              <option value="all">Все товары</option>
              <option value="popular">Популярные</option>
              <option value="new">Новинки</option>
            </select>
          </Field>
        )}

        {hasButtonFields && (
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/70">
            <input type="checkbox" checked={getSettingBoolean(settings, "showButton", true)} onChange={(event) => onSettingChange("showButton", event.target.checked)} />
            Показывать кнопку
          </label>
        )}

        {block.type === "text-image" && (
          <Field label="Где картинка">
            <select value={getSettingText(settings, "imageSide") || "right"} onChange={(event) => onSettingChange("imageSide", event.target.value)} className="admin-input">
              <option value="right">Справа</option>
              <option value="left">Слева</option>
            </select>
          </Field>
        )}

        {hasToneField && (
          <Field label="Стиль блока">
            <select value={getSettingText(settings, "tone") || "blue"} onChange={(event) => onSettingChange("tone", event.target.value)} className="admin-input">
              <option value="blue">Синий</option>
              <option value="dark">Тёмный</option>
              <option value="light">Светлый</option>
            </select>
          </Field>
        )}
      </div>

      {!hasTextFields && !hasButtonFields && !hasImageField && !hasLimitField && !hasFilterField ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-white/45">
          У этого системного блока пока нет полей. Его можно включить, скрыть или поменять порядок.
        </div>
      ) : null}
    </div>
  );
}

function BannerModuleEditor({
  settings,
  onSettingChange,
  contentLibrary,
}: {
  settings: PageBlockSettings;
  onSettingChange: (key: string, value: PageBlockSettings[string]) => void;
  contentLibrary: SiteContentLibrary;
}) {
  const selectedBannerId = getSettingText(settings, "bannerId");
  const selectedBanner = contentLibrary.banners.find((banner) => banner.id === selectedBannerId);

  return (
    <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Баннер из библиотеки</div>
        <h3 className="mt-2 text-xl font-bold tracking-[-0.035em]">Что показываем на сайте</h3>
        <p className="mt-2 text-sm text-white/45">Создай баннер ниже в библиотеке, а здесь просто выбери его для модуля.</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Выбрать баннер">
          <select value={selectedBannerId} onChange={(event) => onSettingChange("bannerId", event.target.value)} className="admin-input">
            <option value="">Не выбран — использовать ручные поля</option>
            {contentLibrary.banners.map((banner) => (
              <option key={banner.id} value={banner.id}>{banner.adminTitle}</option>
            ))}
          </select>
        </Field>
        <Field label="Ручной заголовок, если баннер не выбран">
          <input value={getSettingText(settings, "title")} onChange={(event) => onSettingChange("title", event.target.value)} className="admin-input" />
        </Field>
        <Field label="Ручное описание">
          <input value={getSettingText(settings, "subtitle")} onChange={(event) => onSettingChange("subtitle", event.target.value)} className="admin-input" />
        </Field>
        <Field label="Ручная картинка · рекомендуется 1920×800 px">
          <input value={getSettingText(settings, "image")} onChange={(event) => onSettingChange("image", event.target.value)} className="admin-input" />
        </Field>
      </div>

      {selectedBanner ? (
        <div className="mt-5 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-sm text-blue-100/80">
          Выбран: <b>{selectedBanner.adminTitle}</b>. Текст, картинки и ссылка редактируются в блоке “Баннеры и преимущества” ниже.
        </div>
      ) : null}
    </div>
  );
}

function BenefitsModuleEditor({
  settings,
  onSettingChange,
  contentLibrary,
}: {
  settings: PageBlockSettings;
  onSettingChange: (key: string, value: PageBlockSettings[string]) => void;
  contentLibrary: SiteContentLibrary;
}) {
  return (
    <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Преимущества из библиотеки</div>
        <h3 className="mt-2 text-xl font-bold tracking-[-0.035em]">Настройки блока</h3>
        <p className="mt-2 text-sm text-white/45">Карточки преимуществ создаются ниже в библиотеке. Здесь меняется только заголовок и вид блока.</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Заголовок блока">
          <input value={getSettingText(settings, "title")} onChange={(event) => onSettingChange("title", event.target.value)} className="admin-input" />
        </Field>
        <Field label="Описание блока">
          <input value={getSettingText(settings, "subtitle")} onChange={(event) => onSettingChange("subtitle", event.target.value)} className="admin-input" />
        </Field>
        <Field label="Стиль">
          <select value={getSettingText(settings, "style") || "cards"} onChange={(event) => onSettingChange("style", event.target.value)} className="admin-input">
            <option value="cards">Карточки</option>
            <option value="line">В одну строку</option>
            <option value="compact">Компактно</option>
          </select>
        </Field>
        <Field label="Сколько показывать">
          <input type="number" min={1} value={getSettingNumber(settings, "limit", 6)} onChange={(event) => onSettingChange("limit", Number(event.target.value))} className="admin-input" />
        </Field>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm text-white/45">
        Активных преимуществ в библиотеке: {contentLibrary.benefits.filter((benefit) => benefit.enabled && benefit.placement === "store").length}.
      </div>
    </div>
  );
}

function BrandingEditor({ settings, updateBranding }: { settings: SiteEditorSettings; updateBranding: <K extends keyof SiteEditorSettings["branding"]>(key: K, value: SiteEditorSettings["branding"][K]) => void }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Название магазина"><input value={settings.branding.storeName} onChange={(event) => updateBranding("storeName", event.target.value)} className="admin-input" /></Field>
        <Field label="Тема сайта по умолчанию">
          <select className="admin-input" value={settings.branding.defaultTheme} onChange={(event) => updateBranding("defaultTheme", event.target.value as SiteEditorSettings["branding"]["defaultTheme"])}>
            <option value="system">Системная</option>
            <option value="light">Светлая</option>
            <option value="dark">Тёмная</option>
          </select>
        </Field>
        <Field label="Логотип для тёмной темы · рекомендуется 600×200 px, PNG/SVG"><input value={settings.branding.logoLight} onChange={(event) => updateBranding("logoLight", event.target.value)} className="admin-input" placeholder="/logo-light.webp" /></Field>
        <Field label="Логотип для светлой темы · рекомендуется 600×200 px, PNG/SVG"><input value={settings.branding.logoDark} onChange={(event) => updateBranding("logoDark", event.target.value)} className="admin-input" placeholder="/logo-dark.webp" /></Field>
        <Field label="Мобильный логотип · рекомендуется 256×256 px, PNG/SVG"><input value={settings.branding.mobileLogo} onChange={(event) => updateBranding("mobileLogo", event.target.value)} className="admin-input" placeholder="Можно оставить пустым — возьмётся основной" /></Field>
        <Field label="Favicon / иконка вкладки · рекомендуется 64×64 px, PNG/ICO"><input value={settings.branding.favicon} onChange={(event) => updateBranding("favicon", event.target.value)} className="admin-input" placeholder="/favicon.ico" /></Field>
        <Field label="Основной цвет"><input value={settings.branding.primaryColor} onChange={(event) => updateBranding("primaryColor", event.target.value)} className="admin-input" /></Field>
        <Field label="Акцентный цвет"><input value={settings.branding.accentColor} onChange={(event) => updateBranding("accentColor", event.target.value)} className="admin-input" /></Field>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
        <div className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Мобильная нижняя панель</div>
        <h3 className="mt-2 text-xl font-bold tracking-[-0.035em]">Иконки навигации</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          Можно поставить эмодзи, короткий символ или путь к картинке. Для загружаемых иконок рекомендуется 128×128 px, SVG или PNG с прозрачным фоном.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <NavIconEditor label="Главная" value={settings.branding.navIconHome} onChange={(value) => updateBranding("navIconHome", value)} />
          <NavIconEditor label="Каталог" value={settings.branding.navIconCatalog} onChange={(value) => updateBranding("navIconCatalog", value)} />
          <NavIconEditor label="Новинки" value={settings.branding.navIconNew} onChange={(value) => updateBranding("navIconNew", value)} />
          <NavIconEditor label="Поддержка" value={settings.branding.navIconSupport} onChange={(value) => updateBranding("navIconSupport", value)} />
          <NavIconEditor label="Корзина" value={settings.branding.navIconCart} onChange={(value) => updateBranding("navIconCart", value)} />
        </div>
      </div>
    </div>
  );
}

function ContactsEditor({
  settings,
  updateContacts,
  updateAddress,
  addAddress,
  removeAddress,
}: {
  settings: SiteEditorSettings;
  updateContacts: <K extends keyof SiteEditorSettings["contacts"]>(key: K, value: SiteEditorSettings["contacts"][K]) => void;
  updateAddress: (id: string, patch: Partial<SiteEditorSettings["contacts"]["addresses"][number]>) => void;
  addAddress: () => void;
  removeAddress: (id: string) => void;
}) {
  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Телефон"><input value={settings.contacts.phone} onChange={(event) => updateContacts("phone", event.target.value)} className="admin-input" /></Field>
        <Field label="Подпись телефона"><input value={settings.contacts.phoneText} onChange={(event) => updateContacts("phoneText", event.target.value)} className="admin-input" /></Field>
        <Field label="E-mail"><input value={settings.contacts.email} onChange={(event) => updateContacts("email", event.target.value)} className="admin-input" /></Field>
        <Field label="Подпись e-mail"><input value={settings.contacts.emailText} onChange={(event) => updateContacts("emailText", event.target.value)} className="admin-input" /></Field>
        <Field label="Telegram"><input value={settings.contacts.telegram} onChange={(event) => updateContacts("telegram", event.target.value)} className="admin-input" /></Field>
        <Field label="WhatsApp"><input value={settings.contacts.whatsapp} onChange={(event) => updateContacts("whatsapp", event.target.value)} className="admin-input" /></Field>
        <Field label="Город"><input value={settings.contacts.city} onChange={(event) => updateContacts("city", event.target.value)} className="admin-input" /></Field>
        <Field label="Режим работы"><input value={settings.contacts.workingHours} onChange={(event) => updateContacts("workingHours", event.target.value)} className="admin-input" /></Field>
      </div>

      <div className="mt-8 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-[-0.035em]">Адреса и точки выдачи</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">Эти адреса потом выбираются в способах получения.</p>
          </div>
          <button type="button" onClick={addAddress} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500">Добавить адрес</button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {settings.contacts.addresses.map((address) => (
          <div key={address.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Название точки"><input value={address.title} onChange={(event) => updateAddress(address.id, { title: event.target.value })} className="admin-input" /></Field>
              <Field label="Тип">
                <select value={address.type} onChange={(event) => updateAddress(address.id, { type: event.target.value as SiteEditorSettings["contacts"]["addresses"][number]["type"] })} className="admin-input">
                  <option value="showroom">Шоурум</option>
                  <option value="pickup">Пункт выдачи</option>
                  <option value="office">Офис</option>
                </select>
              </Field>
              <Field label="Город"><input value={address.city} onChange={(event) => updateAddress(address.id, { city: event.target.value })} className="admin-input" /></Field>
              <Field label="Метро / ориентир"><input value={address.metro} onChange={(event) => updateAddress(address.id, { metro: event.target.value })} className="admin-input" /></Field>
              <Field label="Адрес"><input value={address.address} onChange={(event) => updateAddress(address.id, { address: event.target.value })} className="admin-input" /></Field>
              <Field label="Режим работы"><input value={address.workingHours} onChange={(event) => updateAddress(address.id, { workingHours: event.target.value })} className="admin-input" /></Field>
              <Field label="Телефон точки"><input value={address.phone} onChange={(event) => updateAddress(address.id, { phone: event.target.value })} className="admin-input" /></Field>
              <div className="grid gap-3 sm:grid-cols-3 md:pt-7">
                <button type="button" onClick={() => updateAddress(address.id, { active: !address.active })} className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${address.active ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>{address.active ? "Активен" : "Скрыт"}</button>
                <button type="button" onClick={() => updateAddress(address.id, { isMain: true })} className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${address.isMain ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-white/10 bg-white/[0.03] text-white/70 hover:border-blue-500/40"}`}>Главный</button>
                <button type="button" onClick={() => removeAddress(address.id)} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/15">Удалить</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeoEditor({ settings, updateSeo }: { settings: SiteEditorSettings; updateSeo: <K extends keyof SiteEditorSettings["seo"]>(key: K, value: SiteEditorSettings["seo"][K]) => void }) {
  return (
    <div className="grid gap-5">
      <Field label="Title главной"><input value={settings.seo.homeTitle} onChange={(event) => updateSeo("homeTitle", event.target.value)} className="admin-input" /></Field>
      <Field label="Description главной"><textarea value={settings.seo.homeDescription} onChange={(event) => updateSeo("homeDescription", event.target.value)} className="admin-textarea min-h-[110px]" /></Field>
      <Field label="Keywords"><input value={settings.seo.keywords} onChange={(event) => updateSeo("keywords", event.target.value)} className="admin-input" /></Field>
    </div>
  );
}

function NavIconEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const presets = ["⌂", "▦", "✦", "?", "🛒", "●", "◆", "■"];
  const isImage =
    /^(data:image\/|\/|https?:\/\/)/i.test(value.trim()) && !imageFailed;
  const storedInDatabase =
    value.startsWith("/api/public-image/setting/") ||
    value.startsWith("data:image/");

  useEffect(() => {
    setImageFailed(false);
  }, [value]);

  function uploadIcon(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;

    if (file.size > 800 * 1024) {
      window.alert("Иконка должна быть не больше 800 КБ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-semibold text-white/80">{label}</div>
      <div className="mt-1 text-[11px] leading-relaxed text-white/40">
        Рекомендуемый размер: 128×128 px · SVG / PNG · прозрачный фон
      </div>

      <div className="mt-3 flex h-16 items-center justify-center rounded-xl border border-white/10 bg-white">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-10 w-10 object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-2xl text-black">{value || "●"}</span>
        )}
      </div>

      {storedInDatabase ? (
        <div className="mt-2 rounded-lg border border-green-500/25 bg-green-500/10 px-2.5 py-2 text-[11px] font-medium text-green-300">
          Сохранено в БД. Путь ниже используется только для показа.
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm ${
              value === preset
                ? "border-blue-500 bg-blue-500/15 text-blue-300"
                : "border-white/10 bg-white/[0.03] text-white/70"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-blue-500">
        Загрузить картинку
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(event) => {
            uploadIcon(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="admin-input mt-2"
        placeholder="Символ или путь к файлу"
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-2 w-full rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300"
        >
          Удалить иконку
        </button>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-white/70">{label}</div>
      {children}
    </label>
  );
}

function Alert({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return (
    <div className={`mt-5 rounded-2xl border px-5 py-4 text-sm ${tone === "success" ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
      {children}
    </div>
  );
}

function getSettingText(settings: PageBlockSettings, key: string) {
  const value = settings[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function getSettingNumber(settings: PageBlockSettings, key: string, fallback: number) {
  const value = settings[key];
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function getSettingBoolean(settings: PageBlockSettings, key: string, fallback: boolean) {
  const value = settings[key];
  return typeof value === "boolean" ? value : fallback;
}

function AdminStyle() {
  return (
    <style jsx global>{`
      .admin-input,
      .admin-textarea {
        width: 100%;
        border-radius: 0.9rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.22);
        padding: 0.85rem 1rem;
        color: white;
        outline: none;
        transition: border-color 0.2s ease, background-color 0.2s ease;
      }

      .admin-input:focus,
      .admin-textarea:focus {
        border-color: rgba(59, 130, 246, 0.65);
        background: rgba(0, 0, 0, 0.32);
      }

      .admin-input option {
        background: #020814;
        color: white;
      }

      .admin-action-button,
      .admin-mini-button {
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.03);
        padding: 0.75rem 1.25rem;
        color: rgba(255, 255, 255, 0.82);
        font-size: 0.875rem;
        font-weight: 600;
        transition: border-color 0.2s ease, background-color 0.2s ease;
      }

      .admin-mini-button {
        padding: 0.55rem 0.8rem;
        font-size: 0.75rem;
      }

      .admin-action-button:hover:not(:disabled),
      .admin-mini-button:hover:not(:disabled) {
        border-color: rgba(59, 130, 246, 0.45);
        background: rgba(59, 130, 246, 0.1);
      }
    `}</style>
  );
}
