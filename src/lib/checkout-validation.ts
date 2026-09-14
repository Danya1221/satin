import { normalizeRuPhone, validateCourierAddress } from "@/lib/contact-validation";

type Contacts = { name: string; phone: string };
type Delivery = { method: "courier" | "pickup" | null; address: string; savedAddress: string; city: string; deliveryKey: string };
export type CheckoutIssue = { section: string; message: string };

export function getContactValidationError(customer: Contacts) {
  if (!customer.name.trim()) return "Укажите имя.";
  if (!normalizeRuPhone(customer.phone)) return "Укажите корректный телефон РФ.";
  return "";
}

export function getDeliveryValidationError(delivery: Delivery) {
  if (delivery.method === "pickup") return delivery.address.trim() ? "" : "Выберите пункт выдачи.";
  if (delivery.method === "courier") {
    const address = delivery.savedAddress.trim() || delivery.address.trim();
    if (delivery.deliveryKey === "cdek") return delivery.city.trim() || address ? "" : "Укажите город для доставки СДЭК.";
    const validation = validateCourierAddress(delivery.city, address);
    return validation.ok ? "" : validation.message;
  }
  return "Выберите способ получения.";
}

export function getCheckoutIssues(input: {
  customer: Contacts;
  delivery: Delivery;
  consent: { accepted: boolean; offerAccepted?: boolean; version: string };
  hasItems: boolean;
  quoteLoading: boolean;
  promoError?: string;
}): CheckoutIssue[] {
  const issues: CheckoutIssue[] = [];
  const contacts = [!input.customer.name.trim() && "имя", !normalizeRuPhone(input.customer.phone) && "корректный телефон РФ"].filter(Boolean);
  if (contacts.length) issues.push({ section: "Контактные данные", message: `Укажите ${contacts.join(" и ")}.` });
  const delivery = getDeliveryValidationError(input.delivery);
  if (delivery) issues.push({ section: "Доставка", message: delivery });
  if (!input.consent.accepted) issues.push({ section: "Согласие на обработку данных", message: "Отметьте согласие под итоговой суммой заказа." });
  if (!input.consent.offerAccepted) issues.push({ section: "Условия продажи", message: "Подтвердите ознакомление с условиями продажи под итоговой суммой." });
  if (input.consent.accepted && input.consent.offerAccepted && !input.consent.version) issues.push({ section: "Условия заказа", message: "Условия ещё загружаются. Повторите оформление через несколько секунд." });
  if (!input.hasItems) issues.push({ section: "Корзина", message: "Добавьте товар в корзину." });
  if (input.quoteLoading) issues.push({ section: "Стоимость заказа", message: "Дождитесь пересчёта стоимости и повторите оформление." });
  if (input.promoError) issues.push({ section: "Промокод", message: input.promoError });
  return issues;
}
