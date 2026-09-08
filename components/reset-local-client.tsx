"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearFlexidineBrowserData } from "@/lib/clear-local-data";

export function ResetLocalClient() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const removed = clearFlexidineBrowserData();
    setCount(removed.length);
  }, []);

  return (
    <section className="site-section bg-background text-foreground" data-header-skin="canvas">
      <div className="site-wrap max-w-lg">
        <h1 className="site-h1">Local data cleared</h1>
        <p className="site-lead">
          {count === null
            ? "Clearing this browser…"
            : count === 0
              ? "This browser had no FlexiDine bookings, orders, or sessions left."
              : `Removed ${count} saved item${count === 1 ? "" : "s"} in this browser: bookings, orders, tickets, diner login, and kitchen sessions.`}
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Catalog restaurants such as Serein House stay in the app. Sign up and restaurant login start empty again.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="site-btn">
            Home
          </Link>
          <Link href="/partner/register#restaurant-login" className="booking-gate__stay">
            Restaurant login
          </Link>
        </div>
      </div>
    </section>
  );
}
