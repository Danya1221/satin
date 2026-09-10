import { mayReadSupport, getSupportAccess } from "@/lib/support-access";
import { NextResponse } from "next/server";
import { getSupportRequest, updateSupportRequest, type SupportStatus } from "@/lib/support-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await mayReadSupport(id))) return NextResponse.json({ error: "Обращение недоступно." }, { status: 404 });
  const supportRequest = await getSupportRequest(id);

  if (!supportRequest) {
    return NextResponse.json({ error: "Обращение не найдено." }, { status: 404 });
  }

  return NextResponse.json({ request: supportRequest });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSupportAccess()).manager) return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    status?: SupportStatus;
    assignedTo?: string;
    topicId?: string;
  } | null;

  const supportRequest = await updateSupportRequest(id, {
    status: body?.status,
    assignedTo: body?.assignedTo,
    topicId: body?.topicId,
  });

  if (!supportRequest) {
    return NextResponse.json({ error: "Обращение не найдено." }, { status: 404 });
  }

  return NextResponse.json({ request: supportRequest });
}
