import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { isCustomerStatus } from "@/lib/customer-status-types";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const value = body?.status;
  const automatic = value === "auto" || value === "" || value == null;

  if (!automatic && !isCustomerStatus(value)) {
    return NextResponse.json({ error: "Неизвестный статус." }, { status: 400 });
  }

  const exists = await prisma.customer.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    return NextResponse.json({ error: "Клиент не найден." }, { status: 404 });
  }

  const statusOverride = automatic ? "" : String(value);
  const statusOverrideAt = automatic ? null : new Date();

  await prisma.$executeRaw`
    UPDATE "Customer"
    SET
      "statusOverride" = ${statusOverride},
      "statusOverrideAt" = ${statusOverrideAt},
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
  `;

  return NextResponse.json({ ok: true });
}
