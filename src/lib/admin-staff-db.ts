import { normalizeAdminRoles, type AdminRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type AdminStaffRole = AdminRole;

export const adminRoleOptions: { value: AdminStaffRole; label: string; description: string }[] = [
  { value: "owner", label: "Главный админ", description: "Полный доступ: настройки, сотрудники, роли, сайт и все данные." },
  { value: "admin", label: "Администратор", description: "Управление товарами, заявками, клиентами и контентом." },
  { value: "manager", label: "Менеджер", description: "Заявки, клиенты, позиции и статусы заказов." },
  { value: "content", label: "Контент", description: "Категории, карточки товаров, фото, описания и SEO." },
  { value: "support", label: "Поддержка", description: "Обращения клиентов и коммуникация." },
];

export type AdminStaffMember = {
  id: string;
  login: string;
  name: string;
  role: AdminStaffRole;
  roles: AdminStaffRole[];
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getAdminStaff(): Promise<AdminStaffMember[]> {
  const staff = await prisma.adminUser.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      login: true,
      name: true,
      role: true,
      roles: true,
      permissions: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return staff.map((member) => {
    const roles = normalizeAdminRoles(member.roles, normalizeAdminRoles(member.role, ["manager"]));

    return {
      ...member,
      role: roles[0] ?? "manager",
      roles,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    };
  });
}
