"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BOOKING_EVENT, type Booking } from "@/lib/bookings";
import { formatSlotLabel, formatVisitDay } from "@/lib/visit-slots";
import {
  clearKitchenSession,
  kitchenTicketsForRestaurant,
  PARTNER_EVENT,
  readKitchenSession,
  type KitchenAccount,
} from "@/lib/partner-ops";

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

export function PartnerKitchen() {
  const router = useRouter();
  const [account, setAccount] = useState<KitchenAccount | null>(null);
  const [tickets, setTickets] = useState<Booking[]>([]);

  useEffect(() => {
    const session = readKitchenSession();
    if (!session) {
      router.replace("/partner/register#restaurant-login");
      return;
    }
    setAccount(session);
    setTickets(kitchenTicketsForRestaurant(session.restaurantId));

    function sync() {
      const current = readKitchenSession();
      if (!current) {
        router.replace("/partner/register#restaurant-login");
        return;
      }
      setAccount(current);
      setTickets(kitchenTicketsForRestaurant(current.restaurantId));
    }

    window.addEventListener(BOOKING_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener(PARTNER_EVENT, sync);
    return () => {
      window.removeEventListener(BOOKING_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener(PARTNER_EVENT, sync);
    };
  }, [router]);

  if (!account) {
    return null;
  }

  const orders = tickets.filter((ticket) => ticket.kind !== "reserve");
  const tables = tickets.filter((ticket) => ticket.kind === "reserve");

  return (
    <main className="bg-background text-foreground" data-header-skin="canvas">
      <section className="site-section">
        <div className="site-wrap">
          <p className="text-sm font-medium text-accent">Kitchen · {account.restaurantId}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="site-h1">{account.restaurantName}</h1>
            <div className="flex flex-wrap gap-3">
              <Link href="/partner/orders" className="text-sm font-medium text-accent">
                Order management
              </Link>
              <Link href={`/restaurants/${account.restaurantId}`} className="text-sm font-medium text-accent">
                Diner page
              </Link>
              <button
                type="button"
                className="text-sm font-medium text-muted"
                onClick={() => {
                  clearKitchenSession();
                  router.replace("/partner/register");
                }}
              >
                Log out
              </button>
            </div>
          </div>
          <p className="site-lead">
            Tickets appear here only after the restaurant approves them on order management.
          </p>

          <h2 className="mt-12 text-lg font-semibold">Food orders</h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Kitchen is empty until a pre-order or pickup is approved.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {orders.map((order) => (
                <TicketCard key={order.id} ticket={order} />
              ))}
            </ul>
          )}

          <h2 className="mt-12 text-lg font-semibold">Table reservations</h2>
          {tables.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Kitchen is empty until a reservation is approved.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {tables.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

function TicketCard({ ticket }: { ticket: Booking }) {
  return (
    <li className="site-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">{kindLabel(ticket.kind)}</p>
        <p className="text-xs text-muted">{formatWhen(ticket.createdAt)}</p>
      </div>
      <p className="mt-2 text-sm text-muted">{ticket.dinerName || "Guest diner"}</p>
      {ticket.visitDate && ticket.slot ? (
        <p className="mt-1 text-sm text-accent">
          {formatVisitDay(ticket.visitDate)} · {formatSlotLabel(ticket.slot)}
          {ticket.guests ? ` · ${ticket.guests} guests` : ""}
        </p>
      ) : null}
      {ticket.items.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {ticket.items.map((item) => (
            <li key={item.name}>
              {item.quantity} × {item.name}
            </li>
          ))}
        </ul>
      ) : null}
      {ticket.totalRupees > 0 ? (
        <p className="mt-3 text-sm font-medium text-accent">₹{ticket.totalRupees.toLocaleString("en-IN")}</p>
      ) : null}
    </li>
  );
}
