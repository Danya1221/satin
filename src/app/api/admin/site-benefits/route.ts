import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { createSiteBenefit, getSiteBenefits } from "@/lib/site-content-library-db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getAuthSession();
  return session?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  return NextResponse.json({
    benefits: await getSiteBenefits({ rawImages: true }),
  });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const benefit = await createSiteBenefit(body);

  return NextResponse.json({ ok: true, benefit });
}
