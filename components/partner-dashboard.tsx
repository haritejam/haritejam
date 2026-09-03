"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, ChefHat, Clock, Users } from "lucide-react";
import { bookingsForRestaurant, PARTNER_EVENT, readKitchenSession, type KitchenAccount } from "@/lib/partner-ops";
import { BOOKING_EVENT, type Booking } from "@/lib/bookings";
import { ordersForRestaurant, ORDER_EVENT, type Order } from "@/lib/orders";
import { reservationsForRestaurant, RESERVATION_EVENT, type Reservation } from "@/lib/reservations";
import { ticketsForRestaurant, KITCHEN_EVENT, type KitchenTicket } from "@/lib/kitchen";
import { PartnerShell } from "@/components/partner-shell";
import { formatSlotLabel, formatVisitDay } from "@/lib/visit-slots";

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`site-card flex flex-col gap-1 p-4 ${accent && value > 0 ? "border-[var(--accent)]/40 bg-[var(--accent)]/5" : ""}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p
        className={`text-3xl font-semibold tabular-nums ${accent && value > 0 ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}
      >
        {value}
      </p>
    </div>
  );
}

type TimelineEntry =
  | { kind: "order"; data: Order; time: string }
  | { kind: "reservation"; data: Reservation; time: string }
  | { kind: "booking"; data: Booking; time: string };

function typeBadge(entry: TimelineEntry) {
  if (entry.kind === "booking") {
    const k = entry.data.kind;
    if (k === "pickup") return { label: "PICKUP", color: "bg-amber-100 text-amber-800" };
    if (k === "reserve-preorder") return { label: "PRE-ORDER", color: "bg-blue-100 text-blue-800" };
    return { label: "RESERVATION", color: "bg-teal-100 text-teal-800" };
  }
  if (entry.kind === "reservation")
    return { label: "RESERVATION", color: "bg-teal-100 text-teal-800" };
  const o = entry.data as Order;
  if (o.orderType === "PICKUP_ASAP") return { label: "PICKUP ASAP", color: "bg-amber-100 text-amber-800" };
  if (o.orderType === "PICKUP_SCHEDULED") return { label: "PICKUP", color: "bg-amber-100 text-amber-800" };
  if (o.orderType === "PREORDER_DINE_IN") return { label: "PRE-ORDER", color: "bg-blue-100 text-blue-800" };
  return { label: "DINE-IN", color: "bg-teal-100 text-teal-800" };
}

function formatTimelineTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function PartnerDashboard() {
  const [account, setAccount] = useState<KitchenAccount | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [legacyBookings, setLegacyBookings] = useState<Booking[]>([]);

  const refresh = useCallback(() => {
    const session = readKitchenSession();
    if (!session) return;
    setAccount(session);
    setOrders(ordersForRestaurant(session.restaurantId));
    setReservations(reservationsForRestaurant(session.restaurantId));
    setTickets(ticketsForRestaurant(session.restaurantId));
    setLegacyBookings(bookingsForRestaurant(session.restaurantId));
  }, []);

  useEffect(() => {
    refresh();
    const events = [BOOKING_EVENT, ORDER_EVENT, RESERVATION_EVENT, KITCHEN_EVENT, PARTNER_EVENT];
    events.forEach((e) => window.addEventListener(e, refresh));
    window.addEventListener("storage", refresh);
    return () => {
      events.forEach((e) => window.removeEventListener(e, refresh));
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const today = new Date().toISOString().slice(0, 10);

  const pendingApproval = useMemo(
    () =>
      orders.filter((o) => o.approvalStatus === "PENDING").length +
      legacyBookings.filter((b) => b.kitchenStatus !== "approved").length,
    [orders, legacyBookings],
  );

  const activeKitchen = useMemo(
    () =>
      tickets.filter((t) => t.status === "NEW" || t.status === "PREPARING").length,
    [tickets],
  );

  const upcomingReservations = useMemo(
    () =>
      reservations.filter(
        (r) => r.date === today && (r.status === "PENDING" || r.status === "CONFIRMED"),
      ).length,
    [reservations, today],
  );

  const readyCount = useMemo(
    () =>
      orders.filter((o) => o.status === "READY").length +
      tickets.filter((t) => t.status === "READY").length,
    [orders, tickets],
  );

  // Build timeline
  const timeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];

    // New-style orders for today
    orders.forEach((o) => {
      const ref = o.scheduledFor ?? o.createdAt;
      if (ref.slice(0, 10) === today) {
        entries.push({ kind: "order", data: o, time: ref });
      }
    });

    // Reservations for today
    reservations
      .filter((r) => r.date === today)
      .forEach((r) => {
        const dt = `${r.date}T${r.slot}:00`;
        entries.push({ kind: "reservation", data: r, time: dt });
      });

    // Legacy bookings for today
    legacyBookings.forEach((b) => {
      if (b.visitDate === today) {
        const dt = `${b.visitDate}T${b.slot}:00`;
        entries.push({ kind: "booking", data: b, time: dt });
      }
    });

    return entries.sort((a, b) => a.time.localeCompare(b.time));
  }, [orders, reservations, legacyBookings, today]);

  return (
    <PartnerShell activeRoute="dashboard">
      <div className="px-5 py-8 sm:px-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Today
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {account?.restaurantName ?? "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatChip label="Pending approval" value={pendingApproval} accent />
          <StatChip label="In kitchen" value={activeKitchen} />
          <StatChip label="Upcoming reservations" value={upcomingReservations} />
          <StatChip label="Ready" value={readyCount} accent={readyCount > 0} />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          {pendingApproval > 0 && (
            <Link
              href="/partner/orders"
              className="site-btn flex items-center gap-2 py-2 px-4 text-sm"
            >
              <AlertCircle className="h-4 w-4" />
              Approve {pendingApproval} pending
            </Link>
          )}
          <Link
            href="/partner/kitchen"
            className="flex items-center gap-2 site-card px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
          >
            <ChefHat className="h-4 w-4 text-[var(--muted)]" />
            Open kitchen
            <ArrowRight className="h-3.5 w-3.5 text-[var(--muted)]" />
          </Link>
        </div>

        {/* Today's timeline */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-[var(--foreground)]">
            Today&apos;s timeline
          </h2>

          {timeline.length === 0 ? (
            <div className="site-card p-6 text-center">
              <Clock className="h-8 w-8 text-[var(--muted)]/40 mx-auto mb-2" />
              <p className="text-sm text-[var(--muted)]">Nothing scheduled for today yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {timeline.map((entry, i) => {
                const badge = typeBadge(entry);
                const guestName =
                  entry.kind === "booking"
                    ? entry.data.dinerName || "Guest"
                    : entry.kind === "reservation"
                      ? entry.data.guestName
                      : entry.data.guestName;
                const count =
                  entry.kind === "booking"
                    ? entry.data.guests
                    : entry.kind === "reservation"
                      ? entry.data.guestCount
                      : entry.data.guestCount;

                const href =
                  entry.kind === "order"
                    ? `/partner/orders/${entry.data.id}`
                    : entry.kind === "reservation"
                      ? "/partner/reservations"
                      : "/partner/orders";

                return (
                  <Link
                    key={i}
                    href={href}
                    className="site-card flex items-center gap-4 px-4 py-3 hover:bg-[var(--background)] transition-colors group"
                  >
                    <div className="w-16 shrink-0 text-right">
                      <p className="text-sm font-medium tabular-nums text-[var(--foreground)]">
                        {formatTimelineTime(entry.time)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        {guestName}
                      </p>
                    </div>
                    {count > 0 && (
                      <div className="flex items-center gap-1 text-[var(--muted)] shrink-0">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-sm">{count}</span>
                      </div>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--muted)]/40 group-hover:text-[var(--muted)] transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PartnerShell>
  );
}
