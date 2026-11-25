"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { Key } from "@/lib/i18n";
import { EASE } from "@/lib/motion";

/** Eyebrow + big title with a masked rise, used at the top of every page. */
export function PageHeader({ eyebrow, title, children }: { eyebrow: Key; title: Key; children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <header className="pb-8 pt-10">
      <motion.p className="eyebrow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>{t(eyebrow)}</motion.p>
      <h1 className="display mt-3 overflow-hidden pb-1 text-[clamp(2rem,4vw,3.3rem)]">
        <motion.span className="inline-block" initial={{ y: "110%" }} animate={{ y: "0%" }} transition={{ duration: 1, ease: EASE, delay: 0.05 }}>{t(title)}</motion.span>
      </h1>
      {children}
    </header>
  );
}

/** Model status pill (pending / connected). */
export function ModelStatus({ connected, model }: { connected: boolean; model: string }) {
  const { t } = useI18n();
  return (
    <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] backdrop-blur">
      <span className={`size-2 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "animate-pulse bg-amber-400 shadow-[0_0_10px_#fbbf24]"}`} />
      {connected ? t("status.connected") : t("status.pending", { model })}
    </p>
  );
}
