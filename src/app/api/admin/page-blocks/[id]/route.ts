import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { deletePageBlock, isPageBlockType, movePageBlock, updatePageBlock } from "@/lib/page-builder-db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getAuthSession();
  return session?.role === "admin";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  try {
    if (body?.action === "move") {
      const block = await movePageBlock(id, body.direction === "up" ? "up" : "down");
      return NextResponse.json({ ok: true, block });
    }

    const block = await updatePageBlock(id, {
      title: typeof body?.title === "string" ? body.title : undefined,
      description: typeof body?.description === "string" ? body.description : undefined,
      enabled: typeof body?.enabled === "boolean" ? body.enabled : undefined,
      sortOrder: typeof body?.sortOrder === "number" ? body.sortOrder : undefined,
      type: isPageBlockType(body?.type) ? body.type : undefined,
      settings:
        body?.settings && typeof body.settings === "object" && !Array.isArray(body.settings)
          ? body.settings
          : undefined,
    });

    return NextResponse.json({ ok: true, block });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось обновить модуль." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deletePageBlock(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось удалить модуль." },
      { status: 400 }
    );
  }
}
