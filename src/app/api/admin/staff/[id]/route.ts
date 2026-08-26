import { NextResponse } from "next/server";

import { getAuthSession, hashPassword, normalizeAdminRoles, normalizeText, type AdminRole } from "@/lib/auth";
import { getAdminStaff } from "@/lib/admin-staff-db";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

async function countActiveOwners(exceptId?: string) {
  const admins = await prisma.adminUser.findMany({
    where: { isActive: true },
    select: { id: true, role: true, roles: true },
  });

  return admins.filter((admin) => admin.id !== exceptId && normalizeAdminRoles(admin.roles, normalizeAdminRoles(admin.role, ["manager"])).includes("owner")).length;
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await requireOwner())) {
    return jsonError("Только главный админ может менять сотрудников и роли.", 403);
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { login?: unknown; name?: unknown; password?: unknown; role?: unknown; roles?: unknown; isActive?: unknown }
    | null;

  const current = await prisma.adminUser.findUnique({ where: { id }, select: { id: true, role: true, roles: true, isActive: true } });

  if (!current) {
    return jsonError("Сотрудник не найден.", 404);
  }

  const data: {
    login?: string;
    name?: string;
    role?: string;
    roles?: AdminRole[];
    permissions?: string[];
    passwordHash?: string;
    isActive?: boolean;
  } = {};

  if (body?.login !== undefined) {
    const login = normalizeText(body.login);
    if (!login) return jsonError("Логин не может быть пустым.");
    data.login = login;
  }

  if (body?.name !== undefined) {
    data.name = normalizeText(body.name) || "Сотрудник";
  }

  if (body?.roles !== undefined || body?.role !== undefined) {
    const roles = readRoles(body.roles ?? body.role);
    const removesOwner = normalizeAdminRoles(current.roles, normalizeAdminRoles(current.role, ["manager"])).includes("owner") && !roles.includes("owner");

    if (removesOwner && (await countActiveOwners(id)) === 0) {
      return jsonError("Нельзя убрать последнего главного админа.", 409);
    }

    data.roles = roles;
    data.role = roles[0] ?? "manager";
    data.permissions = roles.includes("owner") ? ["all"] : [];
  }

  if (body?.password !== undefined) {
    const password = normalizeText(body.password);
    if (password && password.length < 6) return jsonError("Пароль должен быть минимум 6 символов.");
    if (password) data.passwordHash = hashPassword(password);
  }

  if (typeof body?.isActive === "boolean") {
    if (current.isActive && body.isActive === false && normalizeAdminRoles(current.roles, normalizeAdminRoles(current.role, ["manager"])).includes("owner") && (await countActiveOwners(id)) === 0) {
      return jsonError("Нельзя отключить последнего главного админа.", 409);
    }

    data.isActive = body.isActive;
  }

  await prisma.adminUser.update({ where: { id }, data });

  return NextResponse.json({ ok: true, staff: await getAdminStaff() });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await requireOwner())) {
    return jsonError("Только главный админ может удалять сотрудников.", 403);
  }

  const session = await getAuthSession();
  const { id } = await context.params;
  const current = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, login: true, role: true, roles: true },
  });

  if (!current) {
    return jsonError("Сотрудник не найден.", 404);
  }

  if (session?.login === current.login) {
    return jsonError("Нельзя удалить собственный профиль во время активной сессии.", 409);
  }

  if (
    normalizeAdminRoles(
      current.roles,
      normalizeAdminRoles(current.role, ["manager"]),
    ).includes("owner") &&
    (await countActiveOwners(id)) === 0
  ) {
    return jsonError("Нельзя удалить последнего главного админа.", 409);
  }

  await prisma.adminUser.delete({ where: { id } });

  return NextResponse.json({ ok: true, staff: await getAdminStaff() });
}
