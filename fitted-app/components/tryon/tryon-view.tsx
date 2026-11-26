"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LottieIcon } from "@/components/lottie";
import { useToast } from "@/components/toast";
import { PosePicker } from "@/components/tryon/pose-picker";
import { ResultViewer } from "@/components/tryon/result-viewer";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/user-context";
import { CATEGORY_LABELS, getProduct, PRODUCTS, type TryOnCategory } from "@/lib/catalog";
import { mediaUrl } from "@/lib/client-api";
import { MODEL } from "@/lib/model-info";
import { MODEL_H, MODEL_W } from "@/lib/image-checks";
import { EASE, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

type JobStatus = "waiting" | "working" | "ok" | "error" | "pending";
interface Job { poseId: string; status: JobStatus; image?: string; message?: string; detail?: string }

function Step({ n, title }: { n: string; title: string }) {
  return <div className="mb-4 flex items-center gap-3"><span className="keep-tracking flex size-7 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">{n}</span><span className="font-semibold">{title}</span></div>;
}

const field = "glass h-11 w-full rounded-xl border border-border px-3 text-sm outline-none transition-colors hover:border-brand-violet focus:border-brand-violet";

export function TryOnView({ initialProductId, initialGarmentId, connected }: { initialProductId?: string; initialGarmentId?: string; connected: boolean }) {
  const toast = useToast();
  const { user, setUser } = useUser();
  const { t, sar, err, p: loc } = useI18n();

  // 01 poses (most recent one pre-selected)
  const [poseIds, setPoseIds] = useState<string[]>(() => (user.poses[0] ? [user.poses[0].id] : []));

  // 02 garment: one of my garments, or a shop product
  const startMine = user.garments.find((g) => g.id === initialGarmentId);
  const startProduct = getProduct(initialProductId);
  const [tab, setTab] = useState<"mine" | "shop">(startMine ? "mine" : startProduct ? "shop" : user.garments.length ? "mine" : "shop");
  const [garmentId, setGarmentId] = useState(startMine?.id ?? "");
  const [productId, setProductId] = useState(startProduct?.id ?? "");
  const mine = tab === "mine" ? user.garments.find((g) => g.id === garmentId) : undefined;
  const product = tab === "shop" ? getProduct(productId) : undefined;
  const lp = product ? loc(product) : null;
  const garmentName = mine?.name ?? lp?.name ?? "";
  const [category, setCategory] = useState<TryOnCategory>(startMine?.category ?? startProduct?.tryon_category ?? "upper_body");

  // 03 results, one per pose
  const [jobs, setJobs] = useState<Job[]>([]);
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const c = mine?.category ?? product?.tryon_category;
    if (c) setCategory(c);
    if (!running) setJobs([]);
  }, [tab, garmentId, productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setJob = (i: number, patch: Partial<Job>) => setJobs((js) => js.map((j, k) => (k === i ? { ...j, ...patch } : j)));

  const generate = async () => {
    const missing = [!poseIds.length && t("to.pickPose"), !mine && !product && t("t.aGarment")].filter(Boolean);
    if (missing.length) { toast(t("t.addFirst", { what: missing.join(` ${t("t.and")} `) }), "error"); return; }
    const ids = user.poses.map((p) => p.id).filter((id) => poseIds.includes(id)); // keep the on-screen order
    setRunning(true);
    setJobs(ids.map((poseId) => ({ poseId, status: "waiting" })));
    setActive(0);
    let shown = false;
    for (let i = 0; i < ids.length; i++) {
      setJob(i, { status: "working" });
      try {
        const form = new FormData();
        form.set("poseId", ids[i]);
        if (mine) form.set("garmentId", mine.id); else form.set("productId", product!.id);
        form.set("category", category);
        const res = await fetch("/api/tryon", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { window.location.href = "/login"; return; }
        if (!res.ok) { setJob(i, { status: "error", message: data.error ? err(data.error) : t("to.failed") }); continue; }
        if (data.user) setUser(data.user);
        if (data.status === "ok") {
          setJob(i, { status: "ok", image: data.image });
          if (!shown) { setActive(i); shown = true; }
        } else if (data.status === "pending") {
          // the model isn't connected: no point asking again for the other poses
          setJobs((js) => js.map((j, k) => (k >= i ? { ...j, status: "pending", message: data.message, detail: data.detail } : j)));
          break;
        } else {
          setJob(i, { status: "error", message: data.message ? err(data.message) : t("to.failed"), detail: data.detail });
        }
      } catch {
        setJob(i, { status: "error", message: t("to.reach") });
      }
    }
    setRunning(false);
  };

  const pending = jobs.find((j) => j.status === "pending");
  const current = jobs[active];
  const poseOf = (id: string) => user.poses.find((p) => p.id === id);
  const workingIndex = jobs.findIndex((j) => j.status === "working");

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr_1.15fr]">
      {/* 01 poses */}
      <section><Step n="01" title={t("ps.title")} /><PosePicker selected={poseIds} onSelect={setPoseIds} /></section>

      {/* 02 garment */}
      <section>
        <Step n="02" title={t("to.step2")} />
        <div className="isolate mb-4 flex gap-1.5">
          {(["mine", "shop"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={cn("relative rounded-full px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300", tab === k ? "text-white" : "text-muted-foreground hover:text-foreground")}>
              {tab === k && <motion.span layoutId="tryon-garment-tab" transition={SPRING} className="absolute inset-0 -z-10 rounded-full bg-brand" />}
              {t(k === "mine" ? "to.tab.mine" : "to.tab.shop")}
            </button>
          ))}
        </div>

        {tab === "mine" ? (
          user.garments.length ? (
            <ul className="mb-4 grid grid-cols-4 gap-2">
              {user.garments.map((g) => (
                <li key={g.id}>
                  <button type="button" onClick={() => setGarmentId(g.id)} title={g.name} aria-pressed={garmentId === g.id}
                    className={cn("showroom relative block aspect-square w-full overflow-hidden rounded-xl border-2 transition-colors", garmentId === g.id ? "border-brand" : "border-transparent hover:border-brand-violet/50")}>
                    <img src={mediaUrl(g.file)} alt={g.name} loading="lazy" className="size-full object-contain p-1.5" />
                    {garmentId === g.id && <span className="absolute end-1 top-1 flex size-5 items-center justify-center rounded-full bg-brand text-white"><Check className="size-3" strokeWidth={3} /></span>}
                  </button>
                </li>
              ))}
              <li>
                <Link href="/my-closet" aria-label={t("to.addGarment")} title={t("to.addGarment")}
                  className="glass flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-black/20 text-muted-foreground transition-colors hover:border-brand-violet hover:text-foreground">
                  <Plus className="size-5" />
                </Link>
              </li>
            </ul>
          ) : (
            <div className="glass mb-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/15 p-6 text-center text-sm text-muted-foreground">
              <p>{t("to.mineEmpty")}</p>
              <Link href="/my-closet" className="rounded-full border border-brand-violet/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-brand-violet/15">{t("to.addGarment")}</Link>
            </div>
          )
        ) : (
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className={cn(field, "mb-3")}>
            <option value="" disabled>{t("to.choose")}</option>
            {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{loc(p).name}</option>)}
          </select>
        )}

        <AnimatePresence mode="wait">
          {mine || product ? (
            <motion.div key={mine?.id ?? product!.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.45, ease: EASE }}>
              <div className="showroom relative aspect-[3/4] overflow-hidden rounded-2xl">
                <span className="absolute start-3 top-3 z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("to.selected")}</span>
                {mine
                  ? <img src={mediaUrl(mine.file)} alt={mine.name} className="absolute inset-0 size-full object-contain p-[6%]" />
                  : <Image src={product!.image} alt={lp!.name} fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-contain p-[6%] drop-shadow-[0_24px_24px_rgba(20,10,60,.2)]" />}
              </div>
              <p className="mt-3 font-semibold">{garmentName}</p>
              <p className="mb-4 text-xs text-muted-foreground">{mine ? t("to.ownGarment") : `${sar(product!.price_sar)} · ${lp!.category}`}</p>
              <label className="eyebrow mb-2 block">{t("to.category")}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as TryOnCategory)} className={field}>
                {(Object.keys(CATEGORY_LABELS) as TryOnCategory[]).map((c) => <option key={c} value={c}>{t(`to.cat.${c}`)}</option>)}
              </select>
            </motion.div>
          ) : (
            <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{t("to.none")}</p>
              <p>{t("to.noneText")}</p>
              <Link href={tab === "mine" ? "/my-closet" : "/closet"} className="mt-2 rounded-full border border-brand-violet/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-brand-violet/15">
                {tab === "mine" ? t("to.addGarment") : t("to.browseCloset")}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 03 generate + results */}
      <section>
        <Step n="03" title={t("to.step3")} />
        <Button full size="lg" onClick={generate} disabled={running}>
          <Sparkles className="size-4" /> {running ? t("to.preparing") : poseIds.length > 1 ? t("to.generateN", { n: poseIds.length }) : t("to.generate1")}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">{t("to.timeHint")}</p>
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {running && (
              <motion.div key="busy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass mb-4 flex flex-col items-center rounded-2xl border border-border py-6">
                <LottieIcon name="processing" size={110} />
                <p className="mt-2 text-sm text-muted-foreground">{t("to.progress", { i: Math.max(1, workingIndex + 1), n: jobs.length })}</p>
              </motion.div>
            )}
            {!running && pending && (
              <motion.div key="pending" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}
                className="glass mb-4 rounded-2xl border border-amber-300 p-5">
                <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-800"><span className="size-2 animate-pulse rounded-full bg-amber-400" /> {t("to.pending")}</p>
                <h4 className="font-semibold">{t("to.ready")}</h4>
                <ul className="mt-2 space-y-1 text-[13px] text-muted-foreground">
                  <li><span className="text-brand-violet">✓</span> {t("to.readyPhoto", { w: MODEL_W, h: MODEL_H })}</li>
                  <li><span className="text-brand-violet">✓</span> {t("to.readyGarment", { name: garmentName })}</li>
                  <li><span className="text-brand-violet">✓</span> {t("to.readyCat")} — <code className="text-xs">{category}</code></li>
                </ul>
                <p className="mt-3 text-[13px]">{t("to.nextPhase", { model: MODEL.NAME })}</p>
                {pending.detail && <p className="mt-3 border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">{pending.detail}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {current?.status === "error" && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <LottieIcon name="error" size={44} /> {current.message}
            </div>
          )}

          <ResultViewer
            key={active}
            result={current?.status === "ok" ? current.image! : null}
            before={current ? mediaUrl(poseOf(current.poseId)?.file ?? "") : null}
            fileName={`fitted-tryon-${mine ? "my-garment" : product?.id ?? "look"}-${active + 1}.png`}
          />

          {jobs.length > 1 && (
            <div className="mt-5">
              <p className="eyebrow mb-2">{t("to.results")}</p>
              <ul className="grid grid-cols-4 gap-2">
                {jobs.map((j, i) => {
                  const pose = poseOf(j.poseId);
                  const label = { waiting: t("to.waiting"), working: t("to.working"), ok: t("to.done"), error: t("to.errorShort"), pending: t("to.pending") }[j.status];
                  return (
                    <li key={j.poseId}>
                      <button type="button" onClick={() => setActive(i)} aria-pressed={active === i}
                        className={cn("showroom relative block aspect-[3/4] w-full overflow-hidden rounded-xl border-2 transition-colors", active === i ? "border-brand" : "border-transparent hover:border-brand-violet/50")}>
                        <img src={j.image ?? mediaUrl(pose?.file ?? "")} alt="" className={cn("size-full object-cover", j.status !== "ok" && "opacity-50")} />
                        <span className={cn("absolute inset-x-1 bottom-1 rounded-full px-1.5 py-0.5 text-center text-[9px] font-bold uppercase tracking-[0.12em]",
                          j.status === "ok" ? "bg-brand text-white" : j.status === "error" ? "bg-red-600 text-white" : "bg-background/85 text-muted-foreground",
                          j.status === "working" && "animate-pulse")}>{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        {!connected && <p className="mt-4 text-xs text-muted-foreground">{t("to.modelStatus", { model: MODEL.NAME })} <Link href="/about" className="text-brand-violet underline underline-offset-4">{t("to.learn")}</Link></p>}
      </section>
    </div>
  );
}
