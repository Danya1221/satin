import { SystemSettingsForm } from "@/components/admin/system-settings-form";
import { getSystemSettings } from "@/lib/site-settings-db";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();

  return <SystemSettingsForm initialSettings={settings} />;
}
