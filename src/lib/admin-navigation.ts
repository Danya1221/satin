import type { AdminRole } from "@/lib/auth";

export const adminNavigation = [
  { group: "Магазин", title: "Обзор", href: "/nz-console", icon: "home", roles: ["owner", "admin", "manager", "content", "support"] },
  { group: "Магазин", title: "Заказы", href: "/nz-console/orders", icon: "bag", roles: ["owner", "admin", "manager"] },
  { group: "Каталог", title: "Товары", href: "/nz-console/products", icon: "grid", roles: ["owner", "admin", "content"] },
  { group: "Каталог", title: "Варианты и остатки", href: "/nz-console/positions", icon: "grid", roles: ["owner", "admin", "manager", "content"] },
  { group: "Каталог", title: "Категории", href: "/nz-console/categories", icon: "grid", roles: ["owner", "admin", "content"] },
  { group: "Покупатели", title: "Клиенты", href: "/nz-console/users", icon: "user", roles: ["owner", "admin", "manager"] },
  { group: "Покупатели", title: "Обращения", href: "/nz-console/support", icon: "help", roles: ["owner", "admin", "manager", "support"] },
  { group: "Покупатели", title: "Отзывы и вопросы", href: "/nz-console/community", icon: "heart", roles: ["owner", "admin", "content", "support"] },
  { group: "Сайт", title: "Редактор сайта", href: "/nz-console/site-editor", icon: "sparkles", roles: ["owner", "admin", "content"] },
  { group: "Сайт", title: "Вопросы и ответы", href: "/nz-console/faq", icon: "help", roles: ["owner", "admin", "content", "support"] },
  { group: "Сайт", title: "Сервис и поддержка", href: "/nz-console/support-content", icon: "phone", roles: ["owner", "admin", "content", "support"] },
  { group: "Управление", title: "Промокоды", href: "/nz-console/promocodes", icon: "sparkles", roles: ["owner", "admin", "manager"] },
  { group: "Управление", title: "Документы и реквизиты", href: "/nz-console/legal", icon: "check", roles: ["owner"] },
  { group: "Управление", title: "Настройки и сотрудники", href: "/nz-console/settings", icon: "menu", roles: ["owner"] },
] as const;

export function allowedAdminNavigation(roles: AdminRole[]) {
  return adminNavigation.filter(item => roles.some(role => (item.roles as readonly string[]).includes(role)));
}
