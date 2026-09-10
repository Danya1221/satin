import "server-only";

import { getAuthSession, normalizeAdminRoles, type AdminRole, type AuthSessionPayload } from "@/lib/auth";

import { adminSectionAccess, type AdminSection } from "@/lib/admin-policy";
export { adminSectionAccess, type AdminSection } from "@/lib/admin-policy";

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
