"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { StoreIcon } from "@/components/store-icon";
import { useStoreSettings, storeContact, type PublicStoreSettings } from "@/components/store-settings";

export function SiteFooter({ initialSettings }: { initialSettings?: PublicStoreSettings | null }) {
  const site = useStoreSettings(initialSettings);
  const { dark, toggleTheme } = useTheme();
  const name = site?.branding?.storeName?.trim() || "Магазин техники";
  const phone = storeContact(site?.contacts?.phone);
  const email = storeContact(site?.contacts?.email);
  const telegram = storeContact(site?.contacts?.telegram);
  const telegramHref = /^https?:\/\//i.test(telegram) ? telegram : `https://t.me/${telegram.replace(/^@/, "")}`;
  return <footer className="store-footer">
    <div className="store-footer-main">
      <div className="store-footer-intro"><Link href="/" className="store-brand"><span className="store-brand-mark" aria-hidden="true" /><span className="store-brand-word">{name}</span></Link><p>Техника, с которой каждый день становится интереснее.</p><Link href="/catalog" className="store-text-link">Найти свою <StoreIcon name="arrow" /></Link></div>
      <nav className="store-footer-column" aria-label="Покупки"><h2>Магазин</h2><Link href="/catalog">Каталог</Link><Link href="/new">Новинки</Link><Link href="/favorites">Избранное</Link><Link href="/cart">Корзина</Link><Link href="/profile">Личный кабинет</Link></nav>
      <nav className="store-footer-column" aria-label="Информация покупателям"><h2>Покупателям</h2><Link href="/delivery">Доставка</Link><Link href="/payment">Оплата</Link><Link href="/returns">Возврат и гарантия</Link><Link href="/faq">Вопросы и ответы</Link><Link href="/contacts">Контакты и реквизиты</Link></nav>
      <div className="store-footer-column"><h2>Всегда на связи</h2>{phone && <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>}{telegram && <a href={telegramHref} target="_blank" rel="noopener noreferrer">Telegram</a>}{email && <a href={`mailto:${email}`}>{email}</a>}<Link href="/help">Написать в поддержку</Link><Link href="/contacts">О магазине</Link></div>
    </div>
    <nav className="store-footer-legal" aria-label="Документы магазина"><Link href="/offer">Условия продажи</Link><Link href="/privacy">Политика обработки данных</Link><Link href="/consent">Согласие на обработку данных</Link><Link href="/cookies">Файлы cookie</Link></nav>
    <div className="store-footer-bottom"><span>© {new Date().getFullYear()} {name}</span><span>Выбирайте то, что нравится вам.</span><button type="button" onClick={toggleTheme} className="store-footer-mode"><StoreIcon name={dark ? "sun" : "moon"} />{dark ? "Светлая тема" : "Тёмная тема"}</button></div>
  </footer>;
}
