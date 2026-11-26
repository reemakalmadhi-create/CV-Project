"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Minus, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/toast";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useUser } from "@/components/user-context";
import { FREE_SHIPPING_FROM, getProduct, shippingFor } from "@/lib/catalog";
import { EASE } from "@/lib/motion";

/** Animated number (counts when totals change). */
function Amount({ value }: { value: number }) {
  const { sar } = useI18n();
  return <motion.span key={value} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>{sar(value)}</motion.span>;
}

export function BagView() {
  const { user, setQty, removeLine, checkout } = useUser();
  const toast = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [placing, setPlacing] = useState(false);
  const { t, sar, err, p: loc, lang } = useI18n();

  const lines = user.cart.flatMap((l, index) => { const p = getProduct(l.productId); return p ? [{ ...l, index, p, total: p.price_sar * l.qty }] : []; });
  if (!lines.length) return <EmptyState animation="empty_cart" title={t("bag.emptyT")} text={t("bag.empty")} cta={t("bag.continue")} href="/closet" />;

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const shipping = shippingFor(subtotal);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const toFree = FREE_SHIPPING_FROM - subtotal;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.9fr_1fr]">
      <motion.ul layout className="glass divide-y divide-border rounded-[24px] border border-border px-4 sm:px-6">
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.li key={`${l.productId}-${l.size}-${l.color}`} layout
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30, transition: { duration: 0.25 } }}
              transition={{ duration: 0.5, ease: EASE }} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 py-5 sm:grid-cols-[88px_1fr_auto] sm:gap-5">
              <Link href={`/product/${l.productId}`} className="showroom group relative block aspect-[4/5] overflow-hidden rounded-xl">
                <Image src={l.p.image} alt="" fill sizes="88px" className="object-contain p-1.5 transition-transform duration-500 group-hover:scale-105" />
              </Link>
              <div className="min-w-0">
                <Link href={`/product/${l.productId}`} className="font-semibold transition-colors hover:text-brand-violet">{loc(l.p).name}</Link>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("bag.sizeLine", { size: l.size })}{l.color ? ` · ${lang === "ar" && l.p.ar && l.p.colors[0]?.name === l.color ? l.p.ar.color : l.color}` : ""}</p>
                <p className="mt-1 text-sm">{sar(l.p.price_sar)}</p>
                <div dir="ltr" className="mt-3 inline-flex h-9 items-center rounded-full border border-border">
                  <button aria-label={t("c.less")} onClick={() => (l.qty > 1 ? setQty(l.index, l.qty - 1) : removeLine(l.index))} className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"><Minus className="size-3.5" /></button>
                  <motion.span key={l.qty} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-7 text-center text-sm font-semibold">{l.qty}</motion.span>
                  <button aria-label={t("c.more")} onClick={() => setQty(l.index, Math.min(10, l.qty + 1))} className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"><Plus className="size-3.5" /></button>
                </div>
              </div>
              <div className="text-end">
                <p className="font-semibold"><Amount value={l.total} /></p>
                <button onClick={async () => { await removeLine(l.index); toast(t("t.removedBag")); }} className="mt-2 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">{t("c.remove")}</button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <aside className="glass h-fit rounded-[24px] border border-border p-6 lg:sticky lg:top-24">
        <p className="eyebrow mb-4">{t("bag.summary")}</p>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between"><span>{t("bag.subtotal", { n: count })}</span><Amount value={subtotal} /></div>
          <div className="flex justify-between"><span>{t("bag.shipping")}</span><span>{shipping === 0 ? t("bag.free") : sar(shipping)}</span></div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><span>{t("bag.total")}</span><Amount value={subtotal + shipping} /></div>
        </div>
        {toFree > 0 && (
          <div className="mt-5">
            <p className="text-xs text-muted-foreground">{t("bag.away", { amount: sar(toFree) })}</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_FROM) * 100)}%` }} transition={{ duration: 0.8, ease: EASE }} />
            </div>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">{t("bag.note", { amount: sar(FREE_SHIPPING_FROM) })}</p>
        <div className="mt-6 grid gap-2">
          <Button full size="lg" onClick={() => setConfirm(true)}><Lock className="size-4" /> {t("bag.checkout")}</Button>
          <ButtonLink href="/closet" variant="secondary" full>{t("bag.continue")}</ButtonLink>
        </div>
      </aside>

      <Dialog open={confirm} onClose={() => setConfirm(false)} title={t("bag.confirm")}>
        <p className="text-sm"><b>{t("bag.total")}: {sar(subtotal + shipping)}</b> ({count} {t("bag.items")})</p>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900">
          {t("bag.proto")}
        </p>
        <Button full className="mt-5" disabled={placing} onClick={async () => {
          setPlacing(true);
          try { const order = await checkout(); toast(t("t.orderPlaced", { id: order.id }), "success"); setConfirm(false); router.push("/profile?tab=orders"); }
          catch (e) { toast(err((e as Error).message), "error"); }
          setPlacing(false);
        }}>{placing ? t("bag.placing") : t("bag.place")}</Button>
      </Dialog>
    </div>
  );
}
