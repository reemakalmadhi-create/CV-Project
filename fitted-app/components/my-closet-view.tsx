"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LottieIcon } from "@/components/lottie";
import { Reveal } from "@/components/reveal";
import { useToast } from "@/components/toast";
import { PosePicker } from "@/components/tryon/pose-picker";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/user-context";
import { CATEGORY_LABELS, type TryOnCategory } from "@/lib/catalog";
import { deleteGarment, mediaUrl, renameGarment, saveGarment } from "@/lib/client-api";
import { prepareGarment } from "@/lib/image-checks";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const field = "glass h-11 w-full rounded-xl border border-border px-3 text-sm outline-none transition-colors hover:border-brand-violet focus:border-brand-violet";

/** Upload a garment photo (e.g. a hoodie saved from a shop website) to "My closet". */
function GarmentUploader() {
  const { setUser } = useUser();
  const { t, err } = useI18n();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TryOnCategory>("upper_body");
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    setProblem(null);
    const r = await prepareGarment(file);
    if ("error" in r) { setProblem(t(r.error)); return; }
    setUrl(r.url);
    if (!name) setName(file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").slice(0, 60));
  };

  const save = async () => {
    if (!url) return;
    setBusy(true);
    try {
      const data = await saveGarment(url, name, category);
      setUser(data.user);
      toast(t("mc.added"));
      setUrl(null); setName(""); setCategory("upper_body");
    } catch (e) {
      toast(err(e instanceof Error ? e.message : "Something went wrong."), "error");
    }
    setBusy(false);
  };

  return (
    <div className="glass rounded-[26px] border border-border p-5 sm:p-7">
      <h2 className="text-xl font-semibold">{t("mc.addT")}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{t("mc.addHelp")}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,240px)_1fr]">
        <motion.button type="button" onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}
          animate={{ scale: over ? 1.015 : 1 }}
          className={cn("showroom relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border border-dashed text-center transition-colors",
            over ? "border-brand-violet bg-brand-violet/10" : "border-black/20 hover:border-brand-violet")}>
          {url ? <img src={url} alt="" className="absolute inset-0 size-full object-contain p-[6%]" /> : (
            <>
              <LottieIcon name="upload" size={72} />
              <span className="px-4 text-sm font-semibold">{t("mc.drop")}</span>
              <span className="text-xs text-muted-foreground">{t("to.or")} <span className="text-brand-violet underline underline-offset-4">{t("to.browse")}</span></span>
            </>
          )}
        </motion.button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />
        <div className="flex flex-col gap-3">
          <label className="eyebrow block">{t("mc.name")}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t("mc.namePh")} className={field} />
          <label className="eyebrow mt-1 block">{t("to.category")}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as TryOnCategory)} className={field}>
            {(Object.keys(CATEGORY_LABELS) as TryOnCategory[]).map((c) => <option key={c} value={c}>{t(`to.cat.${c}`)}</option>)}
          </select>
          <p className="text-xs text-amber-700">{t("mc.catNote")}</p>
          {problem && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">{problem}</p>}
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Button onClick={save} disabled={!url || busy}><Plus className="size-4" /> {busy ? t("mc.saving") : t("mc.save")}</Button>
            {url && <Button variant="secondary" onClick={() => input.current?.click()}>{t("mc.change")}</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyClosetView() {
  const { user, setUser } = useUser();
  const { t, err } = useI18n();
  const toast = useToast();

  const remove = async (id: string, name: string) => {
    if (!window.confirm(t("mc.confirmDelete", { name }))) return;
    try { setUser((await deleteGarment(id)).user); toast(t("mc.deleted")); }
    catch (e) { toast(err(e instanceof Error ? e.message : "Something went wrong."), "error"); }
  };
  const rename = async (id: string, current: string) => {
    const name = window.prompt(t("mc.rename"), current)?.trim();
    if (!name || name === current) return;
    try { setUser((await renameGarment(id, name)).user); toast(t("mc.renamed")); }
    catch (e) { toast(err(e instanceof Error ? e.message : "Something went wrong."), "error"); }
  };

  return (
    <div className="space-y-14">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Reveal><GarmentUploader /></Reveal>
        <Reveal>
          <div className="glass rounded-[26px] border border-border p-5 sm:p-7">
            <h2 className="mb-2 text-xl font-semibold">{t("ps.title")}</h2>
            <PosePicker cols={4} />
          </div>
        </Reveal>
      </div>

      <section>
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="title">{t("mc.mineT")}</h2>
          <span className="text-xs text-muted-foreground">{t("mc.count", { n: user.garments.length })}</span>
        </div>
        {user.garments.length === 0 ? (
          <div className="glass flex flex-col items-center rounded-[26px] border border-dashed border-black/15 py-12 text-center">
            <LottieIcon name="empty_favorites" size={110} />
            <h3 className="mt-2 text-lg font-medium">{t("mc.emptyT")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("mc.empty")}</p>
          </div>
        ) : (
          <motion.ul layout className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <AnimatePresence initial={false}>
              {user.garments.map((g) => (
                <motion.li key={g.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.45, ease: EASE }}>
                  <div className="showroom relative aspect-[3/4] overflow-hidden rounded-2xl">
                    <img src={mediaUrl(g.file)} alt={g.name} loading="lazy" className="size-full object-contain p-[6%]" />
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{g.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{t(`to.cat.${g.category}`).split(" — ")[0]}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => rename(g.id, g.name)} aria-label={t("mc.rename")} title={t("mc.rename")} className="p-1.5 text-muted-foreground transition-colors hover:text-foreground"><Pencil className="size-3.5" /></button>
                      <button type="button" onClick={() => remove(g.id, g.name)} aria-label={t("mc.delete")} title={t("mc.delete")} className="p-1.5 text-muted-foreground transition-colors hover:text-red-600"><Trash2 className="size-3.5" /></button>
                    </div>
                  </div>
                  <Link href={`/try-on?garment=${g.id}`}
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-brand text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-[filter] hover:brightness-110">
                    <Sparkles className="size-3.5" /> {t("c.tryon")}
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </section>
    </div>
  );
}
