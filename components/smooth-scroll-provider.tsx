"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import "lenis/dist/lenis.css";

const heavyInertia = {
  lerp: 0.048,
  duration: 1.7,
  smoothWheel: true,
  wheelMultiplier: 0.68,
  touchMultiplier: 1.05,
  syncTouch: false,
  autoRaf: true,
} as const;

const instantScroll = {
  lerp: 1,
  duration: 0,
  smoothWheel: false,
  autoRaf: true,
} as const;

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <ReactLenis root options={reduceMotion ? instantScroll : heavyInertia}>
      {children}
    </ReactLenis>
  );
}
