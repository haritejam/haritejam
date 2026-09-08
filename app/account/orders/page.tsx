"use client";

import { useEffect, useState } from "react";
import { BOOKING_EVENT, bookingsForDiner, isOrder, type Booking } from "@/lib/bookings";
import { DinerBookingCard } from "@/components/diner-booking-card";
import { KITCHEN_EVENT } from "@/lib/kitchen";
import { ORDER_EVENT } from "@/lib/orders";
import { AUTH_EVENT, readSession } from "@/lib/session";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Booking[]>([]);

  useEffect(() => {
    function sync() {
      setOrders(bookingsForDiner(readSession()).filter((booking) => isOrder(booking.kind)));
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

  if (orders.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted">
        No food orders yet. Pre-order with a table or for pickup, then they will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <DinerBookingCard key={order.id} booking={order} showItems />
      ))}
    </ul>
  );
}
