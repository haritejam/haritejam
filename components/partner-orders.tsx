"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Search } from "lucide-react";
import {
  approveBookingForKitchen,
  BOOKING_EVENT,
  type Booking,
} from "@/lib/bookings";
import {
  bookingsForRestaurant,
  PARTNER_EVENT,
  readKitchenSession,
  type KitchenAccount,
} from "@/lib/partner-ops";
import { ordersForRestaurant, ORDER_EVENT, type Order } from "@/lib/orders";
import { PartnerShell } from "@/components/partner-shell";
import { formatSlotLabel, formatVisitDay } from "@/lib/visit-slots";

type FilterTab =
  | "all"
  | "needs-approval"
  | "dine-in"
  | "pre-order"
  | "pickup"
  | "ready";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs-approval", label: "Needs approval" },
  { id: "dine-in", label: "Dine-in" },
  { id: "pre-order", label: "Pre-order" },
  { id: "pickup", label: "Pickup" },
  { id: "ready", label: "Ready" },
];

// ── Legacy booking card ──────────────────────────────────────────
function LegacyCard({ ticket }: { ticket: Booking }) {
  const approved = ticket.kitchenStatus === "approved";

  function handleApprove() {
    approveBookingForKitchen(ticket.id);
  }

  const overdue =
    !approved &&
    ticket.visitDate &&
    ticket.slot &&
    new Date(`${ticket.visitDate}T${ticket.slot}:00`).getTime() < Date.now();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
      className="site-card px-4 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {ticket.visitDate && ticket.slot
                ? `${formatVisitDay(ticket.visitDate)} · ${formatSlotLabel(ticket.slot)}`
                : "Walk-in"}
            </p>
            {overdue && (
              <span className="flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-semibold">
                <Clock className="h-3 w-3" />
                Overdue
              </span>
            )}
          </div>
          <Link
            href={`/partner/orders/${ticket.id}`}
            className="mt-1 block text-base font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
          >
            {ticket.dinerName || "Guest diner"}
          </Link>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            {ticket.guests > 0 && `${ticket.guests} guests · `}
            {ticket.kind === "pickup"
              ? "Pickup"
              : ticket.kind === "reserve-preorder"
                ? "Pre-order"
                : "Reservation"}
          </p>
          {ticket.items.length > 0 && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              {ticket.items
                .map((i) => `${i.quantity}× ${i.name}`)
                .join(", ")}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {ticket.totalRupees > 0 && (
            <p className="text-sm font-medium text-[var(--foreground)]">
              ₹{ticket.totalRupees.toLocaleString("en-IN")}
            </p>
          )}
          {approved ? (
            <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              In kitchen
            </span>
          ) : (
            <button
              type="button"
              onClick={handleApprove}
              className="site-btn py-1.5 px-3 text-[12px]"
            >
              Approve for kitchen
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// ── New-style order card ──────────────────────────────────────────
const ORDER_STATUS_CHIP: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-teal-100 text-teal-800",
  QUEUED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-blue-100 text-blue-800",
  READY: "bg-green-100 text-green-800",
  SERVED: "bg-[var(--muted)]/10 text-[var(--muted)]",
  COLLECTED: "bg-[var(--muted)]/10 text-[var(--muted)]",
  COMPLETED: "bg-[var(--muted)]/10 text-[var(--muted)]",
  CANCELLED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
};

function NewOrderCard({ order }: { order: Order }) {
  const overdue =
    order.estimatedReadyAt &&
    new Date(order.estimatedReadyAt).getTime() < Date.now() &&
    order.status !== "READY" &&
    order.status !== "SERVED" &&
    order.status !== "COLLECTED" &&
    order.status !== "COMPLETED";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
      className="site-card px-4 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {order.id}
            </p>
            {overdue && (
              <span className="flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-semibold">
                <Clock className="h-3 w-3" />
                Overdue
              </span>
            )}
            {order.flexiSwitchHistory?.length ? (
              <span className="rounded-full bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold">
                FlexiSwitched
              </span>
            ) : null}
          </div>
          <Link
            href={`/partner/orders/${order.id}`}
            className="mt-1 block text-base font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
          >
            {order.guestName}
          </Link>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            {order.orderType.replace(/_/g, " ").toLowerCase()} ·{" "}
            {order.fulfillmentType.toLowerCase()}
            {order.scheduledFor
              ? ` · ${new Date(order.scheduledFor).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {order.totalRupees > 0 && (
            <p className="text-sm font-medium text-[var(--foreground)]">
              ₹{order.totalRupees.toLocaleString("en-IN")}
            </p>
          )}
          <span
            className={`rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${ORDER_STATUS_CHIP[order.status] ?? ""}`}
          >
            {order.status}
          </span>
          <Link
            href={`/partner/orders/${order.id}`}
            className="text-[11px] font-medium text-[var(--accent)] hover:underline"
          >
            View →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

// ── Main component ──────────────────────────────────────────────
export function PartnerOrders() {
  const [account, setAccount] = useState<KitchenAccount | null>(null);
  const [legacyTickets, setLegacyTickets] = useState<Booking[]>([]);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const refresh = useCallback(() => {
    const session = readKitchenSession();
    if (!session) return;
    setAccount(session);
    setLegacyTickets(bookingsForRestaurant(session.restaurantId));
    setNewOrders(ordersForRestaurant(session.restaurantId));
  }, []);

  useEffect(() => {
    refresh();
    const events = [BOOKING_EVENT, ORDER_EVENT, PARTNER_EVENT];
    events.forEach((e) => window.addEventListener(e, refresh));
    window.addEventListener("storage", refresh);
    return () => {
      events.forEach((e) => window.removeEventListener(e, refresh));
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  // Filter & search legacy tickets
  const filteredLegacy = useMemo(() => {
    let list = legacyTickets;
    if (filter === "needs-approval") list = list.filter((t) => t.kitchenStatus !== "approved");
    else if (filter === "dine-in") list = list.filter((t) => t.kind === "reserve");
    else if (filter === "pre-order") list = list.filter((t) => t.kind === "reserve-preorder");
    else if (filter === "pickup") list = list.filter((t) => t.kind === "pickup");
    else if (filter === "ready") list = list.filter((t) => t.kitchenStatus === "approved");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          (t.dinerName ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [legacyTickets, filter, search]);

  // Filter & search new orders
  const filteredNew = useMemo(() => {
    let list = newOrders;
    if (filter === "needs-approval") list = list.filter((o) => o.approvalStatus === "PENDING");
    else if (filter === "dine-in") list = list.filter((o) => o.fulfillmentType === "DINE_IN");
    else if (filter === "pre-order") list = list.filter((o) => o.orderType === "PREORDER_DINE_IN");
    else if (filter === "pickup") list = list.filter((o) => o.fulfillmentType === "PICKUP");
    else if (filter === "ready") list = list.filter((o) => o.status === "READY");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.guestName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [newOrders, filter, search]);

  const pendingCount =
    legacyTickets.filter((t) => t.kitchenStatus !== "approved").length +
    newOrders.filter((o) => o.approvalStatus === "PENDING").length;

  return (
    <PartnerShell activeRoute="orders">
      <div className="px-5 py-8 sm:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Front of house
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Order management
          </h1>
          {pendingCount > 0 && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              {pendingCount} {pendingCount === 1 ? "ticket" : "tickets"} waiting for approval.
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <input
            type="search"
            placeholder="Search by order ID or guest name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[6px] border border-[var(--line)] bg-[var(--background)] pl-9 pr-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0.5 mb-5 overflow-x-auto border-b border-[var(--line)] pb-0">
          {FILTER_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                filter === id
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
              {id === "needs-approval" && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-100 text-amber-800 px-1.5 text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results */}
        {filteredNew.length === 0 && filteredLegacy.length === 0 ? (
          <div className="site-card p-8 text-center">
            <p className="text-sm text-[var(--muted)]">No orders match this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredNew.map((order) => (
                <NewOrderCard key={order.id} order={order} />
              ))}
              {filteredLegacy.map((ticket) => (
                <LegacyCard key={ticket.id} ticket={ticket} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PartnerShell>
  );
}
