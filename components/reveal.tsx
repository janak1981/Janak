"use client";

import { motion, useReducedMotion } from "motion/react";

export function Reveal({
  children,
  className,
  delay = 0,
  hover = false,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  ariaLabel?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      className={["reveal", className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.65, delay, ease: "easeOut" }}
      whileHover={hover && !prefersReducedMotion ? { y: -4 } : undefined}
    >
      {children}
    </motion.div>
  );
}
