"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChefHat, Clock } from "lucide-react";
import {
  approveBookingForKitchen,
  BOOKING_EVENT,
  fulfillmentOf,
  needsPartnerAttention,
  rejectBooking,
  type Booking,
} from "@/lib/bookings";
import { bookingsForRestaurant, PARTNER_EVENT, readKitchenSession, type KitchenAccount } from "@/lib/partner-ops";
import { ordersForRestaurant, ORDER_EVENT, updateOrder, type Order } from "@/lib/orders";
import { reservationsForRestaurant, RESERVATION_EVENT, type Reservation } from "@/lib/reservations";
import { ticketsForRestaurant, KITCHEN_EVENT, type KitchenTicket } from "@/lib/kitchen";
import { getKitchenOrderRepository } from "@/lib/kitchen-order-repository";
import { fohStageChip, stageFromOrderStatus, stageFromTicket } from "@/lib/foh-status";
import { PartnerShell } from "@/components/partner-shell";
import { dateKey, formatSlotLabel, formatVisitDay, isAsapSlot } from "@/lib/visit-slots";

function dashCard(className = "") {
  return `site-card p-5 ${className}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "FD";
}

function guestOf(entry: TimelineEntry) {
  if (entry.kind === "booking") return entry.data.dinerName || "Guest";
  return entry.data.guestName;
}

function partyOf(entry: TimelineEntry) {
  if (entry.kind === "booking") return entry.data.guests;
  return entry.data.guestCount;
}

function hrefOf(entry: TimelineEntry) {
  if (entry.kind === "order") return `/partner/orders/${entry.data.id}`;
  if (entry.kind === "reservation") return "/partner/reservations";
  return "/partner/orders";
}

function itemsOf(entry: TimelineEntry) {
  if (entry.kind === "booking" || entry.kind === "order") return entry.data.items;
  return [];
}

function progressOf(entry: TimelineEntry, tickets: KitchenTicket[]) {
  if (entry.kind === "booking") {
    return fohStageChip(
      entry.data.kitchenStatus === "rejected"
        ? "rejected"
        : entry.data.kitchenStatus !== "approved"
          ? "pending"
          : (stageFromTicket(tickets.find((t) => t.orderId === entry.data.id)?.status) ??
            entry.data.kitchenStage ??
            "queued"),
      fulfillmentOf(entry.data) === "DELIVERY"
        ? "delivery"
        : fulfillmentOf(entry.data) === "PICKUP",
      entry.data.dispatchStatus,
    );
  }
  if (entry.kind === "order") {
    return fohStageChip(
      stageFromTicket(tickets.find((t) => t.orderId === entry.data.id)?.status) ??
        stageFromOrderStatus(entry.data.status, entry.data.approvalStatus),
      entry.data.fulfillmentType === "DELIVERY" ? "delivery" : entry.data.fulfillmentType === "PICKUP",
      entry.data.dispatchStatus,
    );
  }
  return { label: entry.data.status.replace("_", " "), className: "bg-[var(--muted)]/15 text-[var(--foreground)]" };
}

type TimelineEntry =
  | { kind: "order"; data: Order; time: string }
  | { kind: "reservation"; data: Reservation; time: string }
  | { kind: "booking"; data: Booking; time: string };

function typeBadge(entry: TimelineEntry) {
  if (entry.kind === "booking") {
    const k = entry.data.kind;
    if (k === "pickup") return { label: "Pickup", color: "bg-amber-100 text-amber-900" };
    if (k === "delivery") return { label: "Delivery", color: "bg-violet-100 text-violet-900" };
    if (k === "on-the-way") return { label: "Pre-order", color: "bg-sky-100 text-sky-900" };
    if (k === "reserve-preorder") return { label: "Table + food", color: "bg-sky-100 text-sky-900" };
    return { label: "Table only", color: "bg-teal-100 text-teal-900" };
  }
  if (entry.kind === "reservation") return { label: "Table only", color: "bg-teal-100 text-teal-900" };
  const o = entry.data as Order;
  if (o.orderType === "PICKUP_ASAP") return { label: "Pickup ASAP", color: "bg-amber-100 text-amber-900" };
  if (o.orderType === "PICKUP_SCHEDULED") return { label: "Pickup", color: "bg-amber-100 text-amber-900" };
  if (o.orderType === "DELIVERY") return { label: "Delivery", color: "bg-violet-100 text-violet-900" };
  if (o.orderType === "PREORDER_ON_THE_WAY") return { label: "Pre-order", color: "bg-sky-100 text-sky-900" };
  if (o.orderType === "PREORDER_DINE_IN") return { label: "Table + food", color: "bg-sky-100 text-sky-900" };
  if (o.orderType === "RESERVATION_ONLY") return { label: "Table only", color: "bg-teal-100 text-teal-900" };
  return { label: "Dine-in", color: "bg-teal-100 text-teal-900" };
}

function clockLabel(entry: TimelineEntry) {
  if (entry.kind === "booking") {
    if (isAsapSlot(entry.data.slot)) return "ASAP";
    if (entry.data.slot === "eta") return "On the way";
    return formatSlotLabel(entry.data.slot);
  }
  if (entry.kind === "reservation") return formatSlotLabel(entry.data.slot);
  if (entry.data.orderType === "PICKUP_ASAP") return "ASAP";
  return formatTimelineTime(entry.time);
}

function needsAction(entry: TimelineEntry) {
  if (entry.kind === "booking") return needsPartnerAttention(entry.data);
  if (entry.kind === "order") return entry.data.approvalStatus === "PENDING";
  return entry.data.status === "PENDING";
}

function flexiUsed(entry: TimelineEntry) {
  if (entry.kind === "booking") return (entry.data.flexiSwitchHistory?.length ?? 0) > 0;
  if (entry.kind === "order") return (entry.data.flexiSwitchHistory?.length ?? 0) > 0;
  return false;
}

function billRupees(entry: TimelineEntry) {
  if (entry.kind === "booking") return entry.data.totalRupees ?? 0;
  if (entry.kind === "order") return entry.data.totalRupees ?? 0;
  return 0;
}

function formatTimelineTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function isFutureWhen(when: Date, now: Date) {
  return Number.isFinite(when.getTime()) && when.getTime() > now.getTime();
}

function isUpcomingBooking(booking: Booking, now: Date) {
  if (booking.kitchenStatus === "rejected") return false;
  if (isAsapSlot(booking.slot)) return false;
  if (booking.kind === "on-the-way" && booking.etaMinutes) {
    return new Date(booking.createdAt).getTime() + booking.etaMinutes * 60_000 > now.getTime();
  }
  if (!booking.visitDate) return false;
  return isFutureWhen(new Date(`${booking.visitDate}T${booking.slot || "00:00"}:00`), now);
}

function isUpcomingOrder(order: Order, now: Date) {
  if (
    order.status === "REJECTED" ||
    order.status === "CANCELLED" ||
    order.status === "COMPLETED" ||
    order.status === "COLLECTED" ||
    order.status === "SERVED"
  ) {
    return false;
  }
  if (order.orderType === "PICKUP_ASAP") return false;
  if (!order.scheduledFor) return false;
  return isFutureWhen(new Date(order.scheduledFor), now);
}

function isUpcomingReservation(reservation: Reservation, now: Date) {
  if (
    reservation.status === "CANCELLED" ||
    reservation.status === "NO_SHOW" ||
    reservation.status === "COMPLETED"
  ) {
    return false;
  }
  return isFutureWhen(new Date(`${reservation.date}T${reservation.slot}:00`), now);
}

type RangeKey = "d" | "w" | "m" | "a";
type ServiceKey = "all" | "table" | "pickup" | "delivery" | "on-the-way";

type Mix = {
  table: number;
  pickup: number;
  delivery: number;
  "on-the-way": number;
  tableRupees: number;
  pickupRupees: number;
  deliveryRupees: number;
  wayRupees: number;
};

function entryDay(entry: TimelineEntry) {
  if (entry.kind === "booking") return entry.data.visitDate || entry.data.createdAt.slice(0, 10);
  if (entry.kind === "reservation") return entry.data.date;
  return (entry.data.scheduledFor ?? entry.data.createdAt).slice(0, 10);
}

function serviceKeyOf(entry: TimelineEntry): Exclude<ServiceKey, "all"> {
  if (entry.kind === "booking") {
    if (entry.data.kind === "pickup") return "pickup";
    if (entry.data.kind === "delivery") return "delivery";
    if (entry.data.kind === "on-the-way") return "on-the-way";
    return "table";
  }
  if (entry.kind === "reservation") return "table";
  if (entry.data.fulfillmentType === "PICKUP" || entry.data.orderType.startsWith("PICKUP")) return "pickup";
  if (entry.data.fulfillmentType === "DELIVERY" || entry.data.orderType === "DELIVERY") return "delivery";
  if (entry.data.orderType === "PREORDER_ON_THE_WAY") return "on-the-way";
  return "table";
}

function mondayOf(now: Date) {
  const d = new Date(now);
  const weekday = d.getDay();
  d.setDate(d.getDate() - (weekday === 0 ? 6 : weekday - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function sundayOf(now: Date) {
  const d = mondayOf(now);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function windowDays(range: RangeKey, now: Date) {
  if (range === "d") return 1;
  if (range === "w") return 7;
  if (range === "a") return 30;
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return Math.max(1, Math.round((now.getTime() - start.getTime()) / 86400000) + 1);
}

function inWindow(day: string, range: RangeKey, now: Date) {
  if (range === "a") return true;
  const today = dateKey(now);
  if (range === "d") return day === today;
  const stamp = new Date(`${day}T12:00:00`);
  if (!Number.isFinite(stamp.getTime())) return false;
  if (range === "w") return stamp >= mondayOf(now) && stamp <= sundayOf(now);
  return stamp.getMonth() === now.getMonth() && stamp.getFullYear() === now.getFullYear();
}

function dailySeries(entries: TimelineEntry[], range: RangeKey, now: Date) {
  const keys: string[] = [];
  if (range === "d") {
    keys.push(dateKey(now));
  } else if (range === "w") {
    const start = mondayOf(now);
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      keys.push(dateKey(d));
    }
  } else if (range === "a") {
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      keys.push(dateKey(d));
    }
  } else {
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= last; i += 1) {
      keys.push(dateKey(new Date(now.getFullYear(), now.getMonth(), i)));
    }
  }
  const map = new Map(keys.map((k) => [k, 0]));
  for (const entry of entries) {
    const day = entryDay(entry);
    if (map.has(day)) map.set(day, (map.get(day) ?? 0) + Math.max(1, partyOf(entry)));
  }
  return keys.map((label) => ({ label, covers: map.get(label) ?? 0 }));
}

export function PartnerDashboard() {
  const [range, setRange] = useState<RangeKey>("m");
  const [service, setService] = useState<ServiceKey>("all");
  const [account, setAccount] = useState<KitchenAccount | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [legacyBookings, setLegacyBookings] = useState<Booking[]>([]);

  const refresh = useCallback(() => {
    const session = readKitchenSession();
    if (!session) return;
    setAccount(session);
    getKitchenOrderRepository().hydrateLegacyApprovals(session.restaurantId);
    getKitchenOrderRepository().promoteScheduled(session.restaurantId);
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

  const now = new Date();

  const pendingApproval = useMemo(
    () =>
      orders.filter((o) => o.approvalStatus === "PENDING").length +
      legacyBookings.filter((b) => needsPartnerAttention(b)).length,
    [orders, legacyBookings],
  );

  const activeKitchen = useMemo(
    () => tickets.filter((t) => t.status === "NEW" || t.status === "PREPARING").length,
    [tickets],
  );

  const upcomingReservations = useMemo(() => {
    const stamp = new Date();
    return (
      reservations.filter((r) => isUpcomingReservation(r, stamp)).length +
      legacyBookings.filter((b) => isUpcomingBooking(b, stamp)).length +
      orders.filter((o) => isUpcomingOrder(o, stamp)).length
    );
  }, [reservations, legacyBookings, orders]);

  const readyCount = useMemo(
    () =>
      orders.filter((o) => o.status === "READY").length + tickets.filter((t) => t.status === "READY").length,
    [orders, tickets],
  );

  const catalog = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];
    const bookingIds = new Set(legacyBookings.map((b) => b.id));
    legacyBookings.forEach((b) => {
      entries.push({
        kind: "booking",
        data: b,
        time: b.visitDate ? `${b.visitDate}T${b.slot || "00:00"}:00` : b.createdAt,
      });
    });
    reservations.forEach((r) => {
      if (r.linkedOrderId && bookingIds.has(r.linkedOrderId)) return;
      entries.push({ kind: "reservation", data: r, time: `${r.date}T${r.slot}:00` });
    });
    orders.forEach((o) => {
      if (bookingIds.has(o.id)) return;
      entries.push({ kind: "order", data: o, time: o.scheduledFor ?? o.createdAt });
    });
    return entries.sort((a, b) => b.time.localeCompare(a.time));
  }, [orders, reservations, legacyBookings]);

  const ranged = useMemo(
    () => catalog.filter((entry) => inWindow(entryDay(entry), range, now)),
    [catalog, range, now],
  );

  const timeline = useMemo(() => {
    if (service === "all") return ranged;
    return catalog.filter((entry) => serviceKeyOf(entry) === service);
  }, [catalog, ranged, service]);

  const actionQueue = useMemo(() => {
    const pool = service === "all" ? ranged : catalog.filter((entry) => serviceKeyOf(entry) === service);
    return pool.filter((entry) => needsAction(entry));
  }, [catalog, ranged, service]);

  const covers = useMemo(
    () => timeline.reduce((sum, entry) => sum + Math.max(1, partyOf(entry)), 0),
    [timeline],
  );
  const revenue = useMemo(() => timeline.reduce((sum, entry) => sum + billRupees(entry), 0), [timeline]);
  const days =
    service === "all"
      ? windowDays(range, now)
      : Math.max(1, new Set(timeline.map((entry) => entryDay(entry))).size);
  const avgCovers = Math.round((covers / days) * 10) / 10;
  const byDay = useMemo(() => dailySeries(ranged, range, now), [ranged, range, now]);
  const mix = useMemo(() => {
    const empty: Mix = {
      table: 0,
      pickup: 0,
      delivery: 0,
      "on-the-way": 0,
      tableRupees: 0,
      pickupRupees: 0,
      deliveryRupees: 0,
      wayRupees: 0,
    };
    return ranged.reduce((acc, entry) => {
      const key = serviceKeyOf(entry);
      acc[key] += 1;
      const rupees = billRupees(entry);
      if (key === "table") acc.tableRupees += rupees;
      if (key === "pickup") acc.pickupRupees += rupees;
      if (key === "delivery") acc.deliveryRupees += rupees;
      if (key === "on-the-way") acc.wayRupees += rupees;
      return acc;
    }, empty);
  }, [ranged]);

  const rangeLabel = range === "d" ? "Today" : range === "w" ? "This week" : range === "a" ? "All dates" : "This month";
  const serviceLabel =
    service === "all"
      ? "All services"
      : service === "table"
        ? "Table"
        : service === "pickup"
          ? "Pickup"
          : service === "delivery"
            ? "Delivery"
            : "Pre-order";
  const floorTitle = service === "all" ? `${rangeLabel} on the floor` : `${serviceLabel} bookings`;
  const listTitle = service === "all" ? "All bookings" : `${serviceLabel} bookings`;

  return (
    <PartnerShell activeRoute="dashboard">
      <div className="partner-floor px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--foreground)]">
                {account?.restaurantName ?? "Dashboard"}
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Bookings, covers, and billed food for this window — table, pickup, delivery, and pre-order.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="site-card flex p-1" role="group" aria-label="Time range">
                {(
                  [
                    ["d", "Day"],
                    ["w", "Week"],
                    ["m", "Month"],
                    ["a", "All"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRange(key)}
                    className={`grid h-9 min-w-9 place-items-center rounded-[6px] px-2.5 text-sm font-semibold ${
                      range === key
                        ? "bg-[var(--accent)] text-[var(--ink)]"
                        : "text-[var(--muted)]"
                    }`}
                    aria-pressed={range === key}
                    aria-label={label}
                  >
                    {key.toUpperCase()}
                  </button>
                ))}
              </div>
              {pendingApproval > 0 ? (
                <Link href="/partner/orders" className="site-btn px-4 py-2 text-sm">
                  Review {pendingApproval}
                </Link>
              ) : null}
              <Link href="/partner/kitchen" className="site-btn gap-2 px-4 py-2 text-sm">
                <ChefHat className="h-4 w-4" />
                Kitchen
              </Link>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Service filter">
            {(
              [
                ["all", "All services"],
                ["table", "Table"],
                ["pickup", "Pickup"],
                ["delivery", "Delivery"],
                ["on-the-way", "Pre-order"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setService(key)}
                className={`rounded-[8px] px-3.5 py-1.5 text-sm font-medium ${
                  service === key
                    ? "bg-[var(--accent)] text-[var(--ink)]"
                    : "site-card text-[var(--muted)]"
                }`}
                aria-pressed={service === key}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[8px] bg-[var(--accent)] p-6 text-[var(--ink)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{floorTitle}</h2>
                  <p className="mt-1 max-w-md text-sm text-[var(--ink)]/80">
                    {timeline.length} bookings · {covers} covers · avg {avgCovers} covers / day
                  </p>
                </div>
                <span className="rounded-[8px] bg-[var(--ink)]/12 px-3 py-1 text-xs font-semibold text-[var(--ink)]">
                  {pendingApproval > 0
                    ? `${pendingApproval} waiting`
                    : upcomingReservations > 0
                      ? `${upcomingReservations} still coming`
                      : "Caught up"}
                </span>
              </div>
              <p className="mt-8 text-5xl font-semibold tracking-tight tabular-nums">
                ₹{revenue.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-sm text-[var(--ink)]/80">
                {service === "all"
                  ? `Food billed in ${rangeLabel.toLowerCase()}`
                  : `Food billed for every ${serviceLabel.toLowerCase()} booking`}
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[var(--ink)]/70">Cooking now</p>
                  <p className="text-lg font-semibold tabular-nums">{activeKitchen}</p>
                </div>
                <div>
                  <p className="text-[var(--ink)]/70">Ready</p>
                  <p className="text-lg font-semibold tabular-nums">{readyCount}</p>
                </div>
                <div>
                  <p className="text-[var(--ink)]/70">FlexiSwitch</p>
                  <p className="text-lg font-semibold tabular-nums">{timeline.filter(flexiUsed).length}</p>
                </div>
              </div>
            </section>

            <section className="site-card p-6">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Service mix</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Counts and billed food in {rangeLabel.toLowerCase()}</p>
              <ul className="mt-5 space-y-4">
                {(
                  [
                    ["Table", mix.table, mix.tableRupees],
                    ["Pickup", mix.pickup, mix.pickupRupees],
                    ["Delivery", mix.delivery, mix.deliveryRupees],
                    ["Pre-order", mix["on-the-way"], mix.wayRupees],
                  ] as const
                ).map(([label, count, rupees]) => (
                  <li key={label} className="flex items-baseline justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="text-xs text-[var(--muted)]">{count} bookings</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {rupees > 0 ? `₹${rupees.toLocaleString("en-IN")}` : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Panel
              title={listTitle}
              action={<span className="text-sm text-[var(--muted)]">{timeline.length}</span>}
            >
              {timeline.length === 0 ? (
                <EmptyFloor />
              ) : (
                <ul className="-mx-2 max-h-[28rem] overflow-y-auto">
                  {timeline.map((entry) => (
                    <GuestRow
                      key={`${entry.kind}-${entry.data.id}`}
                      entry={entry}
                      tickets={tickets}
                      showDate={service !== "all" || range !== "d"}
                    />
                  ))}
                </ul>
              )}
            </Panel>
            <div className="flex flex-col gap-4">
              <Panel title="Covers by day" action={<span className="text-sm text-[var(--muted)]">{rangeLabel}</span>}>
                <CoversBars series={byDay} />
              </Panel>
              <Panel
                title="Waiting on you"
                action={
                  <Link href="/partner/orders" className="text-sm font-semibold text-[var(--accent)]">
                    Orders
                  </Link>
                }
              >
                {actionQueue.length === 0 ? (
                  <p className="py-6 text-sm text-[var(--muted)]">
                    Nothing waiting in this Day / Week / Month window. Switch the range to see the rest.
                  </p>
                ) : (
                  <ul className="-mx-2">
                    {actionQueue.map((entry, i) => (
                      <GuestRow
                      key={`wait-${entry.kind}-${entry.data.id}`}
                      entry={entry}
                      tickets={tickets}
                      highlight
                      showDate
                    />
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </PartnerShell>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={dashCard("flex min-h-[18rem] flex-col")}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

function EmptyFloor() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Clock className="mb-2 h-8 w-8 text-[var(--muted)]/40" />
      <p className="text-sm text-[var(--muted)]">Nothing in this list yet. Switch Day / Week / Month / All, or another service.</p>
    </div>
  );
}

function GuestRow({
  entry,
  tickets,
  highlight,
  showDate,
}: {
  entry: TimelineEntry;
  tickets: KitchenTicket[];
  highlight?: boolean;
  showDate?: boolean;
}) {
  const name = guestOf(entry);
  const badge = typeBadge(entry);
  const progress = progressOf(entry, tickets);
  const items = itemsOf(entry);
  const total = billRupees(entry);
  const day = entryDay(entry);
  const canRejectBooking = highlight && entry.kind === "booking" && needsAction(entry);
  const canRejectOrder = highlight && entry.kind === "order" && entry.data.approvalStatus === "PENDING";

  return (
    <li>
      <div
        className={`rounded-[8px] px-2 py-2.5 ${highlight ? "bg-[var(--background)]" : ""}`}
      >
        <Link
          href={hrefOf(entry)}
          className="flex items-start gap-3 transition-colors hover:opacity-90"
        >
          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--accent)]/12 text-xs font-semibold text-[var(--accent)]">
            {initials(name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</span>
              <span className="shrink-0 text-sm font-medium tabular-nums text-[var(--foreground)]">
                {showDate ? `${formatVisitDay(day)} · ${clockLabel(entry)}` : clockLabel(entry)}
              </span>
            </span>
            <span className="mt-0.5 block truncate text-[13px] text-[var(--muted)]">
              {badge.label}
              {" · "}
              {progress.label}
              {partyOf(entry) > 0 ? ` · ${partyOf(entry)} guests` : ""}
              {flexiUsed(entry) ? " · FlexiSwitch used" : ""}
              {total > 0 ? ` · ₹${total.toLocaleString("en-IN")}` : ""}
            </span>
            {items.length > 0 ? (
              <span className="mt-1 block truncate text-[13px] text-[var(--accent)]">
                {items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}
              </span>
            ) : null}
          </span>
        </Link>
        {canRejectBooking ? (
          <div className="mt-2 flex flex-wrap gap-2 pl-12">
            <button
              type="button"
              className="site-btn px-3 py-1 text-[12px]"
              onClick={() => approveBookingForKitchen(entry.data.id)}
            >
              Approve
            </button>
            <button
              type="button"
              className="booking-gate__stay px-3 py-1 text-[12px] text-red-700"
              onClick={() => rejectBooking(entry.data.id)}
            >
              Reject
            </button>
          </div>
        ) : null}
        {canRejectOrder ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="site-btn px-3 py-1 text-[12px]"
              onClick={() =>
                updateOrder(entry.data.id, { status: "APPROVED", approvalStatus: "APPROVED" })
              }
            >
              Approve
            </button>
            <button
              type="button"
              className="booking-gate__stay px-3 py-1 text-[12px] text-red-700"
              onClick={() =>
                updateOrder(entry.data.id, { status: "REJECTED", approvalStatus: "REJECTED" })
              }
            >
              Reject
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function CoversBars({ series }: { series: { label: string; covers: number }[] }) {
  if (series.length === 0 || series.every((point) => point.covers === 0)) {
    return <p className="py-10 text-sm text-[var(--muted)]">Covers will plot here as bookings land.</p>;
  }
  const max = Math.max(...series.map((p) => p.covers), 1);
  const first = series[0]?.label;
  const last = series[series.length - 1]?.label;

  return (
    <div>
      <div className="flex h-36 items-end gap-1">
        {series.map((point) => (
          <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <div
              className={`w-full max-w-[18px] rounded-t-[4px] ${point.covers > 0 ? "bg-[var(--accent)]" : "bg-[var(--line)]"}`}
              style={{ height: point.covers > 0 ? `${Math.max(8, (point.covers / max) * 100)}%` : "4px" }}
              title={`${formatVisitDay(point.label)} · ${point.covers} covers`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-2 text-[11px] text-[var(--muted)]">
        <span>{first ? formatVisitDay(first) : ""}</span>
        <span>{last && last !== first ? formatVisitDay(last) : ""}</span>
      </div>
    </div>
  );
}
