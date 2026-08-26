import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { deleteSiteBenefit, updateSiteBenefit } from "@/lib/site-content-library-db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getAuthSession();
  return session?.role === "admin";
}

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const benefit = await updateSiteBenefit(id, body);

  return NextResponse.json({ ok: true, benefit });
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  const { id } = await context.params;
  await deleteSiteBenefit(id);

  return NextResponse.json({ ok: true });
}
