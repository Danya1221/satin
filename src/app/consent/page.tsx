import { InformationPage } from "@/components/information-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Согласие на обработку данных" };
export default function Page() { return <InformationPage kind="consent" />; }
