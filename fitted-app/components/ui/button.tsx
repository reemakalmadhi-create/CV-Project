"use client";
import { motion, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import { forwardRef, type ReactNode } from "react";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "icon";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex select-none rounded-full items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-semibold uppercase tracking-[0.12em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40";
const variants: Record<Variant, string> = {
  // brand button: blue→violet gradient, white label, a light sheen sweeps across + soft glow on hover
  primary: "bg-brand text-white shadow-[0_10px_30px_-14px_rgba(70,50,25,.9)] hover:shadow-[0_16px_40px_-12px_rgba(184,137,78,.85)]",
  // outline: fills with the text colour from the bottom on hover (white on dark, dark inside .showroom)
  secondary: "border border-foreground/30 text-foreground hover:border-foreground hover:text-background",
  ghost: "text-muted-foreground normal-case tracking-normal font-medium hover:text-foreground",
  icon: "border border-border bg-card text-foreground hover:border-brand-violet",
};
const sizes: Record<Size, string> = { sm: "h-9 px-3.5 text-[11px]", md: "h-11 px-5 text-[11.5px] sm:px-6", lg: "h-12 px-5 text-[12px] sm:px-8" };

function Decor({ variant }: { variant: Variant }) {
  if (variant === "primary")
    return <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/25 opacity-0 transition-[left,opacity] duration-700 ease-out group-hover:left-[120%] group-hover:opacity-100" />;
  if (variant === "secondary")
    return <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 origin-bottom scale-y-0 bg-foreground transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-y-100" />;
  return null;
}

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant; size?: Size; children?: ReactNode; full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, children, full, ...props }, ref,
) {
  return (
    <motion.button
      ref={ref}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={SPRING}
      className={cn(base, variants[variant], variant !== "icon" && sizes[size], variant === "icon" && "size-11", full && "w-full", "isolate", className)}
      {...props}
    >
      <Decor variant={variant} />
      {children}
    </motion.button>
  );
});

const MotionLink = motion.create(Link);

export function ButtonLink({
  href, variant = "primary", size = "md", className, children, full,
}: { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode; full?: boolean }) {
  return (
    <MotionLink
      href={href}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={SPRING}
      className={cn(base, variants[variant], sizes[size], full && "w-full", "isolate", className)}
    >
      <Decor variant={variant} />
      {children}
    </MotionLink>
  );
}

/** Arrow that nudges right when its button is hovered. */
export function Arrow() {
  return <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1">→</span>;
}
