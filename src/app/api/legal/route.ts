import { NextResponse } from "next/server";
import { getLegalSettings, legalVersion } from "@/lib/legal-db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const legal = await getLegalSettings();
    return NextResponse.json({ version: legalVersion(legal), sellerName: legal.sellerName }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Документы временно недоступны." }, { status: 503 }); }
}
