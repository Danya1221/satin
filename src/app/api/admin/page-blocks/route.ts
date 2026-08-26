import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import {
  createPageBlock,
  getPageBuilderState,
  isPageBlockType,
  isPageKey,
} from "@/lib/page-builder-db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getAuthSession();
  return session?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  return NextResponse.json(await getPageBuilderState());
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const pageKey = body?.pageKey;
  const type = body?.type;

  if (!isPageKey(pageKey) || !isPageBlockType(type)) {
    return NextResponse.json(
      { error: "Передайте корректные pageKey и type." },
      { status: 400 }
    );
  }

  try {
    const block = await createPageBlock({ pageKey, type });
    return NextResponse.json({ ok: true, block });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось добавить модуль." },
      { status: 400 }
    );
  }
}
