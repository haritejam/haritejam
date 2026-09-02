"use client";

import { useEffect, useState } from "react";
import { readBookings, type Booking } from "@/lib/bookings";
import { formatSlotLabel, formatVisitDay } from "@/lib/visit-slots";

function kindLabel(kind: Booking["kind"]) {
  if (kind === "pickup") {
    return "Pickup";
  }
  if (kind === "reserve-preorder") {
    return "Table + pre-order";
  }
  return "Table reservation";
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    setBookings(readBookings());
  }, []);

  if (bookings.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted">
        No bookings yet. Reserve a table or place a pickup order, and the history will list here.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {bookings.map((booking) => (
        <li key={booking.id} className="site-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">{booking.restaurantName}</p>
            <p className="text-xs text-muted">{formatWhen(booking.createdAt)}</p>
          </div>
          <p className="mt-2 text-sm text-muted">{kindLabel(booking.kind)}</p>
          {booking.visitDate && booking.slot ? (
            <p className="mt-1 text-sm text-accent">
              {formatVisitDay(booking.visitDate)} · {formatSlotLabel(booking.slot)}
            </p>
          ) : null}
          {booking.kind !== "pickup" ? (
            <p className="mt-1 text-sm text-muted">
              {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
