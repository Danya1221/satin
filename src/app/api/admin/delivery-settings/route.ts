import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { canAccessAdminSection } from "@/lib/admin-access";
import { normalizeDeliverySettings } from "@/lib/delivery-settings";
export async function PUT(request: Request) {
 if(!canAccessAdminSection(await getAuthSession(),"settings")) return NextResponse.json({error:"Нет доступа."},{status:403});
 try {
  const body = await request.json(); const settings = normalizeDeliverySettings(body);
  if(!Array.isArray(body.zones) || settings.zones.length !== body.zones.length) return NextResponse.json({error:"Проверьте названия зон, уникальные коды и цены целыми рублями (0–1 000 000)."},{status:400});
  await prisma.siteSetting.upsert({where:{key:"delivery-zones"},create:{key:"delivery-zones",value:settings},update:{value:settings}});
  return NextResponse.json({settings});
 } catch { return NextResponse.json({error:"Не удалось сохранить доставку."},{status:503}); }
}
