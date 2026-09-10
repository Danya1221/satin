import { InformationPage } from "@/components/information-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Файлы cookie" };
export default function Page() { return <InformationPage kind="cookies" />; }
