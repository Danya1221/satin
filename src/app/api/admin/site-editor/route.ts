import { NextRequest, NextResponse } from "next/server";
import { updateSiteBanner, updateSiteBenefit, type SiteBanner, type SiteBenefit } from "@/lib/site-content-library-db";
import { Prisma } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import { canAccessAdminSection } from "@/lib/admin-access";
import { prisma } from "@/lib/db";
import { normalizeSiteEditorSettings, mergeBrandingImagesForStorage } from "@/lib/site-settings-db";
import { getModuleDefinition, type SitePageBlock } from "@/lib/page-builder-db";

export async function PATCH(request: NextRequest) {
  if (!canAccessAdminSection(await getAuthSession(), "site-editor")) return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.blocks) || body.blocks.length > 150) return NextResponse.json({ error: "Некорректные данные редактора." }, { status: 400 });
  const blocks = body.blocks as SitePageBlock[];
  if (blocks.some(block => !block || typeof block.id !== "string" || typeof block.title !== "string" || block.title.length > 300 || typeof block.description !== "string" || typeof block.enabled !== "boolean" || !Number.isFinite(block.sortOrder) || !getModuleDefinition(block.type) || !block.settings || typeof block.settings !== "object" || Array.isArray(block.settings) || Object.values(block.settings).some(value => value !== null && !["string", "number", "boolean"].includes(typeof value)))) return NextResponse.json({ error: "Проверьте поля модулей." }, { status: 400 });
  const banners: SiteBanner[] = body.media?.banners ?? [];
  const benefits: SiteBenefit[] = body.media?.benefits ?? [];
  if (!Array.isArray(banners) || !Array.isArray(benefits) || banners.length + benefits.length > 150 || [...banners, ...benefits].some(item => !item || typeof item.id !== "string" || typeof item.updatedAt !== "string")) return NextResponse.json({ error: "Некорректные данные баннеров." }, { status: 400 });
  const libraryPatch: { banners: SiteBanner[]; benefits: SiteBenefit[] } = { banners: [], benefits: [] };
  try {
    await prisma.$transaction(async tx => {
      for (const block of blocks) {
        const current = await tx.pageBlock.findUnique({ where: { id: block.id } });
        if (!current || !getModuleDefinition(block.type)?.pageKeys.includes(current.pageKey as SitePageBlock["pageKey"])) throw new Error("CONFLICT");
        if (block.updatedAt !== current.updatedAt.toISOString()) throw new Error("CONFLICT");
        await tx.pageBlock.update({ where: { id: block.id }, data: { title: block.title, description: block.description, enabled: block.enabled, sortOrder: block.sortOrder, type: block.type, settings: block.settings as Prisma.InputJsonValue } });
      }
      for (const banner of banners) {
        const current = await tx.siteBanner.findUnique({ where: { id: banner.id } });
        if (!current || current.updatedAt.toISOString() !== banner.updatedAt) throw new Error("CONFLICT");
        libraryPatch.banners.push(await updateSiteBanner(banner.id, banner, tx));
      }
      for (const benefit of benefits) {
        const current = await tx.siteBenefit.findUnique({ where: { id: benefit.id } });
        if (!current || current.updatedAt.toISOString() !== benefit.updatedAt) throw new Error("CONFLICT");
        libraryPatch.benefits.push(await updateSiteBenefit(benefit.id, benefit, tx));
      }
      if (body.site) {
        const current = await tx.siteSetting.findUnique({ where: { key: "site" } });
        const value = normalizeSiteEditorSettings(mergeBrandingImagesForStorage(body.site, current?.value), false) as unknown as Prisma.InputJsonValue;
        await tx.siteSetting.upsert({ where: { key: "site" }, create: { key: "site", value }, update: { value } });
      }
    }, { timeout: 20000 });
    return NextResponse.json({ ok: true, libraryPatch });
  } catch (error) {
    const conflict = error instanceof Error && error.message === "CONFLICT";
    return NextResponse.json({ error: conflict ? "Блок или изображение изменены в другой вкладке. Скопируйте свой текст и обновите страницу перед сохранением." : "Изменения не сохранены. Попробуйте ещё раз." }, { status: conflict ? 409 : 503 });
  }
}
