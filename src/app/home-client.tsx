"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StoreIcon, type StoreIconName } from "@/components/store-icon";
import { ProductCarousel } from "@/components/product-carousel";
import { productImage } from "@/components/store-product-card";
import StoreImage from "@/components/store-image";
import { categoryPath, safeStoreHref } from "@/lib/route-paths";
import { useTheme } from "@/components/theme-provider";

type HomeCategory = {
 id: string;
 slug: string;
 name: string;
 description: string;
 href: string;
 image?: string;
};

type HomeProduct = {
 slug: string;
 name: string;
 brand?: string;
 category?: string;
 categoryName?: string;
 price: string;
 priceMax?: string;
 shortDescription?: string;
 image?: string;
 promoImage?: string;
 images?: string[];
 colors: string[];
 isNew?: boolean;
 isPopular?: boolean;
};

type HomePageBlock = {
 id: string;
 pageKey: string;
 type: string;
 title: string;
 description: string;
 enabled: boolean;
 sortOrder: number;
 settings?: Record<string, string | number | boolean | null>;
};

type HomeBanner = {
 id: string;
 adminTitle: string;
 label: string;
 title: string;
 subtitle: string;
 description: string;
 buttonText: string;
 buttonHref: string;
 secondaryButtonText?: string;
 secondaryButtonHref?: string;
 imageLight: string;
 imageDark: string;
 imageMobile: string;
 placement: string;
 tone: string;
 layout: string;
 titleSize?: string;
 textSize?: string;
 enabled: boolean;
 sortOrder: number;
};

type HomeBenefit = {
 id: string;
 title: string;
 description: string;
 icon: string;
 image: string;
 href: string;
 enabled: boolean;
 sortOrder: number;
};

type HomeBlockSetting = {
 id: string;
 enabled: boolean;
 order: number;
};

type PublicSiteSettings = {
 branding?: {
 storeName?: string;
 logoLight?: string;
 logoDark?: string;
 };
 contacts?: {
 phone?: string;
 phoneText?: string;
 email?: string;
 emailText?: string;
 telegram?: string;
 telegramText?: string;
 };
 homeBlocks?: HomeBlockSetting[];
};

export type HomePayload = {
 categories?: HomeCategory[];
 products?: HomeProduct[];
 popularProducts?: HomeProduct[];
 newArrivals?: HomeProduct[];
 pageBlocks?: HomePageBlock[];
 siteSettings?: PublicSiteSettings;
 banners?: HomeBanner[];
 benefits?: HomeBenefit[];
};

const defaultBlocks: HomePageBlock[] = [
  { id: "hero", pageKey: "home", type: "hero", title: "Главная", description: "", enabled: true, sortOrder: 10 },
  { id: "benefits", pageKey: "home", type: "benefits", title: "Преимущества", description: "", enabled: true, sortOrder: 20 },
  { id: "categories", pageKey: "home", type: "category-grid", title: "Категории", description: "", enabled: true, sortOrder: 30 },
  { id: "popular-products", pageKey: "home", type: "popular-products", title: "Популярное", description: "", enabled: true, sortOrder: 40 },
  { id: "new-arrivals", pageKey: "home", type: "new-arrivals", title: "Новинки", description: "", enabled: true, sortOrder: 50 },
  { id: "support", pageKey: "home", type: "support", title: "Помощь", description: "", enabled: true, sortOrder: 60 },
];

type BlockSettings = NonNullable<HomePageBlock["settings"]>;
function text(settings: BlockSettings, key: string, fallback = "") { const value = settings[key]; return typeof value === "string" && value.trim() ? value : fallback; }
function limit(settings: BlockSettings, fallback: number) { const number = Number(settings.limit ?? fallback); return Number.isFinite(number) ? Math.max(0, Math.min(48, number)) : fallback; }

export default function Home({ initialData = {} }: { initialData?: HomePayload }) {
  const [data, setData] = useState(initialData);
  const hasInitialData = Boolean(initialData.products?.length || initialData.categories?.length || initialData.banners?.length);
  useEffect(() => {
    if (hasInitialData) return;
    const controller = new AbortController();
    fetch("/api/home", { cache: "no-store", signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then(payload => { if (payload) setData(payload); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [hasInitialData]);
  const blocks = (data.pageBlocks ?? defaultBlocks)
    .filter(block => block.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
  return <main className="storefront min-h-screen"><div className="storefront-shell">
    <SiteHeader />
    {blocks.map(block => <HomeModule key={block.id} block={block} data={data} />)}
    <SiteFooter initialSettings={data.siteSettings} />
  </div></main>;
}

export function HomeModule({ block, data }: { block: HomePageBlock; data: HomePayload }) {
  const settings = block.settings ?? {};
  const type = block.type || block.id;
  const all = (data.products ?? []).filter(product => product.slug !== "catalog");
  const popular = (data.popularProducts ?? all.filter(product => product.isPopular)).filter(product => product.slug !== "catalog");
  const arrivals = (data.newArrivals ?? all.filter(product => product.isNew)).filter(product => product.slug !== "catalog");
  const banners = (data.banners ?? []).filter(banner => banner.enabled);
  if (type === "hero") return <Hero banners={banners.filter(banner => !banner.placement || banner.placement === "home" || banner.placement === "hero")} settings={settings} />;
  if (type === "benefits") return <section className="store-section" data-benefit-style={text(settings, "style", "cards")}>{text(settings, "title") && <SectionHead title={text(settings, "title")} subtitle={text(settings, "subtitle")} />}<Benefits benefits={(data.benefits ?? []).filter(benefit => benefit.enabled).slice(0, limit(settings, 4))} /></section>;
  if (type === "categories" || type === "category-grid") {
    const categories = (data.categories ?? []).slice(0, limit(settings, 12));
    if (!categories.length) return null;
    return <section className="store-section"><SectionHead eyebrow="Найдётся для каждого" title={text(settings, "title", "Что вам по душе?")} subtitle={text(settings, "subtitle")} action={settings.showButton !== false ? { text: text(settings, "buttonText", "Весь каталог"), href: text(settings, "buttonHref", "/catalog") } : undefined} />
      <div className="store-categories">{categories.map(category => <Link key={category.id} className="store-category" href={categoryPath(category.slug || category.id)}><div className="store-category-image">{category.image ? <StoreImage src={category.image} alt="" width={200} height={180} sizes="(max-width: 639px) 28vw, 180px" /> : <StoreIcon name="grid" />}</div><strong>{category.name}</strong></Link>)}</div>
    </section>;
  }
  if (type === "popular-products" || type === "product-carousel") {
    const filter = text(settings, "filter", "all");
    const source = type === "popular-products" || filter === "popular" ? popular : filter === "new" ? arrivals : all;
    return <ProductCarousel title={text(settings, "title", type === "popular-products" ? "В центре внимания" : "Из нашего каталога")} subtitle={text(settings, "subtitle")} products={source.slice(0, limit(settings, 12))} actionLabel={settings.showButton === false ? "" : text(settings, "buttonText", "Смотреть все")} actionHref={text(settings, "buttonHref", type === "popular-products" ? "/catalog?popular=1" : "/catalog")} />;
  }
  if (type === "new-arrivals") {
    if (!arrivals.length) return null;
    return <section className="store-section"><SectionHead eyebrow="Новое и интересное" title={text(settings, "title", "Знакомьтесь. Ваши новые любимые.")} subtitle={text(settings, "subtitle")} action={settings.showButton === false ? undefined : { text: text(settings, "buttonText", "Все новинки"), href: text(settings, "buttonHref", "/new") }} />
      <div className="store-new-grid">{arrivals.slice(0, limit(settings, 3)).map(product => <Link className="store-new-card" href={`/product/${product.slug}`} key={product.slug}>
        <div className="store-new-media">{product.promoImage || productImage(product) ? <StoreImage src={product.promoImage || productImage(product)} alt={product.name} width={600} height={450} sizes="(max-width: 639px) 78vw, 33vw" /> : <StoreIcon name="sparkles" />}</div>
        <div className="store-new-content"><span className="store-eyebrow">{product.brand || product.categoryName || "Новое в каталоге"}</span><h3>{product.name}</h3>{product.shortDescription && <p>{product.shortDescription}</p>}<span className="store-text-link">{product.price || "Подробнее"}<StoreIcon name="arrow" /></span></div>
      </Link>)}</div>
    </section>;
  }
  if (type === "support") return <Support settings={settings} />;
  if (type === "promo-banner") {
    const banner = text(settings, "bannerId") ? banners.find(item => item.id === settings.bannerId) : undefined;
    if (banner) return <div className="store-section"><Hero banners={[banner]} secondary /></div>;
    return <EditorialBlock settings={settings} />;
  }
  if (type === "text-image") return <EditorialBlock settings={settings} />;
  return null;
}

function SectionHead({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: { text: string; href: string } }) {
  return <div className="store-section-head"><div>{eyebrow && <span className="store-eyebrow">{eyebrow}</span>}<h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <Link href={safeStoreHref(action.href)} className="store-text-link">{action.text.replace(/\s*[→➜➡]+\s*$/, "")}<StoreIcon name="arrow" /></Link>}</div>;
}

function Hero({ banners, secondary = false, settings = {} }: { banners: HomeBanner[]; secondary?: boolean; settings?: BlockSettings }) {
  const { dark } = useTheme();
  const [active, setActive] = useState(0);
  const touchX = useRef<number | null>(null);
  const slides = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);
  const banner = slides[Math.min(active, Math.max(0, slides.length - 1))];
  const image = banner ? (dark ? banner.imageDark || banner.imageLight : banner.imageLight || banner.imageDark) || banner.imageMobile || "/images/technology-hero.webp" : "/images/technology-hero.webp";
  const title = text(settings, "title", banner?.title || banner?.adminTitle);
  const Heading = secondary ? "h2" : "h1";
  function next(direction: number) { if (slides.length > 1) setActive(current => (current + direction + slides.length) % slides.length); }
  return <section className="store-hero" data-editorial={image === "/images/technology-hero.webp"} data-layout={banner?.layout || "image-bg"} data-title-size={banner?.titleSize} data-text-size={banner?.textSize} aria-roledescription={slides.length > 1 ? "карусель" : undefined} aria-label={title || "Техника для вашего ритма жизни"} onTouchStart={event => { touchX.current = event.touches[0].clientX; }} onTouchEnd={event => { if (touchX.current !== null && Math.abs(touchX.current - event.changedTouches[0].clientX) > 65) next(touchX.current > event.changedTouches[0].clientX ? 1 : -1); touchX.current = null; }}>
    <picture className="store-hero-media">{banner?.imageMobile && <source media="(max-width: 639px)" srcSet={banner.imageMobile} />}<img src={image} alt="" width={1536} height={1024} fetchPriority={secondary ? "auto" : "high"} loading={secondary ? "lazy" : "eager"} decoding="async" /></picture>
    <div className="store-hero-content"><span className="store-eyebrow">{banner?.label || "Технологии. С характером."}</span>
      <Heading>{title || <>Ближе к тому,<em>что нравится.</em></>}</Heading>
      <p className="store-hero-description">{text(settings, "subtitle", banner?.subtitle || banner?.description || "Для больших планов, любимой музыки и всего, что делает ваш день особенным.")}</p>
      <div className="store-hero-actions">{settings.showButton !== false && <Link href={safeStoreHref(text(settings, "buttonHref", banner?.buttonHref || "/catalog"))} className="store-button">{text(settings, "buttonText", banner?.buttonText || "Выбрать своё")}<StoreIcon name="arrow" /></Link>}{banner?.secondaryButtonText ? <Link href={safeStoreHref(banner.secondaryButtonHref, "/help")} className="store-text-link">{banner.secondaryButtonText}</Link> : !banner && <Link href="/new" className="store-text-link">Смотреть новинки</Link>}</div>
    </div>
    <div className="store-hero-bottom"><span>{banner ? banner.label || "Избранное из нашего каталога" : "Ваш ритм. Ваш выбор."}</span>{slides.length > 1 && <div className="store-hero-pagination" aria-label="Выбор баннера"><button type="button" onClick={() => next(-1)} aria-label="Предыдущий баннер" className="store-hero-prev"><StoreIcon name="back" /></button>{slides.map((slide, index) => <button key={slide.id} type="button" aria-current={index === Math.min(active, slides.length - 1)} aria-label={`Баннер ${index + 1}: ${slide.title || slide.adminTitle}`} onClick={() => setActive(index)} />)}<button type="button" onClick={() => next(1)} aria-label="Следующий баннер" className="store-hero-next"><StoreIcon name="arrow" /></button></div>}</div>
  </section>;
}

function Benefits({ benefits }: { benefits: HomeBenefit[] }) {
  if (!benefits.length) return null;
  const icons: StoreIconName[] = ["check", "bag", "help", "sparkles"];
  return <div className="store-benefits" aria-label="Преимущества магазина">{benefits.map((benefit, index) => {
    const content = <>{benefit.image ? <img src={benefit.image} alt="" width={28} height={28} loading="lazy" /> : <StoreIcon name={icons[index % icons.length]} />}<div><h3>{benefit.title}</h3>{benefit.description && <p>{benefit.description}</p>}</div></>;
    return benefit.href ? <Link className="store-benefit" key={benefit.id} href={safeStoreHref(benefit.href)}>{content}</Link> : <div className="store-benefit" key={benefit.id}>{content}</div>;
  })}</div>;
}

function EditorialBlock({ settings }: { settings: BlockSettings }) {
  const { dark } = useTheme();
  const title = text(settings, "title");
  const description = text(settings, "text", text(settings, "description", text(settings, "subtitle")));
  const image = text(settings, dark ? "imageDark" : "imageLight", text(settings, "image"));
  if (!title && !description && !image) return null;
  return <section className="store-section store-editor-block" data-side={text(settings, "imageSide", "right")} data-tone={text(settings, "tone")} data-layout={text(settings, "layout", "split")} style={{ minHeight: Math.max(0, Math.min(700, Number(settings.height) || 0)) }}><div>{text(settings, "eyebrow") && <span className="store-eyebrow">{text(settings, "eyebrow", text(settings, "label"))}</span>}{title && <h2>{title}</h2>}{description && <p>{description}</p>}{text(settings, "buttonText") && <Link className="store-button" href={safeStoreHref(text(settings, "buttonHref", "/catalog"))}>{text(settings, "buttonText")}<StoreIcon name="arrow" /></Link>}</div>{image && <StoreImage src={image} alt={text(settings, "imageAlt", title)} width={700} height={500} style={{ objectFit: text(settings, "imageFit") === "cover" ? "cover" : "contain" }} />}</section>;
}

function Support({ settings }: { settings: BlockSettings }) {
  return <section className="store-support"><div><span className="store-eyebrow">Выбирайте спокойно</span><h2>{text(settings, "title", "Хорошая техника. Человеческая поддержка.")}</h2><p>{text(settings, "subtitle", "Поможем разобраться в моделях, выбрать конфигурацию и ответим на вопросы о заказе.")}</p></div><div className="store-support-options"><Link href="/help" className="store-support-option"><StoreIcon name="help" /><div><strong>Давайте подберём вместе</strong><span>Напишите, что для вас важно</span></div><StoreIcon name="arrow" /></Link><Link href="/faq" className="store-support-option"><StoreIcon name="bag" /><div><strong>Всё о покупке</strong><span>Ответы на частые вопросы</span></div><StoreIcon name="arrow" /></Link></div></section>;
}
