"use client";

import { useEffect, useState } from "react";

export function HeroPoster() {
  const [swapped, setSwapped] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused) {
      return;
    }
    const timer = window.setInterval(() => {
      setSwapped((current) => !current);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [reduceMotion, paused]);

  if (reduceMotion) {
    return (
      <img
        src="/images/flexidine-bg.jpg"
        alt="FlexiDine: plate, clock, and pickup — reserve, pre-order, dine or pickup"
        width={1536}
        height={1024}
      />
    );
  }

  return (
    <div
      className="hero-poster"
      role="img"
      aria-label="FlexiDine FlexiSwitch: dine-in and pickup swap around the clock"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`hero-poster__side${swapped ? " is-far" : ""}`}>
        <img src="/images/flexidine-bg.jpg" alt="" aria-hidden="true" className="hero-poster__crop hero-poster__crop--dine" />
      </div>
      <div className={`hero-poster__side${swapped ? "" : " is-far"}`}>
        <img src="/images/flexidine-bg.jpg" alt="" aria-hidden="true" className="hero-poster__crop hero-poster__crop--pickup" />
      </div>
      <div className="hero-poster__center">
        <img src="/images/flexidine-bg.jpg" alt="" aria-hidden="true" className="hero-poster__crop hero-poster__crop--center" />
      </div>
      <p className="sr-only">{swapped ? "Pickup on the left, dine-in on the right" : "Dine-in on the left, pickup on the right"}</p>
    </div>
  );
}
