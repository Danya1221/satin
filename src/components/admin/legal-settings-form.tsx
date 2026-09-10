"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { informationPages, legalMissingFields, type LegalSettings } from "@/lib/legal-settings";
type Field = { key: keyof LegalSettings; label: string; hint?: string; multiline?: boolean };
const fields: Record<string, Field[]> = {
  seller: [
    { key: "sellerName", label: "Полное наименование ООО или ФИО ИП" }, { key: "inn", label: "ИНН" }, { key: "ogrn", label: "ОГРН / ОГРНИП" }, { key: "registrationAuthority", label: "Орган регистрации ИП" },
    { key: "legalAddress", label: "Юридический адрес", multiline: true }, { key: "returnAddress", label: "Адрес приёма возвратов", multiline: true }, { key: "email", label: "Почта для обращений и претензий" }, { key: "phone", label: "Телефон магазина" }, { key: "workingHours", label: "Режим работы и часовой пояс" },
  ],
  terms: [
    { key: "deliveryTerms", label: "Доставка: территория, сроки, стоимость", multiline: true, hint: "Укажите реальные способы получения, тарифы, срок передачи и порядок согласования доставки." },
    { key: "paymentTerms", label: "Оплата и кассовый чек", multiline: true, hint: "Текущая корзина принимает заказ с оплатой наличными при получении. Укажите фактический порядок расчёта и выдачи чека; текст не подключает эквайринг." },
    { key: "warrantyTerms", label: "Дополнительные гарантийные условия", multiline: true, hint: "Не ограничивайте права покупателя. Срок гарантии каждой модели укажите также в её карточке." },
  ],
  data: [
    { key: "privacyEmail", label: "Почта для запросов о персональных данных" },
    { key: "dataLocation", label: "Место размещения базы данных", multiline: true, hint: "Проверьте фактическое размещение. Первичная обработка данных граждан РФ требует базы в РФ; одного текста на сайте недостаточно." },
    { key: "dataProcessors", label: "Кому поручена обработка данных", multiline: true, hint: "Укажите реальные организации, цели и состав передаваемых данных: хостинг, доставка, касса и другие используемые сервисы." },
    { key: "retentionTerms", label: "Сроки хранения по целям обработки", multiline: true, hint: "Отдельно для аккаунта, заказов и бухгалтерских документов, переписки, технических записей. Определите порядок удаления." },
  ],
};
export function LegalSettingsForm({ initial }: { initial: LegalSettings }) {
  const [legal, setLegal] = useState(initial);
  const [tab, setTab] = useState("seller");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [receipts, setReceipts] = useState<{ id: string; purpose: string; documentVersion: string; documentText: string; acceptedAt: string; subjectId: string }[]>([]);
  const missing = legalMissingFields(legal);
  useEffect(() => {
    if (tab !== "journal") return;
    fetch("/api/admin/legal", { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error(); const data = await r.json(); setReceipts(data.receipts); }).catch(() => { setError(true); setMessage("Не удалось загрузить журнал согласий."); });
  }, [tab]);
  useEffect(() => { if (JSON.stringify(legal) === saved) return; const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [legal, saved]);
  async function save() {
    setSaving(true); setMessage(""); setError(false);
    try { const response = await fetch("/api/admin/legal", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(legal) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setLegal(data.legal); setSaved(JSON.stringify(data.legal)); setMessage("Сохранено. Документы на сайте обновлены."); } catch (e) { setError(true); setMessage(e instanceof Error ? e.message : "Не удалось сохранить."); } finally { setSaving(false); }
  }
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">Управление</p><h1>Документы и реквизиты</h1><p>Единые сведения для страниц магазина, согласий и условий покупки.</p></div><button className="admin-primary-button" onClick={save} disabled={saving}>{saving ? "Сохраняем…" : "Сохранить"}</button></div>
    {missing.length > 0 && <div className="admin-alert"><strong>Ещё нужно заполнить: {missing.length}</strong><p>{missing.join(" · ")}</p></div>}
    {message && <div className={`admin-alert ${error ? "admin-alert-error" : ""}`} role={error ? "alert" : "status"}>{message}</div>}
    <nav role="tablist" aria-label="Документы" className="admin-editor-tabs">{[["seller", "Продавец"], ["terms", "Условия покупки"], ["data", "Персональные данные"], ["journal", "Журнал согласий"]].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{label}</button>)}</nav>
    <section className="admin-panel">{tab === "journal" ? <><h2>Последние 50 согласий</h2><p className="admin-muted mt-3">Фиксируются дата, цель, версия и точный текст подтверждённого документа. Записи появляются после успешной отправки формы.</p>{receipts.length ? receipts.map(item => <details className="mt-4 border-b pb-4" key={item.id}><summary className="cursor-pointer">{new Date(item.acceptedAt).toLocaleString("ru-RU")} · {{ order: "Заказ", account: "Регистрация", support: "Обращение" }[item.purpose] || item.purpose}</summary><p className="mt-3 admin-muted">Версия {item.documentVersion} · {item.subjectId}</p><p className="mt-3">{item.documentText}</p></details>) : <p className="admin-empty">Пока нет записей.</p>}</> : <fieldset disabled={saving} className="admin-editor-workspace admin-legal-grid">{tab === "seller" && <label className="admin-field">Тип продавца<select value={legal.entityType} onChange={e => setLegal({ ...legal, entityType: e.target.value as LegalSettings["entityType"] })}><option value="company">Юридическое лицо</option><option value="entrepreneur">Индивидуальный предприниматель</option></select></label>}{fields[tab].map(field => <label key={field.key} className={`admin-field ${field.multiline ? "admin-field-wide" : ""}`}>{field.label}{field.multiline ? <textarea rows={4} value={legal[field.key]} onChange={e => setLegal({ ...legal, [field.key]: e.target.value })} /> : <input value={legal[field.key]} onChange={e => setLegal({ ...legal, [field.key]: e.target.value })} />}{field.hint && <small>{field.hint}</small>}</label>)}</fieldset>}</section>
    <section className="admin-panel mt-6"><h2>Страницы для покупателей</h2><div className="flex flex-wrap gap-4 mt-5">{informationPages.map(page => <Link className="admin-secondary-button" target="_blank" key={page.slug} href={`/${page.slug}`}>{page.title} ↗</Link>)}</div></section>
  </>;
}
