import { NextResponse } from "next/server";

import { getSiteEditorSettings } from "@/lib/site-settings-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const site = await getSiteEditorSettings();

  return NextResponse.json({ site });
}
