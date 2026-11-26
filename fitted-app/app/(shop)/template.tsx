"use client";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";

/**
 * Page transition: every navigation re-mounts this template, so each page
 * enters with a soft fade + rise + settle. The navbar lives in the layout,
 * outside this template, so it stays perfectly still between pages.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
