import { NextRequest, NextResponse } from "next/server";

import { canAccessAdminSection } from "@/lib/admin-access";
import { getAuthSession } from "@/lib/auth";
import {
  getSiteEditorSettings,
  getSystemSettings,
  saveSiteEditorSettings,
  saveSystemSettings,
} from "@/lib/site-settings-db";

export const dynamic = "force-dynamic";

function denied(status = 403) {
  return NextResponse.json({ ok: false, error: "Недостаточно прав для сохранения настроек." }, { status });
}

async function requireSection(section: "settings" | "site-editor") {
  const session = await getAuthSession();

  if (session?.role !== "admin") return false;

  return canAccessAdminSection(session, section);
}

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope") ?? "all";
  const section = scope === "system" ? "settings" : "site-editor";

  if (!(await requireSection(section))) {
    return denied();
  }

  if (scope === "site") {
    return NextResponse.json({ site: await getSiteEditorSettings() });
  }

  if (scope === "system") {
    return NextResponse.json({ system: await getSystemSettings() });
  }

  const [site, system] = await Promise.all([
    getSiteEditorSettings(),
    getSystemSettings(),
  ]);

  return NextResponse.json({ site, system });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const scope = body?.scope;
  const section = scope === "system" ? "settings" : "site-editor";

  if (!(await requireSection(section))) {
    return denied();
  }

  if (scope === "site") {
    const site = await saveSiteEditorSettings(body.value);
    return NextResponse.json({ ok: true, site });
  }

  if (scope === "system") {
    const system = await saveSystemSettings(body.value);
    return NextResponse.json({ ok: true, system });
  }

  return NextResponse.json(
    { error: "Передайте scope: site или system" },
    { status: 400 }
  );
}
