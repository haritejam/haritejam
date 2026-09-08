"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Search } from "lucide-react";
import {
  approveBookingForKitchen,
  BOOKING_EVENT,
  fulfillmentOf,
  isPendingFlexiSwitch,
  needsPartnerAttention,
  rejectBooking,
  type Booking,
} from "@/lib/bookings";
import { approveFlexiSwitch, markDelivered, rejectFlexiSwitch, switchLabel } from "@/lib/flexiswitch";
import { bookingsForRestaurant, PARTNER_EVENT, readKitchenSession } from "@/lib/partner-ops";
import { ordersForRestaurant, ORDER_EVENT, updateOrder, type Order, type OrderStatus } from "@/lib/orders";
import { appendEvent } from "@/lib/order-events";
import { getTicketByOrderId, KITCHEN_EVENT } from "@/lib/kitchen";
import { getKitchenOrderRepository } from "@/lib/kitchen-order-repository";
import { fohStageChip, stageFromOrderStatus, stageFromTicket } from "@/lib/foh-status";
import { PartnerShell } from "@/components/partner-shell";
import { OrderSlipItems } from "@/components/order-slip-items";
import { formatSlotLabel, formatVisitDay, isAsapSlot } from "@/lib/visit-slots";

type FilterTab =
  | "all"
  | "needs-approval"
  | "reservation"
  | "pre-order"
  | "scheduled-pickup"
  | "asap-pickup"
  | "delivery";

type OrderLane = "reservation" | "pre-order" | "scheduled-pickup" | "asap-pickup" | "delivery";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs-approval", label: "Needs approval" },
  { id: "reservation", label: "Reservation" },
  { id: "pre-order", label: "Pre-order" },
  { id: "scheduled-pickup", label: "Scheduled pickup" },
  { id: "asap-pickup", label: "ASAP pickup" },
  { id: "delivery", label: "Delivery" },
];

function isOrderLane(id: FilterTab): id is OrderLane {
  return (
    id === "reservation" ||
    id === "pre-order" ||
    id === "scheduled-pickup" ||
    id === "asap-pickup" ||
    id === "delivery"
  );
}

function bookingLane(ticket: Booking): OrderLane {
  const fulfillment = fulfillmentOf(ticket);
  if (fulfillment === "DELIVERY" || ticket.kind === "delivery") return "delivery";
  if (fulfillment === "PICKUP" || ticket.kind === "pickup") {
    return isAsapSlot(ticket.slot) ? "asap-pickup" : "scheduled-pickup";
  }
  if (ticket.kind === "reserve-preorder" || ticket.kind === "on-the-way" || ticket.items.length > 0) return "pre-order";
  return "reservation";
}

function orderLane(order: Order): OrderLane {
  if (order.fulfillmentType === "DELIVERY" || order.orderType === "DELIVERY") return "delivery";
  if (order.fulfillmentType === "PICKUP" || order.orderType === "PICKUP_ASAP" || order.orderType === "PICKUP_SCHEDULED") {
    return order.orderType === "PICKUP_ASAP" ? "asap-pickup" : "scheduled-pickup";
  }
  if (order.orderType === "PREORDER_DINE_IN" || order.orderType === "PREORDER_ON_THE_WAY" || order.items.length > 0) {
    return "pre-order";
  }
  return "reservation";
}

// ── Legacy booking card ──────────────────────────────────────────
function LegacyCard({ ticket }: { ticket: Booking }) {
  const approved = ticket.kitchenStatus === "approved";
  const rejected = ticket.kitchenStatus === "rejected";
  const kitchenTicket = getTicketByOrderId(ticket.id);
  const stage = rejected
    ? "rejected"
    : !approved
      ? "pending"
      : (stageFromTicket(kitchenTicket?.status) ?? ticket.kitchenStage ?? "accepted");
  const chip = fohStageChip(
    stage,
    fulfillmentOf(ticket) === "DELIVERY" ? "delivery" : fulfillmentOf(ticket) === "PICKUP",
    ticket.dispatchStatus,
  );

  function handleApprove() {
    approveBookingForKitchen(ticket.id);
  }

  function handleReject() {
    rejectBooking(ticket.id);
  }

  const overdue =
    !approved &&
    !rejected &&
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
            {ticket.kind === "on-the-way"
              ? `On the way${ticket.etaMinutes ? ` · ${ticket.etaMinutes} min` : ""}`
              : fulfillmentOf(ticket) === "DELIVERY" || ticket.kind === "delivery"
                ? isAsapSlot(ticket.slot)
                  ? "Delivery · ASAP"
                  : "Delivery"
                : ticket.kind === "pickup"
              ? isAsapSlot(ticket.slot)
                ? "Pickup · ASAP"
                : "Pickup"
              : ticket.kind === "reserve-preorder"
                ? "Pre-order"
                : "Reservation"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {ticket.totalRupees > 0 && (
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--foreground)]">
                ₹{ticket.totalRupees.toLocaleString("en-IN")}
              </p>
              {ticket.dueAtRestaurantRupees && ticket.dueAtRestaurantRupees > 0 ? (
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  Paid ₹{(ticket.paidNowRupees ?? 0).toLocaleString("en-IN")} · due ₹
                  {ticket.dueAtRestaurantRupees.toLocaleString("en-IN")}
                </p>
              ) : ticket.paymentPlan === "full" ? (
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">Paid in full</p>
              ) : null}
            </div>
          )}
          {isPendingFlexiSwitch(ticket) ? (
            <div className="flex flex-wrap justify-end gap-2">
              <p className="w-full text-right text-[11px] text-[var(--accent)]">
                FlexiSwitch → {switchLabel(ticket.flexiSwitchRequest!.to)}
                {ticket.flexiSwitchRequest?.quotedChargeRupees
                  ? ` · ₹${ticket.flexiSwitchRequest.quotedChargeRupees.toLocaleString("en-IN")}`
                  : ""}
              </p>
              <button type="button" onClick={() => approveFlexiSwitch(ticket.id)} className="site-btn py-1.5 px-3 text-[12px]">
                Approve switch
              </button>
              <button
                type="button"
                onClick={() => rejectFlexiSwitch(ticket.id)}
                className="booking-gate__stay py-1.5 px-3 text-[12px] text-red-700"
              >
                Keep current
              </button>
            </div>
          ) : null}
          {approved && fulfillmentOf(ticket) === "DELIVERY" && ticket.dispatchStatus === "out" ? (
            <button type="button" onClick={() => markDelivered(ticket.id)} className="site-btn py-1.5 px-3 text-[12px]">
              Mark delivered
            </button>
          ) : null}
          {approved && !isPendingFlexiSwitch(ticket) ? (
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${chip.className}`}
            >
              {chip.label}
            </span>
          ) : rejected ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-800">
              Rejected
            </span>
          ) : !approved && !rejected ? (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleApprove}
                className="site-btn py-1.5 px-3 text-[12px]"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="booking-gate__stay py-1.5 px-3 text-[12px] text-red-700"
              >
                Reject
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <OrderSlipItems items={ticket.items} restaurantId={ticket.restaurantId} />
    </motion.article>
  );
}

// ── New-style order card ──────────────────────────────────────────
function staffSetOrderStatus(order: Order, status: OrderStatus, eventType: "APPROVED" | "REJECTED") {
  updateOrder(order.id, {
    status,
    approvalStatus: status === "APPROVED" || status === "REJECTED" ? status : order.approvalStatus,
  });
  const ticket = getTicketByOrderId(order.id);
  if (ticket && status === "APPROVED") {
    getKitchenOrderRepository().hydrateLegacyApprovals(order.restaurantId);
    getKitchenOrderRepository().promoteScheduled(order.restaurantId);
  }
  appendEvent({
    orderId: order.id,
    restaurantId: order.restaurantId,
    type: eventType,
    actor: "staff",
  });
}

function NewOrderCard({ order }: { order: Order }) {
  const pending = order.approvalStatus === "PENDING";
  const kitchenTicket = getTicketByOrderId(order.id);
  const stage = pending
    ? "pending"
    : (stageFromTicket(kitchenTicket?.status) ??
      stageFromOrderStatus(order.status, order.approvalStatus));
  const chip = fohStageChip(stage, order.fulfillmentType === "DELIVERY" ? "delivery" : order.fulfillmentType === "PICKUP", order.dispatchStatus);
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
          {pending ? (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => staffSetOrderStatus(order, "APPROVED", "APPROVED")}
                className="site-btn py-1.5 px-3 text-[12px]"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => staffSetOrderStatus(order, "REJECTED", "REJECTED")}
                className="booking-gate__stay py-1.5 px-3 text-[12px] text-red-700"
              >
                Reject
              </button>
            </div>
          ) : (
            <>
              <span
                className={`rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${chip.className}`}
              >
                {chip.label}
              </span>
              <Link
                href={`/partner/orders/${order.id}`}
                className="text-[11px] font-medium text-[var(--accent)] hover:underline"
              >
                View →
              </Link>
            </>
          )}
        </div>
      </div>
      <OrderSlipItems items={order.items} restaurantId={order.restaurantId} />
    </motion.article>
  );
}

// ── Main component ──────────────────────────────────────────────
export function PartnerOrders() {
  const [legacyTickets, setLegacyTickets] = useState<Booking[]>([]);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const refresh = useCallback(() => {
    const session = readKitchenSession();
    if (!session) return;
    getKitchenOrderRepository().hydrateLegacyApprovals(session.restaurantId);
    getKitchenOrderRepository().promoteScheduled(session.restaurantId);
    setLegacyTickets(bookingsForRestaurant(session.restaurantId));
    setNewOrders(ordersForRestaurant(session.restaurantId));
  }, []);

  useEffect(() => {
    refresh();
    const events = [BOOKING_EVENT, ORDER_EVENT, PARTNER_EVENT, KITCHEN_EVENT];
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
    if (filter === "needs-approval") list = list.filter((t) => needsPartnerAttention(t));
    else if (isOrderLane(filter)) list = list.filter((t) => bookingLane(t) === filter);

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
    else if (isOrderLane(filter)) list = list.filter((o) => orderLane(o) === filter);

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
    legacyTickets.filter((t) => needsPartnerAttention(t)).length +
    newOrders.filter((o) => o.approvalStatus === "PENDING").length;

  const pendingByLane = useMemo(() => {
    const counts: Record<OrderLane, number> = {
      reservation: 0,
      "pre-order": 0,
      "scheduled-pickup": 0,
      "asap-pickup": 0,
      delivery: 0,
    };
    for (const ticket of legacyTickets) {
      if (needsPartnerAttention(ticket)) counts[bookingLane(ticket)] += 1;
    }
    for (const order of newOrders) {
      if (order.approvalStatus === "PENDING") counts[orderLane(order)] += 1;
    }
    return counts;
  }, [legacyTickets, newOrders]);

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
              {(() => {
                const count =
                  id === "needs-approval" ? pendingCount : isOrderLane(id) ? pendingByLane[id] : 0;
                if (count <= 0) return null;
                return (
                  <span className="ml-1.5 rounded-full bg-amber-100 text-amber-800 px-1.5 text-[10px] font-bold">
                    {count}
                  </span>
                );
              })()}
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
