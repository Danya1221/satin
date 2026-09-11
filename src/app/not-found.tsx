import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ErrorReport } from "@/components/error-report";
export default function NotFound() { return <main className="storefront storefront-page"><div className="storefront-shell"><SiteHeader/><ErrorReport missing/><SiteFooter/></div></main>; }
