import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAuthSession, normalizeAdminRoles } from "@/lib/auth";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (session?.role !== "admin") {
    redirect("/");
  }

  return (
    <AdminShell name={session.name || session.login || "Администратор"} roles={normalizeAdminRoles(session.roles, session.adminRole ? [session.adminRole] : ["manager"])}>
      {children}
    </AdminShell>
  );
}
