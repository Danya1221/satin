import { NextResponse } from "next/server";

import { getEditableSupportTopics } from "@/lib/support-topics-db";
import { listSupportTopicsWithCounts } from "@/lib/support-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [topics, counts] = await Promise.all([
    getEditableSupportTopics(),
    listSupportTopicsWithCounts(),
  ]);

  return NextResponse.json(
    { topics, counts },
    { headers: { "Cache-Control": "no-store" } },
  );
}
