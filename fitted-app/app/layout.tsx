import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";
import { Backdrop } from "@/components/backdrop";
import { I18nProvider } from "@/components/i18n-provider";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Splash, SPLASH_HEAD_SCRIPT } from "@/components/splash";
import { ToastProvider } from "@/components/toast";
import { dirOf, t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["300", "400", "500", "600", "700"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = {
  title: "FITTED — AI virtual try-on",
  description: "Explore the closet, see it on you, make it yours.",
};

export const viewport: Viewport = { themeColor: "#fbf8f1", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={dirOf(lang)} className={`${manrope.variable} ${arabic.variable}`} suppressHydrationWarning>
      <head>
        {/* decides before first paint whether the splash plays (once per visit) */}
        <script dangerouslySetInnerHTML={{ __html: SPLASH_HEAD_SCRIPT }} />
        <link rel="preconnect" href="https://cdn.21st.dev" crossOrigin="" />
        <link rel="preload" as="image" href="/brand/aura-beige.jpg" />
      </head>
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        <Backdrop />
        <I18nProvider initialLang={lang}>
          <Splash tagline={t(lang, "tagline")} />
          <ToastProvider>
            <SmoothScroll />
            {children}
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
