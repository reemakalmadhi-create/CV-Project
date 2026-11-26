"use client";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/toast";
import { ButtonLink } from "@/components/ui/button";
import { useUser } from "@/components/user-context";
import type { Product } from "@/lib/catalog";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Swatches({ product, large }: { product: Product; large?: boolean }) {
  return (
    <span className="inline-flex gap-1.5">
      {product.colors.map((c) => (
        <span key={c.name} title={c.name} className={cn("inline-block rounded-full border border-black/15", large ? "size-6" : "size-3")} style={{ background: c.hex }} />
      ))}
    </span>
  );
}

export function FavoriteButton({ productId, className }: { productId: string; className?: string }) {
  const { isFavorite, toggleFavorite } = useUser();
  const { t, err } = useI18n();
  const toast = useToast();
  const fav = isFavorite(productId);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      transition={SPRING}
      aria-pressed={fav}
      aria-label={fav ? t("p.favRemove") : t("p.favAdd")}
      onClick={async () => {
        try {
          const now = await toggleFavorite(productId);
          toast(now ? t("t.savedFav") : t("t.removedFav"), "heart");
        } catch (e) { toast(err((e as Error).message), "error"); }
      }}
      className={cn("flex h-11 items-center justify-center border border-border bg-card transition-colors hover:border-brand-violet", className)}
    >
      <motion.span key={String(fav)} initial={{ scale: fav ? 0.5 : 1 }} animate={{ scale: [fav ? 0.5 : 1, fav ? 1.25 : 1, 1] }} transition={{ duration: 0.45 }}>
        <Heart className={cn("size-[18px] transition-colors", fav && "fill-[#b8894e] text-[#b8894e]")} strokeWidth={1.8} />
      </motion.span>
    </motion.button>
  );
}

/** Card with CSS-3D depth: tilts toward the pointer, glare follows it, the garment floats forward. */
export function ProductCard({ product: raw, showTryOn = true, priority = false }: { product: Product; showTryOn?: boolean; priority?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { t, p, sar } = useI18n();
  const product = p(raw);
  const px = useMotionValue(0.5), py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-8, 8]), { stiffness: 200, damping: 20 });
  const gx = useTransform(px, (v) => `${v * 100}%`), gy = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,.6), transparent 55%)`;

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width); py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => { px.set(0.5); py.set(0.5); }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className="glass group flex flex-col border border-border transition-[border-color,box-shadow] duration-500 [transform-style:preserve-3d] hover:border-brand-violet/60 hover:shadow-[0_32px_70px_-30px_rgba(70,50,25,.65)]"
    >
      <Link href={`/product/${product.id}`} className="showroom relative block aspect-[4/5] overflow-hidden [transform-style:preserve-3d]">
        <span className="absolute start-3 top-3 z-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{product.category}</span>
        <span className="absolute inset-[6%_8%] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] [transform:translateZ(30px)] group-hover:[transform:translateZ(30px)_scale(1.05)]">
          <Image src={product.image} alt={product.name} fill priority={priority} sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 280px" className="object-contain" />
        </span>
        <motion.span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glare }} />
      </Link>
      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3.5">
        <Link href={`/product/${product.id}`} className="text-sm font-semibold leading-snug transition-colors hover:text-muted-foreground">{product.name}</Link>
        <div className="mb-4 mt-1.5 flex items-center justify-between">
          <span className="text-[13.5px]">{sar(product.price_sar)}</span>
          <Swatches product={product} />
        </div>
        <div className={cn("mt-auto grid gap-2", showTryOn ? "grid-cols-2 sm:grid-cols-[1fr_1fr_44px]" : "grid-cols-[1fr_44px]")}>
          <ButtonLink href={`/product/${product.id}`} variant="secondary" size="sm" className="h-11">{t("c.view")}</ButtonLink>
          {showTryOn && <ButtonLink href={`/try-on?product=${product.id}`} size="sm" className="h-11">{t("c.tryon")}</ButtonLink>}
          <FavoriteButton productId={product.id} className={showTryOn ? "col-span-2 sm:col-span-1" : ""} />
        </div>
      </div>
    </motion.div>
  );
}

export function ProductGrid({ products, showTryOn = true }: { products: Product[]; showTryOn?: boolean }) {
  return (
    <motion.div
      layout
      className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {products.map((p, i) => (
        <motion.div
          key={p.id}
          layout
          variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } }}
        >
          <ProductCard product={p} showTryOn={showTryOn} priority={i < 4} />
        </motion.div>
      ))}
    </motion.div>
  );
}
