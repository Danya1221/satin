import { redirect } from "next/navigation";

import { AdminThemeSwitcher } from "@/components/admin/admin-theme-switcher";
import { getAuthSession } from "@/lib/auth";

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
    <div className="admin-theme-scope">
      <AdminThemeSwitcher />
      {children}
    </div>
  );
}
