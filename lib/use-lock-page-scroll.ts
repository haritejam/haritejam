"use client";

import { useLenis } from "lenis/react";
import { useEffect } from "react";

export function useLockPageScroll(locked: boolean) {
  const lenis = useLenis();

  useEffect(() => {
    if (!locked) {
      return;
    }
    const html = document.documentElement;
    const previousBody = document.body.style.overflow;
    const previousHtml = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      document.body.style.overflow = previousBody;
      html.style.overflow = previousHtml;
      lenis?.start();
    };
  }, [locked, lenis]);
}
