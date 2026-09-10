export const LEGAL_REVISION = "2026-09-09.1";
export type LegalSettings = {
  sellerName: string; entityType: "company" | "entrepreneur"; inn: string; ogrn: string;
  legalAddress: string; returnAddress: string; registrationAuthority: string;
  email: string; phone: string; workingHours: string; privacyEmail: string;
  deliveryTerms: string; paymentTerms: string; warrantyTerms: string;
  dataProcessors: string; retentionTerms: string; dataLocation: string;
};
export const defaultLegalSettings: LegalSettings = {
  sellerName: "", entityType: "company", inn: "", ogrn: "", legalAddress: "", returnAddress: "", registrationAuthority: "",
  email: "", phone: "", workingHours: "", privacyEmail: "", deliveryTerms: "", paymentTerms: "", warrantyTerms: "", dataProcessors: "", retentionTerms: "", dataLocation: "",
};
export function normalizeLegalSettings(value: unknown): LegalSettings {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const result = { ...defaultLegalSettings };
  for (const key of Object.keys(result) as (keyof LegalSettings)[]) {
    if (key === "entityType") { result.entityType = raw.entityType === "entrepreneur" ? "entrepreneur" : "company"; continue; }
    if (typeof raw[key] === "string") result[key] = raw[key].trim().slice(0, 6000);
  }
  return result;
}
export function legalMissingFields(legal: LegalSettings) {
  const required: [keyof LegalSettings, string][] = [["sellerName", "Наименование продавца"], ["inn", "ИНН"], ["ogrn", "ОГРН / ОГРНИП"], ["legalAddress", "Юридический адрес"], ["returnAddress", "Адрес возврата"], ["email", "Почта для обращений"], ["phone", "Телефон"], ["workingHours", "Режим работы"], ["deliveryTerms", "Сроки и стоимость доставки"], ["paymentTerms", "Условия оплаты и выдачи чека"], ["privacyEmail", "Почта по вопросам персональных данных"], ["dataLocation", "Место хранения персональных данных"], ["dataProcessors", "Обработчики персональных данных"], ["retentionTerms", "Сроки хранения данных"]];
  if (legal.entityType === "entrepreneur") required.push(["registrationAuthority", "Орган регистрации ИП"]);
  return required.filter(([key]) => !legal[key]).map(([, label]) => label);
}
export const informationPages = [
  { slug: "contacts", title: "Контакты и реквизиты" }, { slug: "delivery", title: "Доставка" },
  { slug: "payment", title: "Оплата" }, { slug: "returns", title: "Возврат и гарантия" },
  { slug: "offer", title: "Условия продажи" }, { slug: "privacy", title: "Персональные данные" },
  { slug: "consent", title: "Согласие на обработку данных" }, { slug: "cookies", title: "Файлы cookie" },
] as const;
export type InformationPage = typeof informationPages[number]["slug"];
