"use client";

import { useEffect, useState } from "react";
import { BOOKING_EVENT, bookingsForDiner, type Booking } from "@/lib/bookings";
import { DinerBookingCard } from "@/components/diner-booking-card";
import { KITCHEN_EVENT } from "@/lib/kitchen";
import { ORDER_EVENT } from "@/lib/orders";
import { AUTH_EVENT, readSession } from "@/lib/session";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    function sync() {
      setBookings(bookingsForDiner(readSession()));
    }
    sync();
    const events = [AUTH_EVENT, BOOKING_EVENT, KITCHEN_EVENT, ORDER_EVENT];
    events.forEach((event) => window.addEventListener(event, sync));
    window.addEventListener("storage", sync);
    const timer = window.setInterval(sync, 2500);
    return () => {
      events.forEach((event) => window.removeEventListener(event, sync));
      window.removeEventListener("storage", sync);
      window.clearInterval(timer);
    };
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
        <DinerBookingCard key={booking.id} booking={booking} showItems={booking.items.length > 0} />
      ))}
    </ul>
  );
}
