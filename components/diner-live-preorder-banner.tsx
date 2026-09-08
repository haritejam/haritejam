"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BOOKING_EVENT, bookingsForDiner, type Booking } from "@/lib/bookings";
import { livePreorderCopy, onTheWayMenuHref, onTheWayWindow } from "@/lib/preorder-window";
import { AUTH_EVENT, readSession } from "@/lib/session";

export function DinerLivePreorderBanner({ variant = "toast" }: { variant?: "toast" | "page" }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    function sync() {
      const username = readSession();
      const open = username
        ? bookingsForDiner(username).find((item) => onTheWayWindow(item).open)
        : undefined;
      setBooking(open ?? null);
      setNow(Date.now());
    }
    sync();
    const timer = window.setInterval(sync, 15000);
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener(BOOKING_EVENT, sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener(BOOKING_EVENT, sync);
    };
  }, []);

  if (!now || !booking) return null;
  const copy = livePreorderCopy(booking, now);
  if (!copy || copy.stage === "closed") return null;
  const href = onTheWayMenuHref(booking);

  if (variant === "page") {
    return (
      <Link
        href={href}
        className={`block rounded-[8px] border px-5 py-4 ${
          copy.stage === "urgent" ? "border-accent bg-accent/15" : "border-line bg-surface"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Live</p>
        <p className="mt-2 text-base font-semibold text-foreground">{copy.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted">{copy.detail}</p>
        <p className="mt-3 text-sm font-semibold text-accent">Open the menu to pre-order on the way</p>
      </Link>
    );
  }

  return (
    <div
      className={`pointer-events-auto rounded-[8px] border px-4 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.12)] ${
        copy.stage === "urgent"
          ? "border-accent bg-accent/15 text-foreground"
          : "border-line bg-surface text-foreground"
      }`}
    >
      <p className="text-sm font-semibold">{copy.title}</p>
      <p className="mt-0.5 text-xs leading-5 text-muted">{copy.detail}</p>
      <Link href={href} className="mt-2 inline-block text-xs font-semibold text-accent">
        Open restaurant menu
      </Link>
    </div>
  );
}
