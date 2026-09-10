import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { canAccessAdminSection } from "@/lib/admin-access";
import { getLegalSettings } from "@/lib/legal-db";
import { normalizeLegalSettings, legalMissingFields } from "@/lib/legal-settings";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!canAccessAdminSection(await getAuthSession(), "legal")) return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  const [legal, receipts] = await Promise.all([getLegalSettings(), prisma.consentReceipt.findMany({ orderBy: { acceptedAt: "desc" }, take: 50 })]);
  return NextResponse.json({ legal, missing: legalMissingFields(legal), receipts });
}
export async function PATCH(request: NextRequest) {
  if (!canAccessAdminSection(await getAuthSession(), "legal")) return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Некорректные данные." }, { status: 400 });
  const legal = normalizeLegalSettings(body);
  if (legal.inn && !/^\d{10}$|^\d{12}$/.test(legal.inn)) return NextResponse.json({ error: "ИНН должен содержать 10 или 12 цифр." }, { status: 400 });
  if (legal.ogrn && !(legal.entityType === "entrepreneur" ? /^\d{15}$/ : /^\d{13}$/).test(legal.ogrn)) return NextResponse.json({ error: "ОГРН должен содержать 13 цифр, ОГРНИП — 15." }, { status: 400 });
  for (const email of [legal.email, legal.privacyEmail]) if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Проверьте адрес электронной почты." }, { status: 400 });
  try {
    await prisma.siteSetting.upsert({ where: { key: "legal" }, create: { key: "legal", value: legal }, update: { value: legal } });
    return NextResponse.json({ ok: true, legal, missing: legalMissingFields(legal) });
  } catch { return NextResponse.json({ error: "Не удалось сохранить реквизиты. Попробуйте ещё раз." }, { status: 503 }); }
}
