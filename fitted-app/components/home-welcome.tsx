"use client";
import { motion } from "framer-motion";
import { useI18n } from "@/components/i18n-provider";
import { Arrow, ButtonLink } from "@/components/ui/button";
import { useUser } from "@/components/user-context";
import { EASE } from "@/lib/motion";

/** Compact welcome at the very top; the rail sits right under it. */
export function HomeWelcome() {
  const { user } = useUser();
  const { t, lang } = useI18n();
  const first = user.name.split(" ")[0];
  const isNew = Date.now() - new Date(user.createdAt).getTime() < 10 * 60_000;
  return (
    <section className="flex flex-col gap-5 pt-8 md:flex-row md:items-end md:justify-between">
      <div>
        <motion.p className="eyebrow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          {t("home.eyebrow")}
        </motion.p>
        <h1 className="mt-2 overflow-hidden pb-1 text-[clamp(1.5rem,2.6vw,2.1rem)] font-normal leading-tight tracking-[-0.03em]">
          <motion.span className="inline-block" initial={{ y: "110%" }} animate={{ y: "0%" }} transition={{ duration: 1, ease: EASE, delay: 0.08 }}>
            {isNew ? t("home.welcome") : t("home.welcomeBack")}{lang === "ar" ? "، " : ", "}<em className="text-brand font-medium not-italic">{first}</em>
          </motion.span>
        </h1>
        <motion.p className="mt-1 text-[15px] text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.35 }}>
          {t("tagline")}
        </motion.p>
      </div>
      <motion.div className="flex flex-wrap gap-2.5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}>
        <ButtonLink href="/closet">{t("home.explore")} <Arrow /></ButtonLink>
        <ButtonLink href="/try-on" variant="secondary">{t("nav.tryon")}</ButtonLink>
      </motion.div>
    </section>
  );
}
