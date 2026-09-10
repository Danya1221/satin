import type { Metadata } from "next";
import { getSiteEditorSettings } from "@/lib/site-settings-db";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteEditorSettings().catch(() => null);
  const name = site?.branding.storeName || "Магазин техники";
  const title = site?.seo.homeTitle || name;
  const description = site?.seo.homeDescription || "Техника, аксессуары и помощь с выбором.";
  return { applicationName: name, title, description, keywords: site?.seo.keywords, icons: site?.branding.favicon ? { icon: site.branding.favicon } : { icon: "/neontech-favicon.svg" }, openGraph: { title, description, siteName: name, type: "website", locale: "ru_RU" } };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f5f5f7" />
        <script dangerouslySetInnerHTML={{ __html: `try { document.documentElement.classList.toggle("dark", localStorage.getItem("netizen-theme") === "dark"); } catch {}` }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
