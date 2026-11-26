"use client";
import { animate, motion, useAnimationControls, useMotionValue, useMotionValueEvent, useSpring, useTransform } from "framer-motion";
import { Minus, Plus, Ruler } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { FavoriteButton, Swatches } from "@/components/product-card";
import { useToast } from "@/components/toast";
import { Arrow, Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useUser } from "@/components/user-context";
import { SIZE_GUIDE, type Product } from "@/lib/catalog";
import { EASE, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Front/back stage: drag to turn (CSS 3D), snaps to the nearest face, double-click flips. */
function Stage({ product }: { product: Product }) {
  const { t, p: loc } = useI18n();
  const name = loc(product).name;
  const angle = useMotionValue(0);
  const tiltX = useMotionValue(0);
  const smoothTilt = useSpring(tiltX, { stiffness: 150, damping: 18 });
  const face = useTransform(angle, (a) => (((a % 360) + 360) % 360 > 90 && ((a % 360) + 360) % 360 < 270 ? "back" : "front"));
  const [side, setSide] = useState<"front" | "back">("front");
  const drag = useRef<{ x: number; a: number } | null>(null);
  useMotionValueEvent(face, "change", (v) => setSide(v as "front" | "back"));

  const snapTo = (target: number) => animate(angle, target, { type: "spring", stiffness: 90, damping: 14 });
  const turn = (to: "front" | "back") => {
    const base = Math.round(angle.get() / 360) * 360;
    snapTo(base + (to === "back" ? 180 : 0));
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        dir="ltr" className="showroom relative aspect-[4/5] cursor-grab touch-pan-y overflow-hidden rounded-[24px] active:cursor-grabbing [perspective:1400px]"
        onPointerDown={(e) => { drag.current = { x: e.clientX, a: angle.get() }; (e.target as Element).setPointerCapture?.(e.pointerId); }}
        onPointerMove={(e) => {
          if (drag.current) { angle.set(drag.current.a + (e.clientX - drag.current.x) * 0.5); return; }
          const r = e.currentTarget.getBoundingClientRect();
          tiltX.set(((e.clientY - r.top) / r.height - 0.5) * -8);
        }}
        onPointerUp={() => {
          if (!drag.current) return;
          drag.current = null;
          const a = angle.get(), n = ((a % 360) + 360) % 360;
          snapTo(a - n + (n > 90 && n < 270 ? 180 : n >= 270 ? 360 : 0));
        }}
        onPointerLeave={() => tiltX.set(0)}
        onDoubleClick={() => turn(side === "front" ? "back" : "front")}
      >
        <motion.div
          initial={{ opacity: 0, rotateY: -35 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ duration: 1.2, ease: EASE }}
          className="absolute inset-[5%_10%] [transform-style:preserve-3d]"
          style={{ rotateY: angle, rotateX: smoothTilt }}
        >
          {(["front", "back"] as const).map((f) => (
            <div key={f} className="absolute inset-0 flex items-center justify-center [backface-visibility:hidden]" style={{ transform: f === "back" ? "rotateY(180deg)" : undefined }}>
              <Image src={f === "back" ? product.backImage || product.image : product.image} alt={`${name} — ${t(f === "back" ? "c.back" : "c.front")}`} draggable={false}
                fill priority={f === "front"} sizes="(min-width: 768px) 50vw, 90vw"
                className="select-none object-contain drop-shadow-[0_30px_30px_rgba(20,10,60,.22)]" />
            </div>
          ))}
        </motion.div>
        <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t("p.dragHint")}
        </p>
      </div>
      <div className="flex justify-center gap-6">
        {(["front", "back"] as const).map((f) => (
          <button key={f} onClick={() => turn(f)} className={cn("relative pb-1.5 text-sm capitalize transition-colors", side === f ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t(f === "back" ? "c.back" : "c.front")}
            {side === f && <motion.span layoutId="stage-face" transition={SPRING} className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductDetail({ product }: { product: Product }) {
  const { addToCart, user } = useUser();
  const { t, sar, err, p: loc } = useI18n();
  const lp = loc(product);
  const toast = useToast();
  const saved = user.sizes[product.tryon_category] ?? null;
  const [size, setSize] = useState<string | null>(saved && product.sizes.includes(saved) ? saved : null);
  const [qty, setQty] = useState(1);
  const [guide, setGuide] = useState(false);
  const [adding, setAdding] = useState(false);
  const shake = useAnimationControls();
  const colour = product.colors[0];

  const add = async () => {
    if (!size) {
      toast(t("t.pickSize"), "error");
      shake.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.45 } });
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, size, qty, colour?.name);
      toast(`${t("t.addedBag", { name: lp.name, size })} × ${qty}`, "bag");
    } catch (e) { toast(err((e as Error).message), "error"); }
    setAdding(false);
  };

  return (
    <div className="grid gap-10 pt-6 md:grid-cols-[1.15fr_1fr] md:gap-14">
      <Stage product={product} />

      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }} className="flex flex-col">
        {[
          <p key="c" className="eyebrow">{lp.category}</p>,
          <h1 key="n" className="title mt-2">{lp.name}</h1>,
          <p key="p" className="mt-3 text-xl font-medium">{sar(product.price_sar)}</p>,
          <p key="d" className="mt-4 leading-relaxed text-muted-foreground">{lp.description}</p>,
          <div key="ch" className="mt-4 flex flex-wrap gap-2">
            {lp.details.map((d) => <span key={d} className="glass rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{d}</span>)}
          </div>,
          <div key="col" className="mt-7">
            <p className="eyebrow mb-2.5">{t("c.colour")}</p>
            <div className="flex items-center gap-3"><Swatches product={product} large /><span className="text-sm">{lp.colorName ?? colour?.name}</span></div>
          </div>,
          <div key="sz" className="mt-7">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="eyebrow">{t("c.size")}{saved && size === saved ? t("p.savedSize") : ""}</p>
              <button onClick={() => setGuide(true)} className="group flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                <Ruler className="size-3.5 transition-transform group-hover:-rotate-12" /> {t("p.sizeGuide")}
              </button>
            </div>
            <motion.div animate={shake} dir="ltr" className="grid grid-cols-6 gap-1.5">
              {product.sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)}
                  className={cn("relative h-11 rounded-xl border text-[13px] font-semibold transition-colors duration-300", size === s ? "border-transparent text-white" : "glass border-border hover:border-brand-violet")}>
                  {size === s && <motion.span layoutId="size-pick" transition={SPRING} className="absolute inset-0 -z-0 rounded-xl bg-brand shadow-[0_8px_24px_-10px_rgba(184,137,78,.9)]" />}
                  <span className="relative">{s}</span>
                </button>
              ))}
            </motion.div>
          </div>,
          <div key="q" className="mt-7">
            <p className="eyebrow mb-2.5">{t("c.quantity")}</p>
            <div dir="ltr" className="glass inline-flex h-11 items-center rounded-xl border border-border">
              <button aria-label={t("c.less")} onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"><Minus className="size-4" /></button>
              <motion.span key={qty} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-8 text-center text-sm font-semibold">{qty}</motion.span>
              <button aria-label={t("c.more")} onClick={() => setQty((q) => Math.min(10, q + 1))} className="flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"><Plus className="size-4" /></button>
            </div>
          </div>,
          <div key="b" className="mt-8 grid grid-cols-[1fr_1fr_48px] gap-2">
            <ButtonLink href={`/try-on?product=${product.id}`} size="lg">{t("c.tryon")} <Arrow /></ButtonLink>
            <Button variant="secondary" size="lg" onClick={add} disabled={adding}>{adding ? t("c.adding") : t("c.addToBag")}</Button>
            <FavoriteButton productId={product.id} className="h-12" />
          </div>,
          <p key="s" className="mt-5 text-xs text-muted-foreground">{t("p.delivery")}</p>,
        ].map((node, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}>{node}</motion.div>
        ))}
      </motion.div>

      <Dialog open={guide} onClose={() => setGuide(false)} title={t("p.sizeGuide")}>
        <p className="mb-4 text-sm text-muted-foreground">{t("p.guideText")}</p>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-start text-xs uppercase tracking-wider text-muted-foreground">{[t("c.size"), t("p.chest"), t("p.length"), t("p.sleeve")].map((h) => <th key={h} className="py-2 text-start font-semibold">{h}</th>)}</tr></thead>
          <tbody>{SIZE_GUIDE.map((r) => <tr key={r[0]} className={cn("border-b border-border", r[0] === size && "bg-brand-violet/15")}>{r.map((c, i) => <td key={i} className="py-2.5">{c}</td>)}</tr>)}</tbody>
        </table>
      </Dialog>
    </div>
  );
}
