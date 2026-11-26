import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { t, type Lang } from "@/lib/i18n";

export function Footer({ lang }: { lang: Lang }) {
  const cols: { h: string; links: [string, string][] }[] = [
    { h: t(lang, "f.shop"), links: [[t(lang, "nav.closet"), "/closet"], [t(lang, "nav.favorites"), "/favorites"], [t(lang, "nav.bag"), "/bag"]] },
    { h: t(lang, "f.tryon"), links: [[t(lang, "nav.tryon"), "/try-on"], [t(lang, "nav.about"), "/about"], [t(lang, "nav.profile"), "/profile"]] },
    { h: t(lang, "f.service"), links: [[t(lang, "f.freeDelivery"), ""], [t(lang, "f.returns"), ""], [t(lang, "f.sizes"), ""]] },
  ];
  return (
    <footer className="border-t border-border">
      <Reveal className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8" stagger={0.08}>
        <div>
          <p dir="ltr" className="keep-tracking text-[19px] font-bold tracking-[0.34em] text-brand inline-block">FITTED</p>
          <p className="mt-3 max-w-[30ch] text-sm text-muted-foreground">{t(lang, "f.tagline")}</p>
        </div>
        {cols.map((col) => (
          <div key={col.h}>
            <p className="eyebrow mb-4">{col.h}</p>
            <ul className="space-y-2.5 text-sm">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  {href
                    ? <Link href={href} className="group relative text-foreground/80 transition-colors hover:text-foreground">
                        {label}<span className="absolute -bottom-0.5 start-0 h-px w-0 bg-brand transition-all duration-300 group-hover:w-full" />
                      </Link>
                    : <span className="text-muted-foreground">{label}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Reveal>
      <div className="mx-auto max-w-[1240px] px-5 pb-8 text-xs text-muted-foreground md:px-8">© {new Date().getFullYear()} FITTED · {t(lang, "f.proto")}</div>
    </footer>
  );
}
