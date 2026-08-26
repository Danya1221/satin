import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  const rows = await prisma.productVariant.findMany({
    select: {
      color: true,
      colorHex: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 500,
  });

  const map = new Map<string, { name: string; hex: string }>();

  for (const row of rows) {
    const name = String(row.color ?? "").trim();
    const hex = String(row.colorHex ?? "").trim();

    if (!name || !/^#[0-9a-f]{6}$/i.test(hex)) {
      continue;
    }

    const key = name.toLowerCase();

    if (!map.has(key)) {
      map.set(key, { name, hex });
    }
  }

  return NextResponse.json({
    colors: Array.from(map.values()),
  });
}
