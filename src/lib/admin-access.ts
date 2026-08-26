import "server-only";

import { getAuthSession, normalizeAdminRoles, type AdminRole, type AuthSessionPayload } from "@/lib/auth";

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
  | "staff";

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
};

export function getAdminSessionRoles(session: AuthSessionPayload | null | undefined): AdminRole[] {
  if (session?.role !== "admin") {
    return [];
  }

  return normalizeAdminRoles(session.roles, session.adminRole ? [session.adminRole] : ["manager"]);
}

export function canAccessAdminSection(
  session: AuthSessionPayload | null | undefined,
  section: AdminSection,
) {
  const roles = getAdminSessionRoles(session);

  if (!roles.length) {
    return false;
  }

  if (roles.includes("owner")) {
    return true;
  }

  return roles.some((role) => adminSectionAccess[section].includes(role));
}

export async function getCurrentAdminRoles() {
  const session = await getAuthSession();
  return getAdminSessionRoles(session);
}
