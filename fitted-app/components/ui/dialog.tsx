"use client";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { lockScroll } from "@/components/smooth-scroll";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Dialog({
  open, onClose, title, children, className,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const id = useId();
  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { lockScroll(false); window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={id}>
          <motion.div
            className="absolute inset-0 bg-[#3a2c1c]/25 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            data-lenis-prevent
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.2 } }}
            transition={{ duration: 0.55, ease: EASE }}
            className={cn("relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[24px] border border-black/10 bg-[#fffdf8]/97 p-6 shadow-[0_40px_100px_-40px_rgba(70,50,25,.7)] backdrop-blur-xl sm:p-7", className)}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 id={id} className="text-lg font-medium tracking-tight">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="text-muted-foreground transition-colors hover:text-foreground">
                <X className="size-5 transition-transform duration-300 hover:rotate-90" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
