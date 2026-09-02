"use client";

import { useEffect, useState } from "react";
import { isOrder, readBookings, type Booking } from "@/lib/bookings";
import { formatSlotLabel, formatVisitDay } from "@/lib/visit-slots";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Booking[]>([]);

  useEffect(() => {
    setOrders(readBookings().filter((booking) => isOrder(booking.kind)));
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
        <li key={order.id} className="site-card p-5">
          <p className="text-sm font-semibold">{order.restaurantName}</p>
          <p className="mt-1 text-xs text-muted">{formatWhen(order.createdAt)}</p>
          <p className="mt-2 text-sm text-muted">{order.kind === "pickup" ? "Pickup" : "Table with pre-order"}</p>
          {order.visitDate && order.slot ? (
            <p className="mt-1 text-sm text-accent">
              {formatVisitDay(order.visitDate)} · {formatSlotLabel(order.slot)}
            </p>
          ) : null}
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {order.items.map((item) => (
              <li key={item.name}>
                {item.quantity} × {item.name}
              </li>
            ))}
          </ul>
          {order.totalRupees > 0 ? (
            <p className="mt-3 text-sm font-medium text-accent">₹{order.totalRupees.toLocaleString("en-IN")}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
