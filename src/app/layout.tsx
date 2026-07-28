import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Cairo, Outfit } from "next/font/google";
import "./globals.css";
import { fr } from "@/lib/i18n/fr";
import { getDirection } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/config";
import { THEME_COOKIE, THEME_INIT_SCRIPT, isThemeChoice } from "@/lib/theme";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HistoryNav } from "@/components/layout/HistoryNav";
import { SectionTheme } from "@/components/layout/SectionTheme";
import { SectionOverrideProvider } from "@/components/layout/ActiveSection";
import { CurrencyProvider } from "@/components/currency/CurrencyProvider";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

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

// Couleur de la barre de navigateur mobile (thème sable, cf. §L9.2) —
// distinct du `theme_color` du manifest (apparence une fois l'app installée).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e3a93c",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const themeCookie = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isThemeChoice(themeCookie) ? themeCookie : null;

  return (
    <html lang={locale} dir={getDirection(locale)} className={theme === "dark" ? "dark" : undefined}>
      <head>
        <script>{THEME_INIT_SCRIPT}</script>
      </head>
      <body
        className={`${outfit.variable} ${cairo.variable} font-sans antialiased`}
      >
        <LocaleProvider locale={locale}>
          <CurrencyProvider>
            <SectionOverrideProvider>
              <SectionTheme />
              <Header />
              <main className="min-h-[70vh]">{children}</main>
              <Footer />
              <HistoryNav />
              <CookieConsent />
              <ServiceWorkerRegister />
            </SectionOverrideProvider>
          </CurrencyProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
