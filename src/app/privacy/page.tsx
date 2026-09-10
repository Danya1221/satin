import { InformationPage } from "@/components/information-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Политика обработки персональных данных" };
export default function Page() { return <InformationPage kind="privacy" />; }
