import { NextResponse } from "next/server";

import { canAccessAdminSection } from "@/lib/admin-access";
import { getAuthSession } from "@/lib/auth";
import { getOrderWorkflowSettings, saveOrderWorkflowSettings } from "@/lib/order-workflow-db";

export const dynamic = "force-dynamic";

async function canManageOrderSettings() {
  const session = await getAuthSession();
  return session?.role === "admin" && canAccessAdminSection(session, "order-settings");
}

export async function GET() {
  if (!(await canManageOrderSettings())) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав." }, { status: 403 });
  }

  return NextResponse.json({ ok: true, settings: await getOrderWorkflowSettings() });
}

export async function PATCH(request: Request) {
  if (!(await canManageOrderSettings())) {
    return NextResponse.json({ ok: false, error: "Недостаточно прав." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const settings = await saveOrderWorkflowSettings(body?.settings);
  return NextResponse.json({ ok: true, settings });
}
