"use client";

import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { SystemSettings } from "@/lib/site-settings-db";

type SaveState = "idle" | "saving" | "saved" | "error";

type Props = {
  initialSettings: SystemSettings;
};

type StaffRole = "owner" | "admin" | "manager" | "content" | "support";

type StaffMember = {
  id: string;
  login: string;
  name: string;
  role: StaffRole;
  roles: StaffRole[];
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type StaffFormState = {
  login: string;
  name: string;
  roles: StaffRole[];
  password: string;
};

type SiteAddress = {
  id: string;
  title: string;
  type: "showroom" | "pickup" | "office";
  city: string;
  address: string;
  active: boolean;
  isMain: boolean;
};

const staffRoleOptions: { value: StaffRole; label: string; description: string }[] = [
  { value: "owner", label: "Главный админ", description: "Полный доступ: сотрудники, роли, настройки и весь сайт." },
  { value: "admin", label: "Администратор", description: "Товары, заявки, клиенты, контент и настройки." },
  { value: "manager", label: "Менеджер", description: "Заявки, клиенты, статусы и позиции." },
  { value: "content", label: "Контент", description: "Категории, карточки товаров, фото и описания." },
  { value: "support", label: "Поддержка", description: "Обращения клиентов и сообщения." },
];

export function SystemSettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [siteAddresses, setSiteAddresses] = useState<SiteAddress[]>([]);
  const [staffState, setStaffState] = useState<SaveState>("idle");
  const [staffError, setStaffError] = useState("");
  const [newStaff, setNewStaff] = useState<StaffFormState>({
    login: "",
    name: "",
    roles: ["manager"],
    password: "",
  });

  async function loadSiteAddresses() {
    const response = await fetch("/api/site-settings").catch(() => null);
    const payload = (await response?.json().catch(() => null)) as
      | { site?: { contacts?: { addresses?: SiteAddress[] } } }
      | null;

    setSiteAddresses((payload?.site?.contacts?.addresses ?? []).filter((address) => address.active));
  }

  function toggleRole(roles: StaffRole[], role: StaffRole): StaffRole[] {
    const nextRoles: StaffRole[] = roles.includes(role)
      ? roles.filter((item) => item !== role)
      : [...roles, role];

    return nextRoles.length ? nextRoles : ["manager"];
  }

  async function loadStaff() {
    const response = await fetch("/api/admin/staff").catch(() => null);
    const payload = (await response?.json().catch(() => null)) as { staff?: StaffMember[] } | null;

    if (payload?.staff) {
      setStaff(payload.staff);
    }
  }

  useEffect(() => {
    void loadStaff();
    void loadSiteAddresses();
  }, []);

  async function createStaff() {
    setStaffState("saving");
    setStaffError("");

    const response = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStaff),
    }).catch(() => null);

    const payload = (await response?.json().catch(() => null)) as
      | { staff?: StaffMember[]; message?: string }
      | null;

    if (!response?.ok || !payload?.staff) {
      setStaffState("error");
      setStaffError(payload?.message || "Не удалось добавить сотрудника.");
      return;
    }

    setStaff(payload.staff);
    setNewStaff({ login: "", name: "", roles: ["manager"], password: "" });
    setStaffState("saved");
    window.setTimeout(() => setStaffState("idle"), 2200);
  }

  async function updateStaffMember(id: string, patch: Partial<StaffFormState> & { isActive?: boolean }) {
    setStaffState("saving");
    setStaffError("");

    const response = await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);

    const payload = (await response?.json().catch(() => null)) as
      | { staff?: StaffMember[]; message?: string }
      | null;

    if (!response?.ok || !payload?.staff) {
      setStaffState("error");
      setStaffError(payload?.message || "Не удалось обновить сотрудника.");
      return;
    }

    setStaff(payload.staff);
    setStaffState("saved");
    window.setTimeout(() => setStaffState("idle"), 2200);
  }

  async function deleteStaffMember(id: string) {
    if (!window.confirm("Удалить профиль сотрудника? Это действие нельзя отменить.")) {
      return;
    }

    setStaffState("saving");
    setStaffError("");

    const response = await fetch(`/api/admin/staff/${id}`, {
      method: "DELETE",
    }).catch(() => null);

    const payload = (await response?.json().catch(() => null)) as
      | { staff?: StaffMember[]; message?: string }
      | null;

    if (!response?.ok || !payload?.staff) {
      setStaffState("error");
      setStaffError(payload?.message || "Не удалось удалить сотрудника.");
      return;
    }

    setStaff(payload.staff);
    setStaffState("saved");
    window.setTimeout(() => setStaffState("idle"), 2200);
  }

  function updateDelivery(index: number, key: keyof SystemSettings["deliveries"][number], value: string | boolean) {
    setSettings((current) => ({
      ...current,
      deliveries: current.deliveries.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  }

  function addDelivery() {
    setSettings((current) => ({
      ...current,
      deliveries: [
        ...current.deliveries,
        {
          key: `delivery_${current.deliveries.length + 1}`,
          title: "Новый способ получения",
          type: "courier",
          addressId: "",
          crmField: "delivery.type",
          text: "Описание способа получения для клиента.",
          active: true,
        },
      ],
    }));
  }

  function removeDelivery(index: number) {
    setSettings((current) => ({
      ...current,
      deliveries: current.deliveries.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateNotification(index: number, key: keyof SystemSettings["notifications"][number], value: string | boolean) {
    setSettings((current) => ({
      ...current,
      notifications: current.notifications.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  }

  function updateIntegration(index: number, key: keyof SystemSettings["integrations"][number], value: string) {
    setSettings((current) => ({
      ...current,
      integrations: current.integrations.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  }

  async function saveSettings() {
    setSaveState("saving");

    const response = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "system", value: settings }),
    }).catch(() => null);

    if (!response?.ok) {
      setSaveState("error");
      return;
    }

    const payload = (await response.json().catch(() => null)) as {
      system?: SystemSettings;
    } | null;

    if (payload?.system) {
      setSettings(payload.system);
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
            <span>Настройки</span>
            <span>·</span>
            <span>система и доступы</span>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
          >
            На сайт
          </Link>
        </header>

        <section className="mt-10">
          <BackLink href="/nz-console" label="В админку" variant="admin" />

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
                Системные настройки
              </div>

              <h1 className="mt-5 text-5xl font-bold tracking-[-0.055em]">
                Настройки
              </h1>

              <p className="mt-4 max-w-[820px] text-sm leading-relaxed text-white/55">
                Это уже не макет: доставка, интеграции, уведомления и базовые
                системные параметры сохраняются в PostgreSQL. Внешний вид сайта
                вынесен в “Редактор сайта”.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/nz-console/site-editor"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-7 py-4 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-500/10"
              >
                Редактор сайта
              </Link>

              <button
                type="button"
                onClick={saveSettings}
                disabled={saveState === "saving"}
                className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveState === "saving" ? "Сохраняю..." : "Сохранить настройки"}
              </button>
            </div>
          </div>

          {saveState === "saved" && (
            <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm text-green-300">
              Настройки сохранены в БД.
            </div>
          )}

          {saveState === "error" && (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
              Не удалось сохранить настройки. Проверьте авторизацию и БД.
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <MetricCard label="Способы получения" value={String(settings.deliveries.length)} />
          <MetricCard label="Уведомления" value={String(settings.notifications.length)} />
          <MetricCard label="Интеграции" value={String(settings.integrations.length)} />
          <MetricCard label="Лимит остатка" value={String(settings.lowStockLimit)} />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <details open className="group rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <summary className="mb-3 flex cursor-pointer list-none items-center justify-end gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                <span className="group-open:hidden">Развернуть</span>
                <span className="hidden group-open:inline">Свернуть</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-base transition-transform group-open:rotate-45">+</span>
              </summary>
              <SectionTitle
                label="Доставка"
                title="Способы получения и CRM-ключи"
                text="Менеджер видит понятное название, а CRM получает стабильный технический ключ."
              />

              <div className="mt-8 grid gap-4">
                {settings.deliveries.map((delivery, index) => (
                  <div key={`${delivery.key}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-bold">{delivery.title || "Способ получения"}</div>
                        <p className="mt-1 text-sm text-white/45">
                          {delivery.type === "courier" ? "Курьерская доставка с адресом клиента" : "Самовывоз / ПВЗ с привязанным адресом"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <ToggleField
                          title="Активен"
                          active={delivery.active}
                          onChange={(value) => updateDelivery(index, "active", value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeDelivery(index)}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/20"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <Field label="Название">
                        <input value={delivery.title} onChange={(event) => updateDelivery(index, "title", event.target.value)} className="admin-input" />
                      </Field>
                      <Field label="Ключ для CRM">
                        <input value={delivery.key} onChange={(event) => updateDelivery(index, "key", event.target.value)} className="admin-input" />
                      </Field>
                      <Field label="Тип получения">
                        <select
                          value={delivery.type}
                          onChange={(event) => {
                            updateDelivery(index, "type", event.target.value);
                            if (event.target.value === "courier") updateDelivery(index, "addressId", "");
                          }}
                          className="admin-input"
                        >
                          <option value="courier">Курьерская доставка</option>
                          <option value="pickup">Самовывоз / ПВЗ</option>
                        </select>
                      </Field>
                      <Field label="Адрес для самовывоза / ПВЗ">
                        <select
                          value={delivery.addressId}
                          onChange={(event) => updateDelivery(index, "addressId", event.target.value)}
                          disabled={delivery.type !== "pickup"}
                          className="admin-input disabled:opacity-45"
                        >
                          <option value="">Не выбран</option>
                          {siteAddresses.map((address) => (
                            <option key={address.id} value={address.id}>
                              {address.title} — {address.city}, {address.address}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="CRM-поле">
                        <input value={delivery.crmField} onChange={(event) => updateDelivery(index, "crmField", event.target.value)} className="admin-input" />
                      </Field>
                    </div>
                    <Field label="Описание">
                      <textarea value={delivery.text} onChange={(event) => updateDelivery(index, "text", event.target.value)} className="admin-textarea mt-2 min-h-[90px]" />
                    </Field>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addDelivery}
                  className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-5 py-4 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20"
                >
                  Добавить способ получения
                </button>
              </div>
            </details>

            <details open className="group rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <summary className="mb-3 flex cursor-pointer list-none items-center justify-end gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                <span className="group-open:hidden">Развернуть</span>
                <span className="hidden group-open:inline">Свернуть</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-base transition-transform group-open:rotate-45">+</span>
              </summary>
              <SectionTitle
                label="Интеграции"
                title="Внешние сервисы"
                text="Токены сохраняются в БД. Для production-секретов лучше использовать Railway Variables."
              />

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {settings.integrations.map((integration, index) => (
                  <div key={`${integration.key}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold">{integration.name}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-white/45">{integration.text}</p>
                      </div>
                      <input
                        value={integration.status}
                        onChange={(event) => updateIntegration(index, "status", event.target.value)}
                        className="h-9 w-32 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div className="mt-5 grid gap-3">
                      <Field label="Token / API key">
                        <input value={integration.token} onChange={(event) => updateIntegration(index, "token", event.target.value)} className="admin-input" placeholder="Можно оставить пустым" />
                      </Field>
                      <Field label="Webhook URL">
                        <input value={integration.webhookUrl} onChange={(event) => updateIntegration(index, "webhookUrl", event.target.value)} className="admin-input" placeholder="https://..." />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </details>

            <details open className="group rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <summary className="mb-3 flex cursor-pointer list-none items-center justify-end gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                <span className="group-open:hidden">Развернуть</span>
                <span className="hidden group-open:inline">Свернуть</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-base transition-transform group-open:rotate-45">+</span>
              </summary>
              <SectionTitle
                label="Уведомления"
                title="Системные события"
                text="Что отправлять менеджерам, поддержке и главному админу."
              />

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {settings.notifications.map((notification, index) => (
                  <div key={`${notification.key}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <ToggleField
                      title={notification.title}
                      active={notification.active}
                      onChange={(value) => updateNotification(index, "active", value)}
                    />
                    <p className="mt-3 text-sm leading-relaxed text-white/45">{notification.text}</p>
                    <Field label="Канал">
                      <input value={notification.channel} onChange={(event) => updateNotification(index, "channel", event.target.value)} className="admin-input mt-2" />
                    </Field>
                  </div>
                ))}
              </div>
            </details>

            <details open className="group rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <summary className="mb-3 flex cursor-pointer list-none items-center justify-end gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                <span className="group-open:hidden">Развернуть</span>
                <span className="hidden group-open:inline">Свернуть</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-base transition-transform group-open:rotate-45">+</span>
              </summary>
              <SectionTitle
                label="Сотрудники"
                title="Команда админки и роли"
                text="Один сотрудник может иметь несколько ролей. Создавать сотрудников и менять роли может только главный админ."
              />

              {staffError && (
                <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                  {staffError}
                </div>
              )}

              {staffState === "saved" && (
                <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm text-green-300">
                  Сотрудники обновлены.
                </div>
              )}

              <div className="mt-8 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Логин">
                    <input
                      value={newStaff.login}
                      onChange={(event) => setNewStaff((current) => ({ ...current, login: event.target.value }))}
                      className="admin-input"
                      placeholder="manager"
                    />
                  </Field>

                  <Field label="Имя">
                    <input
                      value={newStaff.name}
                      onChange={(event) => setNewStaff((current) => ({ ...current, name: event.target.value }))}
                      className="admin-input"
                      placeholder="Иван"
                    />
                  </Field>

                  <Field label="Роли">
                    <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                      {staffRoleOptions.map((role) => (
                        <label key={role.value} className="flex items-start gap-3 rounded-xl px-2 py-2 text-sm text-white/75 hover:bg-white/5">
                          <input
                            type="checkbox"
                            checked={newStaff.roles.includes(role.value)}
                            onChange={() => setNewStaff((current) => ({ ...current, roles: toggleRole(current.roles, role.value) }))}
                            className="mt-1"
                          />
                          <span>
                            <span className="block font-semibold text-white">{role.label}</span>
                            <span className="block text-xs leading-relaxed text-white/45">{role.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </Field>

                  <Field label="Пароль">
                    <input
                      type="password"
                      value={newStaff.password}
                      onChange={(event) => setNewStaff((current) => ({ ...current, password: event.target.value }))}
                      className="admin-input"
                      placeholder="минимум 6 символов"
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  onClick={createStaff}
                  disabled={staffState === "saving"}
                  className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Добавить сотрудника
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                {staff.map((member) => (
                  <StaffMemberEditor
                    key={member.id}
                    member={member}
                    roleOptions={staffRoleOptions}
                    onSave={(patch) => updateStaffMember(member.id, patch)}
                    onDelete={() => deleteStaffMember(member.id)}
                    toggleRole={toggleRole}
                    disabled={staffState === "saving"}
                  />
                ))}

                {!staff.length && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/50">
                    Сотрудников пока нет. Добавь первого сотрудника или выполни db:seed для главного админа.
                  </div>
                )}
              </div>
            </details>
          </div>

          <aside className="space-y-8">
            <details open className="group rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <summary className="mb-3 flex cursor-pointer list-none items-center justify-end gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                <span className="group-open:hidden">Развернуть</span>
                <span className="hidden group-open:inline">Свернуть</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-base transition-transform group-open:rotate-45">+</span>
              </summary>
              <SectionTitle
                label="Система"
                title="Общие параметры"
                text="Технические параметры, которые используются в админке."
              />

              <div className="mt-6 grid gap-5">
                <Field label="Префикс заявок">
                  <input value={settings.orderPrefix} onChange={(event) => setSettings((current) => ({ ...current, orderPrefix: event.target.value }))} className="admin-input" />
                </Field>
                <Field label="Порог низкого остатка">
                  <input
                    type="number"
                    value={settings.lowStockLimit}
                    onChange={(event) => setSettings((current) => ({ ...current, lowStockLimit: Number(event.target.value) }))}
                    className="admin-input"
                  />
                </Field>
              </div>
            </details>

            <section className="rounded-[34px] border border-blue-500/25 bg-blue-500/10 p-6 sm:p-8">
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                Итог
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Вкладку можно закрывать</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/55">
                После этого патча настройки больше не нарисованы как макет:
                они редактируются, сохраняются и поднимаются из БД.
              </p>
              <button
                type="button"
                onClick={saveSettings}
                disabled={saveState === "saving"}
                className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveState === "saving" ? "Сохраняю..." : "Сохранить настройки"}
              </button>
            </section>

            <details open className="group rounded-[34px] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <summary className="mb-3 flex cursor-pointer list-none items-center justify-end gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                <span className="group-open:hidden">Развернуть</span>
                <span className="hidden group-open:inline">Свернуть</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-base transition-transform group-open:rotate-45">+</span>
              </summary>
              <SectionTitle label="Безопасность" title="Админка" text="Доступ закрыт через admin-сессию." />
              <div className="mt-6 grid gap-3 text-sm text-white/60">
                <InfoLine label="Адрес админки" value="/nz-console" />
                <InfoLine label="Настройки" value="PostgreSQL" />
                <InfoLine label="2FA" value="позже" />
                <InfoLine label="Логи действий" value="позже" />
              </div>
            </details>
          </aside>
        </section>

        <AdminStyle />
      </div>
    </main>
  );
}

function StaffMemberEditor({
  member,
  roleOptions,
  onSave,
  onDelete,
  toggleRole,
  disabled,
}: {
  member: StaffMember;
  roleOptions: typeof staffRoleOptions;
  onSave: (patch: Partial<StaffFormState> & { isActive?: boolean }) => void;
  onDelete: () => void;
  toggleRole: (roles: StaffRole[], role: StaffRole) => StaffRole[];
  disabled: boolean;
}) {
  const [draft, setDraft] = useState({
    login: member.login,
    name: member.name,
    roles: member.roles ?? [member.role],
    password: "",
    isActive: member.isActive,
  });

  useEffect(() => {
    setDraft({
      login: member.login,
      name: member.name,
      roles: member.roles ?? [member.role],
      password: "",
      isActive: member.isActive,
    });
  }, [member]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.5fr_150px] lg:items-start">
        <Field label="Логин">
          <input
            value={draft.login}
            onChange={(event) =>
              setDraft((current) => ({ ...current, login: event.target.value }))
            }
            className="admin-input"
          />
        </Field>

        <Field label="Имя сотрудника">
          <input
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
            className="admin-input"
          />
        </Field>

        <Field label="Роли">
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
            {roleOptions.map((role) => (
              <label
                key={role.value}
                className="flex items-start gap-3 rounded-xl px-2 py-2 text-sm text-white/75 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={draft.roles.includes(role.value)}
                  onChange={() =>
                    setDraft((current) => ({
                      ...current,
                      roles: toggleRole(current.roles, role.value),
                    }))
                  }
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-white">{role.label}</span>
                  <span className="block text-xs leading-relaxed text-white/45">
                    {role.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Field>

        <button
          type="button"
          onClick={() =>
            setDraft((current) => ({ ...current, isActive: !current.isActive }))
          }
          className={`h-[52px] rounded-xl border px-4 text-sm font-semibold transition-colors ${
            draft.isActive
              ? "border-green-500/30 bg-green-500/10 text-green-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {draft.isActive ? "Активен" : "Отключён"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px_auto] lg:items-end">
        <p className="text-sm leading-relaxed text-white/45">
          Изменения применяются только после нажатия «Сохранить».
        </p>

        <Field label="Новый пароль">
          <input
            type="password"
            value={draft.password}
            onChange={(event) =>
              setDraft((current) => ({ ...current, password: event.target.value }))
            }
            placeholder="оставьте пустым, если не менять"
            className="admin-input"
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onSave({
                login: draft.login,
                name: draft.name,
                roles: draft.roles,
                password: draft.password || undefined,
                isActive: draft.isActive,
              });
              setDraft((current) => ({ ...current, password: "" }));
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Сохранить
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={onDelete}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            Удалить профиль
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="text-sm text-white/45">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}

function SectionTitle({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div>
      <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">{label}</div>
      <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">{title}</h2>
      <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-white/50">{text}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-white/70">{label}</div>
      {children}
    </label>
  );
}

function ToggleField({ title, active, onChange }: { title: string; active: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!active)} className="flex w-full items-center justify-between gap-4 text-left">
      <span className="font-semibold">{title}</span>
      <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 ${active ? "bg-blue-600" : "bg-white/10"}`}>
        <span className={`h-5 w-5 rounded-full bg-white transition-transform ${active ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-white/45">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function AdminStyle() {
  return (
    <style>{`
      .admin-input {
        height: 52px;
        width: 100%;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(0,0,0,0.2);
        padding: 0 18px;
        color: white;
        outline: none;
        font-size: 14px;
      }

      .admin-input::placeholder {
        color: rgba(255,255,255,0.35);
      }

      .admin-input:focus {
        border-color: rgba(59,130,246,0.55);
      }

      .admin-textarea {
        width: 100%;
        resize: vertical;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(0,0,0,0.2);
        padding: 18px;
        color: white;
        outline: none;
        font-size: 14px;
        line-height: 1.6;
      }

      .admin-textarea::placeholder {
        color: rgba(255,255,255,0.35);
      }

      .admin-textarea:focus {
        border-color: rgba(59,130,246,0.55);
      }
    `}</style>
  );
}
