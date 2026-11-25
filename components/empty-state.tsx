"use client";
import { motion } from "framer-motion";
import { LottieIcon, type LottieName } from "@/components/lottie";
import { Arrow, ButtonLink } from "@/components/ui/button";
import { EASE } from "@/lib/motion";

export function EmptyState({ animation, title, text, cta, href }: { animation: LottieName; title: string; text: string; cta?: string; href?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}
      className="glass mx-auto flex max-w-md flex-col items-center rounded-[28px] border border-border px-6 py-12 text-center"
    >
      <LottieIcon name={animation} size={150} />
      <h3 className="mt-2 text-xl font-medium tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      {cta && href && <ButtonLink href={href} className="mt-7">{cta} <Arrow /></ButtonLink>}
    </motion.div>
  );
}
