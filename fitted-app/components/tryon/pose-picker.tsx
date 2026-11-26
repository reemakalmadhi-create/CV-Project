"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/toast";
import { PhotoUploader, type Photo } from "@/components/tryon/photo-uploader";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/user-context";
import { deletePose, mediaUrl, savePose } from "@/lib/client-api";
import { EASE, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

const MAX_POSES = 12;

/**
 * "My poses": saved photos of the user. With `onSelect`, tapping a pose toggles it
 * (several can be chosen — the garment is tried on each one).
 */
export function PosePicker({ selected = [], onSelect, cols = 3 }: { selected?: string[]; onSelect?: (ids: string[]) => void; cols?: 3 | 4 }) {
  const { user, setUser } = useUser();
  const { t, err } = useI18n();
  const toast = useToast();
  const [adding, setAdding] = useState(user.poses.length === 0);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);
  const selectable = Boolean(onSelect);

  const toggle = (id: string) => onSelect?.(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const save = async () => {
    if (!photo) return;
    setBusy(true);
    try {
      const data = await savePose(photo.url);
      setUser(data.user);
      toast(t("ps.saved"));
      if (onSelect) onSelect([...selected, data.pose.id]);
      setPhoto(null); setAdding(false);
    } catch (e) {
      toast(err(e instanceof Error ? e.message : "Something went wrong."), "error");
    }
    setBusy(false);
  };

  const remove = async (id: string) => {
    if (!window.confirm(t("ps.confirmDelete"))) return;
    try {
      const data = await deletePose(id);
      setUser(data.user);
      onSelect?.(selected.filter((s) => s !== id));
      toast(t("ps.deleted"));
    } catch (e) {
      toast(err(e instanceof Error ? e.message : "Something went wrong."), "error");
    }
  };

  return (
    <div>
      <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">{t("ps.help")}</p>
      {user.poses.length > 0 && (
        <>
          <motion.ul layout className={cn("grid gap-2.5", cols === 4 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3")}>
            <AnimatePresence initial={false}>
              {user.poses.map((p, i) => {
                const on = selected.includes(p.id);
                return (
                  <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.35, ease: EASE }}
                    className="group relative">
                    <button type="button" onClick={() => toggle(p.id)} disabled={!selectable} aria-pressed={selectable ? on : undefined}
                      aria-label={t("ps.pose", { n: user.poses.length - i })}
                      className={cn("showroom relative block aspect-[3/4] w-full overflow-hidden rounded-xl border-2 transition-[border-color,transform] duration-300",
                        on ? "border-brand" : "border-transparent", selectable && "cursor-pointer hover:-translate-y-0.5")}>
                      <img src={mediaUrl(p.file)} alt="" loading="lazy" className="size-full object-cover" />
                      <AnimatePresence>
                        {on && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={SPRING}
                            className="absolute end-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-brand text-white shadow">
                            <Check className="size-3.5" strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                    <button type="button" onClick={() => remove(p.id)} aria-label={t("ps.delete")} title={t("ps.delete")}
                      className="absolute bottom-1.5 end-1.5 flex size-7 items-center justify-center rounded-full bg-background/85 text-muted-foreground opacity-100 shadow-sm backdrop-blur transition-colors hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100">
                      <Trash2 className="size-3.5" />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {!adding && user.poses.length < MAX_POSES && (
              <motion.li layout>
                <button type="button" onClick={() => setAdding(true)}
                  className="glass flex aspect-[3/4] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/20 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-brand-violet hover:text-foreground">
                  <Plus className="size-5" /> {t("ps.add")}
                </button>
              </motion.li>
            )}
          </motion.ul>
          <p className="mt-2 text-xs text-muted-foreground">
            {selectable ? t("ps.selected", { n: selected.length }) : t("ps.max", { n: MAX_POSES })}
          </p>
        </>
      )}

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
            <div className={cn(user.poses.length > 0 && "mt-5 border-t border-border pt-5")}>
              {user.poses.length > 0 && (
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">{t("ps.add")}</span>
                  <button type="button" onClick={() => { setAdding(false); setPhoto(null); }} aria-label={t("c.close")} className="p-1 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                </div>
              )}
              <PhotoUploader photo={photo} onChange={setPhoto} />
              {photo && <Button full className="mt-3" onClick={save} disabled={busy}><Plus className="size-4" /> {busy ? t("ps.saving") : t("ps.save")}</Button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
