"use client";

import { useEffect, useState } from "react";
import { BookingGate } from "@/components/booking-gate";

type Beat = 0 | 1 | 2 | 3;
type Ride = "car" | "bike";

const DURATION_MS = 6500;

const scripts: {
  id: string;
  name: string;
  href: string;
  ride: Ride;
  switchRide?: Ride;
  nodes: { title: string; time: string; note: string }[];
}[] = [
  {
    id: "late",
    name: "Reserve a Table",
    href: "/restaurants?intent=reserve",
    ride: "car",
    nodes: [
      { title: "Book a table", time: "Today · 4:00 PM", note: "A seat is waiting for you." },
      { title: "Look at the clock", time: "Now · 3:15 PM", note: "If you order after you sit, food will be late." },
      { title: "Order now, then go", time: "Kitchen starts", note: "Send the food before the car moves." },
      { title: "Sit and eat", time: "4:00 PM", note: "You arrive. Dinner is already on the way." },
    ],
  },
  {
    id: "dine",
    name: "Reserve a Table and Pre-Order the food",
    href: "/restaurants?intent=reserve-preorder",
    ride: "car",
    switchRide: "bike",
    nodes: [
      { title: "Book a table and the food", time: "Table + dishes", note: "The kitchen knows what you want." },
      { title: "Restaurant pings you", time: "45–30 min before", note: "“We are cooking. See you soon.”" },
      { title: "Walk in. No wait.", time: "At the table", note: "Skip the line. Eat." },
      { title: "Plans change?", time: "Anytime", note: "FlexiSwitch turns this into pickup. Take the bike." },
    ],
  },
  {
    id: "pickup",
    name: "Pre-Order food for pickup",
    href: "/restaurants?intent=pickup",
    ride: "bike",
    switchRide: "car",
    nodes: [
      { title: "Book pickup", time: "Collect later", note: "The bag is for you, not a table." },
      { title: "Restaurant is ready", time: "Before you arrive", note: "Food waits at the counter." },
      { title: "Skip the queue", time: "Grab the bag", note: "In and out." },
      { title: "Want a table instead?", time: "45 min before you arrive", note: "FlexiSwitch turns pickup into dine-in. Take the car." },
    ],
  },
];

function CarIcon() {
  return (
    <svg className="hero-flow__icon" viewBox="0 0 40 24" aria-hidden="true">
      <rect x="4" y="8" width="28" height="9" rx="2.5" fill="#d4a574" />
      <path d="M12 8c2-5 8-6 14-4l6 4H12Z" fill="#f4efe6" />
      <circle cx="12" cy="18" r="3.2" fill="#1a140c" stroke="#f4efe6" strokeWidth="1.2" />
      <circle cx="26" cy="18" r="3.2" fill="#1a140c" stroke="#f4efe6" strokeWidth="1.2" />
    </svg>
  );
}

function BikeIcon() {
  return (
    <svg className="hero-flow__icon" viewBox="0 0 40 24" aria-hidden="true">
      <circle cx="10" cy="16" r="5" fill="none" stroke="#d4a574" strokeWidth="1.8" />
      <circle cx="30" cy="16" r="5" fill="none" stroke="#d4a574" strokeWidth="1.8" />
      <path d="M10 16h8l6-8h6" fill="none" stroke="#f4efe6" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M18 16 24 8" stroke="#d4a574" strokeWidth="1.8" />
    </svg>
  );
}

function RideMark({ kind }: { kind: Ride }) {
  return kind === "bike" ? <BikeIcon /> : <CarIcon />;
}

const BEATS = 4;

export function HeroStory() {
  const [step, setStep] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [pending, setPending] = useState<{ name: string; href: string } | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setStep(0);
      return;
    }
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % (BEATS * scripts.length));
    }, DURATION_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const liveScript = reduceMotion ? -1 : Math.floor(step / BEATS);
  const beat = (step % BEATS) as Beat;

  return (
    <div className="hero-scripts">
      {pending ? <BookingGate name={pending.name} href={pending.href} onClose={() => setPending(null)} /> : null}
      {scripts.map((script, scriptIndex) => (
        <div
          key={script.id}
          className={`hero-flow${scriptIndex === liveScript ? " is-live" : ""}`}
          aria-live={scriptIndex === liveScript ? "polite" : "off"}
        >
          <button
            type="button"
            className="hero-flow__name"
            aria-haspopup="dialog"
            onClick={() => setPending({ name: script.name, href: script.href })}
          >
            {script.name}
          </button>
          <ol className="hero-flow__list">
            {script.nodes.map((node, index) => {
              const playing = scriptIndex === liveScript;
              const active = playing && beat === index;
              const passed = playing && beat > index;
              const ride = index === 3 && script.switchRide ? script.switchRide : script.ride;
              return (
                <li
                  key={node.title}
                  className={`hero-flow__node${active ? " is-active" : ""}${passed ? " is-passed" : ""}`}
                >
                  <span className="hero-flow__dot" aria-hidden="true" />
                  <div className="hero-flow__body">
                    <p className="hero-flow__title">{node.title}</p>
                    <p className="hero-flow__time">{node.time}</p>
                    <p className="hero-flow__note">{node.note}</p>
                    {active ? (
                      <span className="hero-flow__ride">
                        <RideMark kind={ride} />
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
