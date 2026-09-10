import { getLegalSettings } from "@/lib/legal-db";
import { LegalSettingsForm } from "@/components/admin/legal-settings-form";
export const dynamic = "force-dynamic";
export default async function LegalPage() { return <LegalSettingsForm initial={await getLegalSettings()} />; }
