import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { canAccessAdminSection } from "@/lib/admin-access";
export const SUPPORT_COOKIE = "netizen_support_access";
export const supportTokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function getSupportAccess() {
  const session = await getAuthSession();
  const token = (await cookies()).get(SUPPORT_COOKIE)?.value || "";
  return { manager: canAccessAdminSection(session, "support"), customerId: session?.role === "customer" ? session.customerId : undefined, guestTokenHash: /^[a-f0-9]{64}$/.test(token) ? supportTokenHash(token) : "" };
}
export async function mayReadSupport(id: string) {
  const access = await getSupportAccess();
  if (access.manager) return true;
  const record = await prisma.supportRequest.findFirst({ where: { OR: [{ id }, { publicId: id }] }, select: { customerId: true, guestTokenHash: true } });
  return Boolean(record && ((access.customerId && access.customerId === record.customerId) || (access.guestTokenHash && access.guestTokenHash === record.guestTokenHash)));
}
