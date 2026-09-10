import { InformationPage } from "@/components/information-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Контакты и реквизиты" };
export default function Page() { return <InformationPage kind="contacts" />; }
