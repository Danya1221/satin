import { SiteEditorForm } from "@/components/admin/site-editor-form";
import { getPageBuilderState } from "@/lib/page-builder-db";
import { getSiteEditorSettings } from "@/lib/site-settings-db";
import { getSiteContentLibrary } from "@/lib/site-content-library-db";

export const dynamic = "force-dynamic";

export default async function AdminSiteEditorPage() {
  const [settings, pageBuilder, contentLibrary] = await Promise.all([
    getSiteEditorSettings(),
    getPageBuilderState(),
    getSiteContentLibrary(),
  ]);

  return (
    <SiteEditorForm
      initialSettings={settings}
      initialPageBuilder={pageBuilder}
      initialContentLibrary={contentLibrary}
    />
  );
}
