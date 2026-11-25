import Link from "next/link";
import { HomeRail } from "@/components/home-rail";
import { HomeWelcome } from "@/components/home-welcome";
import { ModelStatus } from "@/components/page-header";
import { ProductGrid } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { PRODUCTS } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { MODEL } from "@/lib/model-info";

export default async function HomePage() {
  const lang = await getLang();
  const connected = Boolean(process.env.TRYON_API_URL);
  return (
    <>
      <HomeWelcome />
      <div className="mt-8"><HomeRail /></div>

      <Reveal className="mt-16">
        <p className="eyebrow">{t(lang, "home.editEyebrow")}</p>
        <h2 className="title mt-2">{t(lang, "home.editTitle")}</h2>
      </Reveal>
      <div className="mt-8"><ProductGrid products={PRODUCTS.slice(0, 4)} /></div>

      <hr className="my-20 border-border" />
      <Reveal>
        <p className="eyebrow">{t(lang, "home.tryEyebrow")}</p>
        <h2 className="title mt-2">{t(lang, "home.tryTitle")}</h2>
        <ModelStatus connected={connected} model={MODEL.NAME} />
      </Reveal>
      <Reveal className="mt-10 grid gap-6 md:grid-cols-3" stagger={0.1}>
        {(["1", "2", "3"] as const).map((n) => (
          <div key={n} className="group glass border border-border p-6 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-brand-violet/60">
            <p className="text-brand inline-block text-[11px] font-bold tracking-[0.2em]">0{n}</p>
            <h3 className="mt-3 text-lg font-medium">{t(lang, `home.s${n}t`)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(lang, `home.s${n}`, { model: MODEL.NAME })}</p>
          </div>
        ))}
      </Reveal>
      <Reveal className="mt-8">
        <Link href="/about" className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-violet transition-colors hover:text-foreground">
          {t(lang, "home.aboutLink")} <span className="transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1">→</span>
        </Link>
      </Reveal>
    </>
  );
}
