"use client";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Arrow, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Drag the handle to compare the original photo with the try-on result. */
export function CompareSlider({ before, after }: { before: string; after: string }) {
  const [v, setV] = useState(50);
  const { t } = useI18n();
  return (
    <div dir="ltr" className="showroom relative aspect-[3/4] select-none overflow-hidden rounded-2xl">
      <img src={before} alt={t("rv.before")} className="absolute inset-0 size-full object-contain" />
      <img src={after} alt={t("rv.after")} className="absolute inset-0 size-full object-contain" style={{ clipPath: `inset(0 ${100 - v}% 0 0)` }} />
      <div className="absolute inset-y-0 w-0.5 bg-brand" style={{ left: `${v}%` }} />
      <div className="absolute top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-lg" style={{ left: `${v}%` }}>↔</div>
      <span className="absolute left-3 top-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("rv.after")}</span>
      <span className="absolute right-3 top-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("rv.before")}</span>
      <input type="range" min={0} max={100} value={v} onChange={(e) => setV(Number(e.target.value))} aria-label={t("rv.compare")}
        className="absolute inset-0 size-full cursor-ew-resize opacity-0" />
    </div>
  );
}

/**
 * Result area. With result=null: an empty frame, a disabled download and "Try another outfit".
 * As soon as the real model output arrives, the same component shows it + before/after.
 */
export function ResultViewer({ result, before, fileName }: { result: string | null; before: string | null; fileName: string }) {
  const [tab, setTab] = useState<"result" | "compare">("result");
  const { t } = useI18n();
  return (
    <div>
      {result ? (
        <>
          <div className="mb-3 flex gap-5">
            {(["result", "compare"] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={cn("relative pb-1 text-xs font-semibold uppercase tracking-[0.16em]", tab === k ? "text-foreground" : "text-muted-foreground")}>
                {k === "result" ? t("rv.result") : t("rv.compare")}
                {tab === k && <motion.span layoutId="result-tab" className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand" />}
              </button>
            ))}
          </div>
          {tab === "compare" && before
            ? <CompareSlider before={before} after={result} />
            : <motion.img initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} src={result} alt={t("rv.generated")} className="showroom aspect-[3/4] w-full rounded-2xl object-contain" />}
        </>
      ) : (
        <div className="glass relative flex aspect-[3/4] items-center justify-center rounded-2xl border border-dashed border-black/15 p-8 text-center">
          <span className="absolute start-3 top-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("rv.generated")}</span>
          <div className="text-[13px] leading-relaxed text-muted-foreground">
            <p className="mb-1 text-sm font-semibold text-foreground">{t("rv.noResult")}</p>
            {t("rv.noResultText")}
          </div>
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={result ?? undefined}
          download={result ? fileName : undefined}
          aria-disabled={!result}
          title={result ? undefined : t("rv.downloadOff")}
          className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-full border text-[11.5px] font-semibold uppercase tracking-[0.12em] transition-colors",
            result ? "border-transparent bg-brand text-white hover:brightness-110" : "pointer-events-none border-border text-muted-foreground opacity-50")}
        >
          <Download className="size-4" /> {t("rv.download")}
        </a>
        <ButtonLink href="/closet" variant="secondary">{t("rv.another")} <Arrow /></ButtonLink>
      </div>
    </div>
  );
}
