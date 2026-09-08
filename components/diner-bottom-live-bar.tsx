"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { BOOKING_EVENT, bookingsForDiner, type Booking } from "@/lib/bookings";
import { onTheWayMenuHref, onTheWayWindow } from "@/lib/preorder-window";
import { AUTH_EVENT, readSession } from "@/lib/session";
import { formatSlotLabel, formatVisitDay } from "@/lib/visit-slots";

const DISMISS_KEY = "flexidine-dismiss-preorder-bar";

function dismissedIds(): string[] {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function dismissBar(id: string) {
  const next = [...new Set([...dismissedIds(), id])];
  window.localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
}

export function DinerBottomLiveBar() {
  const pathname = usePathname();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function sync() {
      if (pathname.startsWith("/partner")) {
        setBooking(null);
        return;
      }
      const username = readSession();
      const hidden = new Set(dismissedIds());
      const open = username
        ? bookingsForDiner(username).find(
            (item) => onTheWayWindow(item).open && item.items.length === 0 && !hidden.has(item.id),
          )
        : undefined;
      setBooking(open ?? null);
    }
    sync();
    const timer = window.setInterval(sync, 15000);
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener(BOOKING_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener(BOOKING_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.paddingBottom = booking ? "7rem" : "";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [booking, mounted]);

  if (!mounted || !booking) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90]">
      <div className="border-t border-line bg-surface shadow-[0_-12px_32px_rgba(20,28,30,0.12)]">
        <div className="site-wrap pointer-events-auto relative flex flex-col gap-3 py-3 pr-10 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="absolute right-0 top-3 grid h-9 w-9 place-items-center rounded-[8px] text-muted hover:bg-background hover:text-foreground sm:top-1/2 sm:-translate-y-1/2"
            aria-label="Close pre-order notice"
            onClick={() => {
              dismissBar(booking.id);
              setBooking(null);
            }}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-6 text-foreground sm:text-base">
              Table reserved at {booking.restaurantName}
            </p>
            <p className="text-xs leading-5 text-muted sm:text-sm">
              {formatVisitDay(booking.visitDate)} · {formatSlotLabel(booking.slot)}. Wanna pre-order on the way?
            </p>
          </div>
          <Link href={onTheWayMenuHref(booking)} className="site-btn shrink-0 text-center">
            Pre-order now
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
