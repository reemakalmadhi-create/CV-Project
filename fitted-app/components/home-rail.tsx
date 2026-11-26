"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Arrow, ButtonLink } from "@/components/ui/button";
import ClothingRailHero, { type RailGarment } from "@/components/ui/product-rail-gallery";
import { PRODUCTS } from "@/lib/catalog";

/**
 * The ClothingRailHero from the Closet prompt, hung in a lit "showroom" panel so
 * every garment (even the black tee) reads clearly on the dark aura theme.
 * Clicking a piece opens ITS product page.
 */
export function HomeRail() {
  const router = useRouter();
  const { t, p, lang, sar } = useI18n();
  const items: RailGarment[] = useMemo(() => PRODUCTS.map((raw) => {
    const x = p(raw);
    return { id: x.id, name: x.name, kind: x.kind, color: x.color, tag: sar(x.price_sar), description: x.description,
      details: x.details, image: x.image, backImage: x.backImage, sideImage: x.sideImage };
  }), [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { PRODUCTS.forEach((i) => router.prefetch(`/product/${i.id}`)); }, [router]); // instant page changes

  return (
    <div className="showroom relative overflow-hidden rounded-[28px] shadow-[0_40px_120px_-40px_rgba(70,50,25,.55)] ring-1 ring-white/10">
      {/* soft aura light inside the showroom */}
      <div aria-hidden className="pointer-events-none absolute -top-1/3 start-1/4 h-[70%] w-[60%] rounded-full bg-[#e3ca96]/40 blur-[90px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-1/3 end-0 h-[60%] w-[50%] rounded-full bg-[#f6e3a0]/55 blur-[90px]" />
      <div dir="ltr">
        <ClothingRailHero
          key={lang}
          items={items}
          hanger="none"
          eyebrow={t("home.railEyebrow")}
          heading={t("home.railHeading")}
          caption={t("home.railCaption")}
          autoplay
          onSelect={(item) => router.push(`/product/${item.id}`)}
          action={<ButtonLink href="/closet">{t("home.shopEdit")} <Arrow /></ButtonLink>}
          className="bg-transparent"
          dir={lang === "ar" ? "rtl" : "ltr"}
        />
      </div>
    </div>
  );
}
