"use client";

import { useMemo, useState } from "react";
import { type Booking } from "@/lib/bookings";
import { setTablePreorder } from "@/lib/on-the-way-order";
import { quoteBill } from "@/lib/pricing";
import { onTheWayWindow } from "@/lib/preorder-window";
import { getLiveRestaurantById } from "@/lib/partner-ops";
import { getSettings } from "@/lib/restaurant-settings";

export function DinerOnTheWayPreorder({ booking }: { booking: Booking }) {
  const restaurant = getLiveRestaurantById(booking.restaurantId);
  const windowState = onTheWayWindow(booking);
  const [cart, setCart] = useState<Record<string, number>>(() => {
    const next: Record<string, number> = {};
    if (!restaurant) return next;
    for (const item of restaurant.menuItems) {
      const line = booking.items.find((entry) => entry.name === item.name);
      if (line) next[item.id] = line.quantity;
    }
    return next;
  });
  const [message, setMessage] = useState("");

  const lines = useMemo(
    () =>
      restaurant
        ? restaurant.menuItems
            .map((menuItem) => ({ menuItem, quantity: cart[menuItem.id] ?? 0 }))
            .filter((line) => line.quantity > 0)
        : [],
    [cart, restaurant],
  );
  const subtotal = lines.reduce((sum, line) => sum + line.menuItem.priceRupees * line.quantity, 0);
  const bill = quoteBill(subtotal, "DINE_IN", getSettings(booking.restaurantId));

  if (!windowState.eligible) return null;
  if (!windowState.open) {
    return (
      <div className="border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Pre-order on the way</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Last cutoff was {windowState.cutoffMinutes} min before your table time. You can still dine; the kitchen will take the
          order at the restaurant.
        </p>
      </div>
    );
  }

  if (!restaurant) return null;

  function updateQty(id: string, delta: number) {
    setCart((current) => {
      const next = Math.max(0, (current[id] ?? 0) + delta);
      if (next === 0) {
        const rest = { ...current };
        delete rest[id];
        return rest;
      }
      return { ...current, [id]: next };
    });
  }

  function save() {
    const result = setTablePreorder(
      booking.id,
      lines.map((line) => ({ name: line.menuItem.name, quantity: line.quantity })),
      subtotal,
    );
    setMessage(result.reason ?? (result.ok ? "Pre-order saved. The restaurant will see it before you arrive." : ""));
  }

  return (
    <div className="border-t border-line pt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Pre-order on the way</p>
      <p className="mt-2 text-sm leading-6 text-muted">
        Add dishes before you reach. Last cutoff is {windowState.cutoffMinutes} min before {windowState.seatingLabel} ·{" "}
        {windowState.remainingLabel} left.
      </p>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {restaurant.menuItems.map((menuItem) => (
          <li key={menuItem.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-medium">{menuItem.name}</p>
              <p className="text-xs text-muted">{menuItem.priceLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-[6px] border border-line text-sm"
                onClick={() => updateQty(menuItem.id, -1)}
                aria-label={`Remove ${menuItem.name}`}
              >
                −
              </button>
              <span className="w-5 text-center text-sm">{cart[menuItem.id] ?? 0}</span>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-[6px] bg-accent text-sm text-ink"
                onClick={() => updateQty(menuItem.id, 1)}
                aria-label={`Add ${menuItem.name}`}
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
      {bill.subtotalRupees > 0 ? (
        <p className="mt-3 flex justify-between text-sm">
          <span>Total with {bill.discountPercent}% dine-in discount</span>
          <span className="font-semibold">₹{bill.totalRupees.toLocaleString("en-IN")}</span>
        </p>
      ) : null}
      <button type="button" className="site-btn mt-4" onClick={save}>
        Save on-the-way pre-order
      </button>
      {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
