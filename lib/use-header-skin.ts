"use client";

import { useEffect, useRef, useState } from "react";

export type HeaderSkin = "dark" | "canvas" | "surface";

export function useHeaderSkin() {
  const headerRef = useRef<HTMLElement>(null);
  const [skin, setSkin] = useState<HeaderSkin>("canvas");
  const point = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function read(x: number, y: number) {
      const headerBottom = headerRef.current?.getBoundingClientRect().bottom ?? 72;
      const sampleX = Math.min(window.innerWidth - 1, Math.max(0, x));
      const sampleY =
        y <= headerBottom ? Math.min(window.innerHeight - 1, headerBottom + 8) : Math.min(window.innerHeight - 1, Math.max(0, y));
      const node = document.elementFromPoint(sampleX, sampleY)?.closest("[data-header-skin]");
      const next = (node?.getAttribute("data-header-skin") as HeaderSkin | null) ?? "canvas";
      setSkin((current) => (current === next ? current : next));
    }

    point.current = { x: window.innerWidth / 2, y: 80 };
    read(point.current.x, point.current.y);

    function onPointer(event: PointerEvent) {
      point.current = { x: event.clientX, y: event.clientY };
      read(event.clientX, event.clientY);
    }

    function onScroll() {
      read(point.current.x, point.current.y);
    }

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return { skin, headerRef };
}
