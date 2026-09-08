"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/icons";
import { BOOKING_EVENT } from "@/lib/bookings";
import {
  DINER_NOTICE_EVENT,
  markNoticesRead,
  noticeActionHref,
  noticesForDiner,
  syncDinerNotices,
  syncOnTheWayLiveNotices,
  unreadNoticeCount,
} from "@/lib/diner-notifications";
import { KITCHEN_EVENT } from "@/lib/kitchen";
import { ORDER_EVENT } from "@/lib/orders";
import { AUTH_EVENT, readSession } from "@/lib/session";

export function DinerNoticeBell({
  dark,
  chipClass,
  mutedClass,
  inkClass,
  lineClass,
}: {
  dark: boolean;
  chipClass: string;
  mutedClass: string;
  inkClass: string;
  lineClass: string;
}) {
  const [username, setUsername] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<ReturnType<typeof noticesForDiner>>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  const refreshList = useCallback((name: string | null) => {
    setItems(noticesForDiner(name).slice(0, 8));
    setUnread(unreadNoticeCount(name));
  }, []);

  useEffect(() => {
    const syncUser = () => {
      const session = readSession();
      setUsername(session);
      refreshList(session);
    };
    syncUser();
    window.addEventListener(AUTH_EVENT, syncUser);
    return () => window.removeEventListener(AUTH_EVENT, syncUser);
  }, [refreshList]);

  useEffect(() => {
    if (!username) return;

    function tick() {
      syncOnTheWayLiveNotices(username);
      syncDinerNotices(username);
      refreshList(username);
    }

    tick();
    const watch = [BOOKING_EVENT, KITCHEN_EVENT, ORDER_EVENT];
    watch.forEach((event) => window.addEventListener(event, tick));
    window.addEventListener("storage", tick);
    function onNotice() {
      refreshList(username);
    }
    window.addEventListener(DINER_NOTICE_EVENT, onNotice);
    const timer = window.setInterval(tick, 2500);
    return () => {
      watch.forEach((event) => window.removeEventListener(event, tick));
      window.removeEventListener("storage", tick);
      window.removeEventListener(DINER_NOTICE_EVENT, onNotice);
      window.clearInterval(timer);
    };
  }, [username, refreshList]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  if (!username) return null;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      markNoticesRead(username);
      refreshList(username);
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        className={`relative grid h-10 w-10 place-items-center rounded-[6px] border ${chipClass}`}
        aria-label={unread > 0 ? `${unread} order updates` : "Order notifications"}
        aria-expanded={open}
        onClick={toggle}
      >
        <BellIcon className={`h-4 w-4 ${unread > 0 ? "text-accent" : mutedClass}`} />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-ink">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          className={`absolute right-0 top-[calc(100%+8px)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[6px] border shadow-[0_16px_40px_rgba(0,0,0,0.4)] ${
            dark ? "border-white/10 bg-[#1a140c]" : "border-line bg-surface"
          }`}
        >
          <p className={`border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] ${lineClass} ${mutedClass}`}>
            Order updates
          </p>
          {items.length === 0 ? (
            <p className={`px-4 py-6 text-sm ${mutedClass}`}>No updates yet. Status changes on your bookings will show here.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id} className={`border-b last:border-b-0 ${lineClass}`}>
                  <Link
                    href={noticeActionHref(item)}
                    className={`block px-4 py-3 ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                    onClick={() => setOpen(false)}
                  >
                    <p className={`text-sm font-semibold ${inkClass}`}>{item.title}</p>
                    <p className={`mt-0.5 text-xs leading-5 ${mutedClass}`}>{item.detail}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
