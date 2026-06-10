import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { fr } from "@/lib/i18n/fr";
import { defaultLocale, getDirection } from "@/lib/i18n";
import { SITE_URL } from "@/lib/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CurrencyProvider } from "@/components/currency/CurrencyProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${fr.meta.siteName} — ${fr.meta.tagline}`,
    template: `%s — ${fr.meta.siteName}`,
  },
  description: fr.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLocale} dir={getDirection(defaultLocale)}>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <CurrencyProvider>
          <Header />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </CurrencyProvider>
      </body>
    </html>
  );
}
