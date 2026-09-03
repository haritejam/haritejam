"use client";

import { LayoutGroup, motion, useInView, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ClockIcon, ClocheIcon, SwitchIcon } from "@/components/icons";
import { Reveal } from "@/components/motion-reveal";

const dine = {
  id: "dine",
  kicker: "7:30 PM",
  title: "Dine-in",
  detail: "Table for two at Serein House",
  image: "/images/serein-house.jpg",
  imageAlt: "Set dining table at Serein House",
};

const pickup = {
  id: "pickup",
  kicker: "Plans changed",
  title: "Pickup",
  detail: "Same kitchen ticket. Collect at the counter.",
  image: "/images/flexidine-pickup-parcel.png",
  imageAlt: "FlexiDine branded kraft parcel ready for pickup",
};

const points = [
  { icon: SwitchIcon, title: "Switch anytime", text: "Change dine-in to pickup in a few taps." },
  { icon: ClocheIcon, title: "Same order", text: "The dishes stay exactly as they were." },
  { icon: ClockIcon, title: "Kitchen queue", text: "Your place with the kitchen is kept." },
];

const spring = { type: "spring" as const, stiffness: 280, damping: 30 };

export function FlexAdvantage() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { amount: 0.45 });
  const [swapped, setSwapped] = useState(false);

  useEffect(() => {
    if (reduce || !inView) {
      return;
    }
    const timer = window.setInterval(() => {
      setSwapped((current) => !current);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [inView, reduce]);

  const left = swapped ? pickup : dine;
  const right = swapped ? dine : pickup;

  return (
    <section id="flexiswitch" className="site-section scroll-mt-24 bg-background" data-header-skin="canvas">
      <Reveal className="site-wrap grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div>
          <h2 className="site-h2">
            Plans change.
            <span className="mt-1 block text-accent">We switch with you.</span>
          </h2>
          <p className="site-lead">
            Move between dine-in and pickup anytime. Same order. Same kitchen. No cancellations.
          </p>
          <ul className="mt-8 space-y-5">
            {points.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.title} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-line bg-surface text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <p className="font-semibold tracking-[-0.02em]">{point.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{point.text}</p>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <LayoutGroup>
          <div ref={stageRef} className="switch-stage">
            <SwitchCard key={left.id} card={left} />
            <div className="switch-hub">
              <svg className="switch-orbit" viewBox="0 0 120 160" aria-hidden="true">
                <motion.path
                  d="M22 28 C 60 8, 60 8, 98 28"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="4 6"
                  animate={reduce ? undefined : { pathLength: [0.7, 1, 0.7] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.path
                  d="M98 132 C 60 152, 60 152, 22 132"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="4 6"
                  animate={reduce ? undefined : { pathLength: [0.7, 1, 0.7] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
              <motion.button
                type="button"
                className="switch-orb"
                aria-label={swapped ? "Switch back to dine-in" : "Switch to pickup"}
                onClick={() => setSwapped((current) => !current)}
                animate={{ rotate: swapped ? 180 : 0 }}
                transition={reduce ? { duration: 0 } : spring}
                whileTap={reduce ? undefined : { scale: 0.94 }}
              >
                <SwitchIcon className="h-5 w-5" />
              </motion.button>
            </div>
            <SwitchCard key={right.id} card={right} />
          </div>
        </LayoutGroup>
      </Reveal>
      <div className="site-wrap mt-10">
        <div className="flex flex-col gap-4 rounded-[10px] bg-accent px-5 py-5 text-ink shadow-[0_16px_40px_rgba(10,92,102,0.28)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] bg-ink/15 ring-1 ring-ink/25">
              <SwitchIcon className="h-5 w-5" />
            </span>
            <span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70">On every booking</p>
              <p className="mt-0.5 text-xl font-semibold tracking-[-0.03em]">FlexiSwitch</p>
            </span>
          </div>
          <p className="max-w-md text-sm leading-6 text-ink/90 sm:text-right">
            Dine in or pickup, on your terms. Same kitchen ticket. No cancellations.
          </p>
        </div>
      </div>
    </section>
  );
}

function SwitchCard({
  card,
}: {
  card: typeof dine;
}) {
  return (
    <motion.article
      layout
      layoutId={card.id}
      className="switch-card site-card overflow-hidden"
      transition={spring}
    >
      <div className="grid h-[6.5rem] shrink-0 content-start px-4 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{card.kicker}</p>
        <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em]">{card.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{card.detail}</p>
      </div>
      <div className="relative mx-4 my-4 aspect-[4/5] w-[calc(100%-2rem)] shrink-0 overflow-hidden rounded-[6px] bg-background">
        <Image
          src={card.image}
          alt={card.imageAlt}
          fill
          sizes="240px"
          unoptimized={card.image.endsWith(".png")}
          className="object-cover"
        />
      </div>
    </motion.article>
  );
}
