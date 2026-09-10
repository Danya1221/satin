import { CommunityAdminClient } from "@/components/admin/community-admin-client";
export const dynamic = "force-dynamic";
export default function CommunityPage() {
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">Покупатели</p><h1>Отзывы и вопросы</h1><p>Отвечайте покупателям и управляйте публикациями.</p></div></div><CommunityAdminClient /></>;
}
