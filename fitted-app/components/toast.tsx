"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleAlert, Heart, ShoppingBag } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { EASE } from "@/lib/motion";

type Kind = "success" | "error" | "bag" | "heart";
interface Toast { id: number; message: string; kind: Kind }
const ToastCtx = createContext<(message: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

const ICON = { success: Check, error: CircleAlert, bag: ShoppingBag, heart: Heart };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, kind: Kind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex flex-col items-center gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICON[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.2 } }}
                transition={{ duration: 0.45, ease: EASE }}
                className={`pointer-events-auto mx-4 flex items-center gap-2.5 rounded-full border px-4 py-3 text-[13px] font-medium text-white shadow-[0_18px_40px_-18px_rgba(70,50,25,.8)] backdrop-blur-xl ${t.kind === "error" ? "border-red-700 bg-red-700" : "border-white/10 bg-[#2e2217]/95"}`}
              >
                <Icon className={`size-4 shrink-0 ${t.kind === "error" ? "text-white" : "text-[#f3df95]"}`} strokeWidth={2} />
                {t.message}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
