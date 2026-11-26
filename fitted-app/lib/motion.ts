/** One motion language for the whole site (Framer Motion). */
export const EASE = [0.16, 1, 0.3, 1] as const; // expo-out: fast start, soft landing
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;
export const SPRING = { type: "spring", stiffness: 420, damping: 32, mass: 0.6 } as const;
export const SOFT_SPRING = { type: "spring", stiffness: 180, damping: 22 } as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};
export const stagger = (gap = 0.07, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
