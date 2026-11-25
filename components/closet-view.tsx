"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/components/i18n-provider";
import { ProductCard } from "@/components/product-card";
import { categories, categoryLabel, colourNames, PRODUCTS } from "@/lib/catalog";
import { EASE, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SORTS = ["featured", "low", "high", "name"] as const;

export function ClosetView() {
  const { t, lang, p: loc } = useI18n();
  const [cat, setCat] = useState("All");
  const [colours, setColours] = useState<string[]>([]);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("featured");
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    let list = PRODUCTS.filter((p) =>
      (cat === "All" || p.category === cat) &&
      (!colours.length || p.colors.some((c) => colours.includes(c.name))) &&
      (!q.trim() || `${p.name} ${p.description} ${p.category} ${p.ar?.name ?? ""} ${p.ar?.description ?? ""} ${p.ar?.category ?? ""} ${p.ar?.color ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())));
    if (sort === "low") list = [...list].sort((a, b) => a.price_sar - b.price_sar);
    if (sort === "high") list = [...list].sort((a, b) => b.price_sar - a.price_sar);
    if (sort === "name") list = [...list].sort((a, b) => loc(a).name.localeCompare(loc(b).name, lang));
    return list;
  }, [cat, colours, sort, q, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* category pills with a sliding active background */}
      <div className="flex flex-wrap items-center gap-1.5">
        {["All", ...categories()].map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={cn("relative rounded-full px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300", cat === c ? "text-white" : "text-muted-foreground hover:text-foreground")}>
            {cat === c && <motion.span layoutId="closet-cat" transition={SPRING} className="absolute inset-0 -z-10 rounded-full bg-brand shadow-[0_8px_24px_-10px_rgba(184,137,78,.9)]" />}
            {c === "All" ? t("closet.all") : categoryLabel(c, lang)}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="glass group flex h-11 flex-1 items-center gap-2.5 border border-border px-3.5 transition-colors focus-within:border-brand-violet">
          <Search className="size-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("closet.search")}
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          {q && <button onClick={() => setQ("")} aria-label={t("closet.clearSearch")}><X className="size-4 text-muted-foreground hover:text-foreground" /></button>}
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
          className="glass h-11 border border-border px-3 text-sm outline-none transition-colors hover:border-brand-violet focus:border-brand-violet">
          {SORTS.map((s) => <option key={s} value={s}>{t(`closet.sort.${s}`)}</option>)}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="eyebrow me-1">{t("c.colour")}</span>
        {colourNames().map((name) => {
          const owner = PRODUCTS.find((p) => p.colors.some((c) => c.name === name));
          const hex = owner?.colors.find((c) => c.name === name)?.hex;
          const label = lang === "ar" && owner?.ar ? owner.ar.color : name;
          const on = colours.includes(name);
          return (
            <motion.button key={name} whileTap={{ scale: 0.94 }} transition={SPRING}
              onClick={() => setColours((cs) => (on ? cs.filter((c) => c !== name) : [...cs, name]))}
              className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors", on ? "border-transparent bg-brand text-white" : "border-border text-muted-foreground hover:border-brand-violet hover:text-foreground")}>
              <span className="size-3 rounded-full border border-black/15" style={{ background: hex }} />{label}
            </motion.button>
          );
        })}
        {colours.length > 0 && <button onClick={() => setColours([])} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{t("c.clear")}</button>}
      </div>

      <p className="mb-6 mt-6 text-xs text-muted-foreground">{t("closet.count", { n: items.length, total: PRODUCTS.length })}</p>

      {items.length ? (
        <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {items.map((p, i) => (
              <motion.div key={p.id} layout
                initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                transition={{ duration: 0.6, ease: EASE, delay: Math.min(i, 8) * 0.04 }}>
                <ProductCard product={p} priority={i < 4} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState animation="empty_favorites" title={t("closet.emptyT")} text={t("closet.empty")} />
      )}
    </>
  );
}
