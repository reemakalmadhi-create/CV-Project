"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LottieIcon } from "@/components/lottie";
import { Button } from "@/components/ui/button";
import { checkPhoto, type Check } from "@/lib/image-checks";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface Photo { name: string; url: string; checks: Check[] } // url = prepared 768×1024 JPEG

function Checklist({ checks }: { checks: Check[] }) {
  const { t } = useI18n();
  return (
    <motion.ul initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.05 } } }} className="mt-3 space-y-1 text-[13px]">
      {checks.map((c) => (
        <motion.li key={c.key} variants={{ h: { opacity: 0, x: -6 }, s: { opacity: 1, x: 0 } }}
          className={cn("flex gap-2", c.ok ? "text-foreground" : c.blocking ? "text-red-600" : "text-amber-700")}>
          <span className={cn("w-3", c.ok && "text-brand-violet")}>{c.ok ? "✓" : c.blocking ? "✕" : "!"}</span>{t(c.key, c.vars)}
        </motion.li>
      ))}
    </motion.ul>
  );
}

export function PhotoUploader({ photo, onChange }: { photo: Photo | null; onChange: (p: Photo | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejected, setRejected] = useState<Check[] | null>(null);
  const [fresh, setFresh] = useState(false);
  const { t } = useI18n();

  const handle = async (file?: File) => {
    if (!file) return;
    setBusy(true); setRejected(null);
    const report = await checkPhoto(file);
    setBusy(false);
    if (!report.accepted || !report.preparedUrl) { setRejected(report.checks); return; }
    onChange({ name: file.name, url: report.preparedUrl, checks: report.checks });
    setFresh(true);
    setTimeout(() => setFresh(false), 1600);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!photo ? (
        <motion.div key="drop" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: EASE }}>
          <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
            {t("to.photoHelp")}
          </p>
          <motion.button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}
            animate={{ scale: over ? 1.015 : 1 }}
            className={cn("glass flex w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors duration-300",
              over ? "border-brand-violet bg-brand-violet/10" : "border-black/20 hover:border-brand-violet hover:bg-brand-violet/5")}
          >
            <LottieIcon name={busy ? "processing" : "upload"} size={84} />
            <span className="text-sm font-semibold">{busy ? t("to.checking") : t("to.drop")}</span>
            <span className="text-xs text-muted-foreground">{t("to.or")} <span className="text-brand-violet underline underline-offset-4">{t("to.browse")}</span></span>
          </motion.button>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />
          {rejected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-[13px] font-semibold text-red-700">{t("to.rejected")}</p>
              <Checklist checks={rejected} />
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div key="preview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.45, ease: EASE }}>
          <p className="mb-2 truncate text-xs text-muted-foreground">{photo.name}</p>
          <div className="showroom relative aspect-[3/4] overflow-hidden rounded-2xl">
            <img src={photo.url} alt={t("to.step1")} className="size-full object-contain" />
            <AnimatePresence>
              {fresh && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                  <LottieIcon name="success" size={110} loop={false} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Checklist checks={photo.checks} />
          <Button variant="secondary" full className="mt-4" onClick={() => onChange(null)}><Trash2 className="size-4" /> {t("to.removePhoto")}</Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
