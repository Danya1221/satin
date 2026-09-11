import type { AdminRole } from "@/lib/auth";
export type AdminSection =
  | "dashboard"
  | "orders"
  | "order-settings"
  | "customers"
  | "products"
  | "positions"
  | "categories"
  | "support"
  | "site-editor"
  | "settings"
  | "staff"
  | "community"
  | "faq"
  | "support-content"
  | "promocodes"
  | "legal";

const allRoles: AdminRole[] = ["owner", "admin", "manager", "content", "support"];

export const adminSectionAccess: Record<AdminSection, AdminRole[]> = {
  dashboard: allRoles,
  orders: ["owner", "admin", "manager"],
  "order-settings": ["owner", "admin"],
  customers: ["owner", "admin", "manager"],
  products: ["owner", "admin", "content"],
  positions: ["owner", "admin", "manager", "content"],
  categories: ["owner", "admin", "content"],
  support: ["owner", "admin", "manager", "support"],
  "site-editor": ["owner", "admin", "content"],
  settings: ["owner"],
  staff: ["owner"],
  community: ["owner", "admin", "content", "support"],
  faq: ["owner", "admin", "content", "support"],
  "support-content": ["owner", "admin", "content", "support"],
  promocodes: ["owner", "admin", "manager"],
  legal: ["owner"],
};


export function getAdminSection(pathname: string): AdminSection {
  const path = pathname.replace(/^\/(nz-console|api\/admin)\/?/, "");
  if (path.startsWith("orders/settings")) return "order-settings";
  if (path.includes("/variants") || /^(positions|color-presets)/.test(path)) return "positions";
  if (/^(settings|delivery-settings|staff|customer-status-settings)/.test(path)) return "settings";
  if (path.startsWith("legal")) return "legal";
  if (/^(site-editor|page-blocks|site-banners|site-benefits|site-settings)/.test(path)) return "site-editor";
  if (/^(users|customers)/.test(path)) return "customers";
  if (path.startsWith("support-content")) return "support-content";
  for (const section of ["orders", "support", "categories", "products", "community", "faq", "promocodes"] as const) if (path.startsWith(section)) return section;
  return "dashboard";
}
