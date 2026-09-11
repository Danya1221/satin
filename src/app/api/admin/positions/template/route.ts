import { NextRequest } from "next/server";
import { GET as download } from "../table/route";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
 const url = new URL(request.url); url.searchParams.set("kind", "variants"); url.searchParams.set("template", "1");
 return download(new NextRequest(url, { headers: request.headers }));
}
