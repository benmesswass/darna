import type { Metadata } from "next";
import { Cairo, Outfit } from "next/font/google";
import "./globals.css";
import { fr } from "@/lib/i18n/fr";
import { getDirection } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SectionTheme } from "@/components/layout/SectionTheme";
import { CurrencyProvider } from "@/components/currency/CurrencyProvider";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

// Outfit ne couvre pas l'arabe : Cairo prend le relais quand dir="rtl"
// (règle html[dir="rtl"] dans globals.css).
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

// SEO : le français reste la locale canonique des métadonnées.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${fr.meta.siteName} — ${fr.meta.tagline}`,
    template: `%s — ${fr.meta.siteName}`,
  },
  description: fr.meta.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body
        className={`${outfit.variable} ${cairo.variable} font-sans antialiased`}
      >
        <LocaleProvider locale={locale}>
          <CurrencyProvider>
            <SectionTheme />
            <Header />
            <main className="min-h-[70vh]">{children}</main>
            <Footer />
          </CurrencyProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
