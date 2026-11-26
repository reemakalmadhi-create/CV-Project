"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { localize, type LocalProduct, type Product } from "@/lib/catalog";
import { dirOf, formatSAR, LANG_COOKIE, t as translate, translateError, type Key, type Lang } from "@/lib/i18n";

interface I18n {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: (key: Key, vars?: Record<string, string | number>) => string;
  sar: (amount: number) => string;
  err: (message: string) => string;
  p: (product: Product) => LocalProduct;
  setLang: (lang: Lang) => void;
}

const Ctx = createContext<I18n | null>(null);

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside <I18nProvider>");
  return v;
}

export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();
  const setLang = useCallback((next: Lang) => {
    document.cookie = `${LANG_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = dirOf(next);
    setLangState(next);
    router.refresh(); // server components (titles, page headers) re-render in the new language
  }, [router]);

  const value: I18n = {
    lang,
    dir: dirOf(lang),
    t: (key, vars) => translate(lang, key, vars),
    sar: (amount) => formatSAR(amount, lang),
    err: (m) => translateError(m, lang),
    p: (product) => localize(product, lang),
    setLang,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** EN | ع switch. */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className={`keep-tracking inline-flex h-10 items-center rounded-full border border-border px-3.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-brand-violet hover:text-foreground ${className}`}
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {t("nav.lang")}
    </button>
  );
}
