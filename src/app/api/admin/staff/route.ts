import { NextResponse } from "next/server";

import { getAuthSession, hashPassword, normalizeAdminRoles, normalizeText, type AdminRole } from "@/lib/auth";
import { getAdminStaff } from "@/lib/admin-staff-db";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getAuthSession();
  return session?.role === "admin";
}

async function requireOwner() {
  const session = await getAuthSession();

  if (session?.role !== "admin") {
    return false;
  }

  if (normalizeAdminRoles(session.roles, session.adminRole ? [session.adminRole] : ["manager"]).includes("owner")) {
    return true;
  }

  if (!session.login) {
    return false;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { login: session.login },
    select: { role: true, roles: true, isActive: true },
  });

  return Boolean(admin?.isActive && normalizeAdminRoles(admin.roles, normalizeAdminRoles(admin.role, ["manager"])).includes("owner"));
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function readRoles(value: unknown): AdminRole[] {
  return normalizeAdminRoles(value, ["manager"]);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return jsonError("Доступ запрещён", 401);
  }

  return NextResponse.json({ staff: await getAdminStaff() });
}

export async function POST(request: Request) {
  if (!(await requireOwner())) {
    return jsonError("Только главный админ может создавать сотрудников и назначать роли.", 403);
  }

  const body = (await request.json().catch(() => null)) as
    | { login?: unknown; name?: unknown; password?: unknown; role?: unknown; roles?: unknown; isActive?: unknown }
    | null;

  const login = normalizeText(body?.login);
  const name = normalizeText(body?.name) || login;
  const password = normalizeText(body?.password);
  const roles = readRoles(body?.roles ?? body?.role);
  const primaryRole = roles[0] ?? "manager";

  if (!login) {
    return jsonError("Укажи логин сотрудника.");
  }

  if (!password || password.length < 6) {
    return jsonError("Пароль сотрудника должен быть минимум 6 символов.");
  }

  const exists = await prisma.adminUser.findUnique({ where: { login }, select: { id: true } });

  if (exists) {
    return jsonError("Сотрудник с таким логином уже есть.", 409);
  }

  await prisma.adminUser.create({
    data: {
      login,
      name,
      role: primaryRole,
      roles,
      permissions: roles.includes("owner") ? ["all"] : [],
      passwordHash: hashPassword(password),
      isActive: body?.isActive === false ? false : true,
    },
  });

  return NextResponse.json({ ok: true, staff: await getAdminStaff() });
}
