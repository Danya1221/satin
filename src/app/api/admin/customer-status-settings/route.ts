import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import {
  getCustomerStatusRules,
  saveCustomerStatusRules,
} from "@/lib/customer-status-db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getAuthSession();
  return session?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  return NextResponse.json({ rules: await getCustomerStatusRules() });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rules = await saveCustomerStatusRules(body?.rules ?? body);
  return NextResponse.json({ ok: true, rules });
}
