"use client";
import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered entrance (GSAP ScrollTrigger). Content is visible by default;
 * it is only hidden-then-revealed once JS runs, so there's never a blank page.
 * `stagger` animates the direct children one after another.
 */
export function Reveal({
  children, className, y = 28, delay = 0, stagger, once = true, start = "top 88%",
}: { children: ReactNode; className?: string; y?: number; delay?: number; stagger?: number; once?: boolean; start?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const targets = stagger ? Array.from(el.children) : el;
    gsap.from(targets, {
      autoAlpha: 0, y, duration: 1, delay, ease: "power3.out", stagger: stagger ?? 0, clearProps: "transform",
      scrollTrigger: { trigger: el, start, once },
    });
  }, { scope: ref });
  return <div ref={ref} data-reveal className={cn(className)}>{children}</div>;
}
