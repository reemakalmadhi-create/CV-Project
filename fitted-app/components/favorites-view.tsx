"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/toast";
import { Button, ButtonLink } from "@/components/ui/button";
import { useUser } from "@/components/user-context";
import { getProduct, type Product } from "@/lib/catalog";
import { EASE } from "@/lib/motion";

export function FavoritesView() {
  const { user, toggleFavorite, addToCart } = useUser();
  const { t, sar, err, p: loc } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const saved = user.favorites.map((id) => getProduct(id)).filter(Boolean) as Product[];

  if (!saved.length) return <EmptyState animation="empty_favorites" title={t("fav.emptyT")} text={t("fav.empty")} cta={t("fav.cta")} href="/closet" />;

  return (
    <>
      <p className="mb-6 text-xs text-muted-foreground">{t("fav.count", { n: saved.length })}</p>
      <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {saved.map((p, i) => {
            const size = user.sizes[p.tryon_category];
            const lp = loc(p);
            return (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }} transition={{ duration: 0.6, ease: EASE }}
                className="glass group flex flex-col overflow-hidden rounded-[22px] border border-border transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(184,137,78,.45)]">
                <button onClick={() => router.push(`/product/${p.id}`)} className="showroom relative aspect-[4/5] overflow-hidden">
                  <Image src={p.image} alt={lp.name} fill priority={i < 4} sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-contain p-[7%] transition-transform duration-700 group-hover:scale-105" />
                </button>
                <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                  <p className="text-sm font-semibold">{lp.name}</p>
                  <p className="mb-4 mt-1 text-[13.5px] text-muted-foreground">{sar(p.price_sar)}</p>
                  <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <ButtonLink href={`/product/${p.id}`} variant="secondary" size="sm" className="h-10">{t("c.view")}</ButtonLink>
                    <ButtonLink href={`/try-on?product=${p.id}`} size="sm" className="h-10">{t("c.tryon")}</ButtonLink>
                    <Button variant="secondary" size="sm" className="h-10" title={size ? t("fav.savedSize", { size }) : t("fav.noSize")}
                      onClick={async () => {
                        if (!size) { toast(t("t.chooseSize")); router.push(`/product/${p.id}`); return; }
                        try { await addToCart(p.id, size, 1); toast(t("t.addedBag", { name: lp.name, size }), "bag"); } catch (e) { toast(err((e as Error).message), "error"); }
                      }}>{t("c.addToBag")}</Button>
                    <Button variant="ghost" size="sm" className="h-10" onClick={async () => { await toggleFavorite(p.id); toast(t("t.removedFav"), "heart"); }}>{t("c.remove")}</Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
