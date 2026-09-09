import Link from "next/link";
import StoreImage from "@/components/store-image";
import { StoreIcon } from "@/components/store-icon";

export type StoreProduct = { slug: string; name: string; price: string; colors?: string[]; brand?: string; image?: string; images?: string[]; isNew?: boolean; isPopular?: boolean };
export function productImage(product: StoreProduct) { return [product.image, ...(product.images ?? [])].find(value => typeof value === "string" && value.trim())?.trim() || ""; }

export function StoreProductCard({ product }: { product: StoreProduct }) {
  const image = productImage(product);
  return <Link href={`/product/${product.slug}`} className="store-product-card" draggable={false} data-soft-nav="true">
    <div className="store-product-photo">
      {product.isNew && <span className="store-product-badge">Новинка</span>}
      {image ? <StoreImage src={image} alt={product.name} width={480} height={480} sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 300px" draggable={false} /> : <StoreIcon name="grid" style={{ width: 44, height: 44, color: "#8b8d95" }} />}
    </div>
    <div className="store-product-info">
      {product.brand && <p className="store-product-brand">{product.brand}</p>}
      <h3>{product.name}</h3>
      <div className="store-product-colors" aria-label="Доступные цвета">{Array.from(new Set(product.colors ?? [])).slice(0, 7).map(color => <span key={color} style={{ backgroundColor: color }} />)}</div>
      <div className="store-product-price-row"><span className="store-product-price">{product.price || "Уточнить цену"}</span><span className="store-product-open" aria-hidden="true"><StoreIcon name="arrow" /></span></div>
    </div>
  </Link>;
}
