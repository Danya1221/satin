import { NextResponse } from "next/server";

import { getPublicCategoriesFromDb } from "@/lib/public-categories-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await getPublicCategoriesFromDb();

  return NextResponse.json({ categories });
}
