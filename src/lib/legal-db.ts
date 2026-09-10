import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { LEGAL_REVISION, normalizeLegalSettings, type LegalSettings } from "@/lib/legal-settings";
export async function getLegalSettings() {
  const row = await prisma.siteSetting.findUnique({ where: { key: "legal" } });
  return normalizeLegalSettings(row?.value);
}
export function legalVersion(legal: LegalSettings) {
  return `${LEGAL_REVISION}-${createHash("sha256").update(JSON.stringify(legal)).digest("hex").slice(0, 12)}`;
}
export function consentText(legal: LegalSettings, purpose: "order" | "account" | "support") {
  const purposes = { order: "оформление и исполнение моего заказа, связь по вопросам покупки и доставки", account: "создание и ведение моего личного кабинета", support: "рассмотрение моего обращения и предоставление ответа" };
  return `Я даю ${legal.sellerName || "продавцу, указанному в разделе «Контакты и реквизиты»"}${legal.inn ? ` (ИНН ${legal.inn})` : ""}${legal.legalAddress ? `, адрес: ${legal.legalAddress}` : ""} согласие на обработку предоставленных мной имени, фамилии, телефона, электронной почты${purpose === "order" ? ", адреса доставки, состава заказа" : purpose === "support" ? ", текста обращения и приложенных материалов" : ""}. Цель: ${purposes[purpose]}. Допускаются сбор, запись, систематизация, накопление, хранение, уточнение, извлечение, использование, предоставление привлечённым обработчикам для этой цели, блокирование, удаление и уничтожение данных с использованием средств автоматизации и без них. Получатели данных и сроки хранения приведены в политике обработки персональных данных. Согласие действует до достижения указанной цели либо до его отзыва. Отозвать согласие можно по адресу ${legal.privacyEmail || legal.email || "через форму поддержки"}. После отзыва обработка может продолжаться при наличии другого законного основания. Это согласие не включает рекламу и распространение моих данных неопределённому кругу лиц.`;
}
export async function validateConsent(value: unknown, purpose: "order" | "account" | "support") {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  if (input.accepted !== true) throw new Error("Подтвердите отдельное согласие на обработку персональных данных.");
  const legal = await getLegalSettings();
  const version = legalVersion(legal);
  if (input.version !== version) throw new Error("Документы обновились. Обновите страницу, прочитайте их и подтвердите согласие ещё раз.");
  const documentText = consentText(legal, purpose);
  return { purpose, documentVersion: version, documentText, documentHash: createHash("sha256").update(documentText).digest("hex") };
}
