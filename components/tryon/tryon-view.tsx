"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LottieIcon } from "@/components/lottie";
import { useToast } from "@/components/toast";
import { PhotoUploader, type Photo } from "@/components/tryon/photo-uploader";
import { ResultViewer } from "@/components/tryon/result-viewer";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/user-context";
import { CATEGORY_LABELS, getProduct, PRODUCTS, type TryOnCategory } from "@/lib/catalog";
import { MODEL } from "@/lib/model-info";
import { dataUrlToBlob, MODEL_H, MODEL_W } from "@/lib/image-checks";
import { EASE } from "@/lib/motion";

type Outcome =
  | { status: "pending"; message: string; detail: string }
  | { status: "error"; message: string; detail?: string }
  | { status: "ok"; image: string };

const PHOTO_KEY = "fitted-tryon-photo";

function Step({ n, title }: { n: string; title: string }) {
  return <div className="mb-4 flex items-center gap-3"><span className="keep-tracking flex size-7 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">{n}</span><span className="font-semibold">{title}</span></div>;
}

export function TryOnView({ initialProductId, connected }: { initialProductId?: string; connected: boolean }) {
  const toast = useToast();
  const { setUser } = useUser();
  const { t, sar, err, p: loc } = useI18n();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [productId, setProductId] = useState(getProduct(initialProductId)?.id ?? "");
  const product = getProduct(productId);
  const lp = product ? loc(product) : null;
  const [category, setCategory] = useState<TryOnCategory>(product?.tryon_category ?? "upper_body");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  // keep the photo while you browse other garments in this tab
  useEffect(() => { try { const s = sessionStorage.getItem(PHOTO_KEY); if (s) setPhoto(JSON.parse(s)); } catch { /* ignore */ } }, []);
  const updatePhoto = (p: Photo | null) => {
    setPhoto(p); setOutcome(null);
    try { p ? sessionStorage.setItem(PHOTO_KEY, JSON.stringify(p)) : sessionStorage.removeItem(PHOTO_KEY); } catch { /* storage full */ }
  };
  useEffect(() => { if (product) setCategory(product.tryon_category); setOutcome(null); }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    const missing = [!photo && t("t.yourPhoto"), !product && t("t.aGarment")].filter(Boolean);
    if (missing.length) { toast(t("t.addFirst", { what: missing.join(` ${t("t.and")} `) }), "error"); return; }
    setBusy(true); setOutcome(null);
    const started = Date.now();
    try {
      const form = new FormData();
      form.set("person", dataUrlToBlob(photo!.url), "person.jpg");
      form.set("productId", product!.id);
      form.set("category", category);
      const res = await fetch("/api/tryon", { method: "POST", body: form });
      const data = await res.json();
      await new Promise((r) => setTimeout(r, Math.max(0, 1200 - (Date.now() - started)))); // let the loader be read
      if (!res.ok) setOutcome({ status: "error", message: data.error ? err(data.error) : t("to.failed") });
      else {
        if (data.user) setUser(data.user);
        setOutcome(data.status === "ok" ? { status: "ok", image: data.image } : data);
      }
    } catch {
      setOutcome({ status: "error", message: t("to.reach") });
    }
    setBusy(false);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr_1.15fr]">
      {/* 01 photo */}
      <section><Step n="01" title={t("to.step1")} /><PhotoUploader photo={photo} onChange={updatePhoto} /></section>

      {/* 02 garment */}
      <section>
        <Step n="02" title={t("to.step2")} />
        <select value={productId} onChange={(e) => setProductId(e.target.value)}
          className="glass mb-3 h-11 w-full rounded-xl border border-border px-3 text-sm outline-none transition-colors hover:border-brand-violet focus:border-brand-violet">
          <option value="" disabled>{t("to.choose")}</option>
          {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{loc(p).name}</option>)}
        </select>
        <AnimatePresence mode="wait">
          {product ? (
            <motion.div key={product.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.45, ease: EASE }}>
              <div className="showroom relative aspect-[3/4] overflow-hidden rounded-2xl">
                <span className="absolute start-3 top-3 z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("to.selected")}</span>
                <Image src={product.image} alt={lp!.name} fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-contain p-[6%] drop-shadow-[0_24px_24px_rgba(20,10,60,.2)]" />
              </div>
              <p className="mt-3 font-semibold">{lp!.name}</p>
              <p className="mb-4 text-xs text-muted-foreground">{sar(product.price_sar)} · {lp!.category}</p>
              <label className="eyebrow mb-2 block">{t("to.category")}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as TryOnCategory)}
                className="glass h-11 w-full rounded-xl border border-border px-3 text-sm outline-none transition-colors hover:border-brand-violet focus:border-brand-violet">
                {(Object.keys(CATEGORY_LABELS) as TryOnCategory[]).map((c) => <option key={c} value={c}>{t(`to.cat.${c}`)}</option>)}
              </select>
            </motion.div>
          ) : (
            <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{t("to.none")}</p>
              <p>{t("to.noneText")}</p>
              <Link href="/closet" className="mt-2 rounded-full border border-brand-violet/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-brand-violet/15">{t("to.browseCloset")}</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 03 generate + result */}
      <section>
        <Step n="03" title={t("to.step3")} />
        <Button full size="lg" onClick={generate} disabled={busy}><Sparkles className="size-4" /> {busy ? t("to.preparing") : t("to.generate")}</Button>
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {busy && (
              <motion.div key="busy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass mb-4 flex flex-col items-center rounded-2xl border border-border py-6">
                <LottieIcon name="processing" size={120} />
                <p className="mt-2 text-sm text-muted-foreground">{t("to.preparingLong")}</p>
              </motion.div>
            )}
            {!busy && outcome?.status === "pending" && (
              <motion.div key="pending" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}
                className="glass mb-4 rounded-2xl border border-amber-300 p-5">
                <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-800"><span className="size-2 animate-pulse rounded-full bg-amber-400" /> {t("to.pending")}</p>
                <h4 className="font-semibold">{t("to.ready")}</h4>
                <ul className="mt-2 space-y-1 text-[13px] text-muted-foreground">
                  <li><span className="text-brand-violet">✓</span> {t("to.readyPhoto", { w: MODEL_W, h: MODEL_H })}</li>
                  <li><span className="text-brand-violet">✓</span> {t("to.readyGarment", { name: lp?.name ?? "" })}</li>
                  <li><span className="text-brand-violet">✓</span> {t("to.readyCat")} — <code className="text-xs">{category}</code></li>
                </ul>
                <p className="mt-3 text-[13px]">{t("to.nextPhase", { model: MODEL.NAME })}</p>
                {outcome.detail && <p className="mt-3 border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">{outcome.detail}</p>}
              </motion.div>
            )}
            {!busy && outcome?.status === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <LottieIcon name="error" size={48} /> {outcome.message}
              </motion.div>
            )}
          </AnimatePresence>
          <ResultViewer
            result={outcome?.status === "ok" ? outcome.image : null}
            before={photo?.url ?? null}
            fileName={`fitted-tryon-${product?.id ?? "look"}.png`}
          />
        </div>
        {!connected && <p className="mt-4 text-xs text-muted-foreground">{t("to.modelStatus", { model: MODEL.NAME })} <Link href="/about" className="text-brand-violet underline underline-offset-4">{t("to.learn")}</Link></p>}
      </section>
    </div>
  );
}
