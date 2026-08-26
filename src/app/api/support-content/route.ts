import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [features, questions] = await Promise.all([
      prisma.supportFeature.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.supportFaqItem.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    ]);

    return NextResponse.json({ features, questions });
  } catch (error) {
    console.error("Support content load failed", error);
    return NextResponse.json({ features: [], questions: [] }, { status: 500 });
  }
}
