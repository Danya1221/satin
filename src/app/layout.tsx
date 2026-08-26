import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ForceBrandHead } from "@/components/force-brand-head";
import { HardLinkNavigation } from "@/components/hard-link-navigation";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://neontech.ru"),
  applicationName: "Neontech",
  title: "Neontech",
  description: "Магазин техники Neontech",
  icons: {
    icon: [
      { url: "/neontech-favicon.ico?v=neontech-6", sizes: "any" },
      { url: "/neontech-favicon.svg?v=neontech-6", type: "image/svg+xml" },
      { url: "/neontech-icon-32.png?v=neontech-6", sizes: "32x32", type: "image/png" },
      { url: "/neontech-icon-192.png?v=neontech-6", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/neontech-favicon.ico?v=neontech-6",
    apple: "/apple-touch-icon.png?v=neontech-6",
  },
  manifest: "/site.webmanifest?v=neontech-6",
  appleWebApp: {
    capable: true,
    title: "Neontech",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Neontech",
    description: "Магазин техники Neontech",
    siteName: "Neontech",
    url: "https://neontech.ru",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Neontech",
    description: "Магазин техники Neontech",
  },
};

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
        <title>Neontech</title>
        <meta name="application-name" content="Neontech" />
        <meta name="apple-mobile-web-app-title" content="Neontech" />
        <link rel="icon" href="/neontech-favicon.ico?v=neontech-6" sizes="any" />
        <link rel="icon" href="/neontech-favicon.svg?v=neontech-6" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=neontech-6" sizes="180x180" />
        <link rel="manifest" href="/site.webmanifest?v=neontech-6" />
        {/* Preload критические шрифты */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch для API */}
        <link rel="dns-prefetch" href="https://api.example.com" />
        
        {/* Оптимизация производительности */}
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body>
        <ForceBrandHead />
        <HardLinkNavigation />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
