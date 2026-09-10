import { SupportContentAdminClient } from "@/components/admin/support-content-admin-client";
export const dynamic = "force-dynamic";
export default function SupportContentPage() {
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">Сайт</p><h1>Сервис и поддержка</h1><p>Преимущества, ответы и темы обращений на странице помощи.</p></div></div><SupportContentAdminClient /></>;
}
