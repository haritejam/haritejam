"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { getOrderById, updateOrder, ORDER_EVENT, type Order, type OrderStatus } from "@/lib/orders";
import { eventsForOrder, appendEvent, type OrderEvent } from "@/lib/order-events";
import { getTicketByOrderId, updateTicket, KITCHEN_EVENT } from "@/lib/kitchen";
import { getKitchenOrderRepository } from "@/lib/kitchen-order-repository";
import { fohStageChip, stageFromTicket } from "@/lib/foh-status";
import { tablesForRestaurant } from "@/lib/tables";
import { readKitchenSession, PARTNER_EVENT } from "@/lib/partner-ops";
import { readBookings, approveBookingForKitchen, rejectBooking, type Booking, BOOKING_EVENT, fulfillmentOf } from "@/lib/bookings";
import { approveFlexiSwitch, markDelivered, rejectFlexiSwitch, switchLabel } from "@/lib/flexiswitch";
import { PartnerShell } from "@/components/partner-shell";

const STATUS_COLOR: Record<string, string> = {
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

const EVENT_LABELS: Record<string, string> = {
  ORDER_CREATED: "Order created",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  QUEUED: "Queued for kitchen",
  KITCHEN_STARTED: "Kitchen started",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  COLLECTED: "Collected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  FLEXISWITCH_REQUESTED: "FlexiSwitch requested",
  FLEXISWITCH_APPROVED: "FlexiSwitch",
  FLEXISWITCH_REJECTED: "FlexiSwitch rejected",
  FULFILLMENT_CHANGED: "Fulfillment changed",
  TABLE_ASSIGNED: "Table assigned",
  DISPATCH_ASSIGNED: "Dispatch assigned",
  DISPATCH_CANCELLED: "Dispatch cancelled",
  DISPATCHED: "Out for delivery",
  DELIVERED: "Delivered",
  RESERVATION_LINKED: "Reservation linked",
  NOTE_ADDED: "Note",
};

function formatDT(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderTimeline({ events }: { events: OrderEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
        Timeline
      </h3>
      <ol className="space-y-0">
        {events.map((ev, i) => (
          <motion.li
            key={ev.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex gap-3"
          >
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
              {i < events.length - 1 && (
                <div className="w-px flex-1 bg-[var(--line)] min-h-[1.5rem]" />
              )}
            </div>
            <div className="pb-4">
              <p className="text-[11px] text-[var(--muted)]">{formatDT(ev.createdAt)}</p>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {EVENT_LABELS[ev.type] ?? ev.type}
              </p>
              {ev.note && <p className="text-xs text-[var(--muted)]">{ev.note}</p>}
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

// ── Legacy booking view ──────────────────────────────────────────
function LegacyBookingView({ booking }: { booking: Booking }) {
  function approve() {
    approveBookingForKitchen(booking.id);
    window.dispatchEvent(new Event(BOOKING_EVENT));
  }

  function reject() {
    rejectBooking(booking.id);
    window.dispatchEvent(new Event(BOOKING_EVENT));
  }

  const kitchenTicket = getTicketByOrderId(booking.id);
  const stage =
    booking.kitchenStatus === "rejected"
      ? "rejected"
      : booking.kitchenStatus !== "approved"
        ? "pending"
        : (stageFromTicket(kitchenTicket?.status) ?? booking.kitchenStage ?? "accepted");
  const chip = fohStageChip(stage, fulfillmentOf(booking) === "DELIVERY" ? "delivery" : fulfillmentOf(booking) === "PICKUP", booking.dispatchStatus);

  return (
    <PartnerShell activeRoute="orders">
      <div className="px-5 py-8 sm:px-8 max-w-2xl mx-auto">
        <Link
          href="/partner/orders"
          className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Orders
        </Link>
        <div className="site-card p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Legacy booking
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {booking.dinerName || "Guest diner"}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {switchLabel(fulfillmentOf(booking))} · {booking.kind}
            {booking.kind === "on-the-way" && booking.etaMinutes ? ` · ${booking.etaMinutes} min ETA` : ""}
            {booking.visitDate ? ` · ${booking.visitDate}` : ""} · {booking.slot}
          </p>
          {booking.deliveryAddress ? (
            <p className="mt-2 text-sm text-[var(--muted)]">Deliver to {booking.deliveryAddress}</p>
          ) : null}
          {booking.items.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-[var(--muted)]">
              {booking.items.map((item) => (
                <li key={item.name}>
                  {item.quantity} × {item.name}
                </li>
              ))}
            </ul>
          )}
          {booking.totalRupees > 0 && (
            <p className="mt-3 font-medium text-[var(--foreground)]">
              ₹{booking.totalRupees.toLocaleString("en-IN")}
            </p>
          )}
          {booking.flexiSwitchRequest ? (
            <div className="mt-5 rounded-[6px] border border-[var(--line)] p-4">
              <p className="text-sm font-medium">
                FlexiSwitch requested: {switchLabel(booking.flexiSwitchRequest.from)} → {switchLabel(booking.flexiSwitchRequest.to)}
              </p>
              {booking.flexiSwitchRequest.deliveryAddress ? (
                <p className="mt-1 text-sm text-[var(--muted)]">{booking.flexiSwitchRequest.deliveryAddress}</p>
              ) : null}
              {booking.flexiSwitchRequest.quotedChargeRupees ? (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Quoted ₹{booking.flexiSwitchRequest.quotedChargeRupees.toLocaleString("en-IN")}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => approveFlexiSwitch(booking.id)} className="site-btn py-1.5 px-4 text-sm">
                  Approve switch
                </button>
                <button
                  type="button"
                  onClick={() => rejectFlexiSwitch(booking.id)}
                  className="booking-gate__stay py-1.5 px-4 text-sm text-red-700"
                >
                  Keep current
                </button>
              </div>
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${chip.className}`}
            >
              {chip.label}
            </span>
            {booking.kitchenStatus !== "approved" && booking.kitchenStatus !== "rejected" && (
              <>
                <button type="button" onClick={approve} className="site-btn py-1.5 px-4 text-sm">
                  Confirm booking
                </button>
                <button
                  type="button"
                  onClick={reject}
                  className="booking-gate__stay py-1.5 px-4 text-sm text-red-700"
                >
                  Reject
                </button>
              </>
            )}
            {booking.kitchenStatus === "approved" &&
            fulfillmentOf(booking) === "DELIVERY" &&
            booking.dispatchStatus === "out" ? (
              <button type="button" onClick={() => markDelivered(booking.id)} className="site-btn py-1.5 px-4 text-sm">
                Mark delivered
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </PartnerShell>
  );
}

// ── Main order detail ──────────────────────────────────────────
export function PartnerOrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [legacyBooking, setLegacyBooking] = useState<Booking | null>(null);
  const [restaurantId, setRestaurantId] = useState("");
  const [tableName, setTableName] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const refresh = useCallback(() => {
    const session = readKitchenSession();
    if (!session) {
      setSessionReady(false);
      return;
    }
    setSessionReady(true);
    setRestaurantId(session.restaurantId);

    // Try new-style order first
    const found = getOrderById(orderId);
    if (found && found.restaurantId === session.restaurantId) {
      setOrder(found);
      setLegacyBooking(null);
      setEvents(eventsForOrder(orderId));
      if (found.tableId) {
        const tables = tablesForRestaurant(session.restaurantId);
        const t = tables.find((tbl) => tbl.id === found.tableId);
        setTableName(t?.name ?? null);
      }
      return;
    }

    setOrder(null);

    // Try legacy booking
    const booking = readBookings().find(
      (b) => b.id === orderId && b.restaurantId === session.restaurantId,
    );
    setLegacyBooking(booking ?? null);
  }, [orderId]);

  useEffect(() => {
    refresh();
    window.addEventListener(ORDER_EVENT, refresh);
    window.addEventListener(BOOKING_EVENT, refresh);
    window.addEventListener(KITCHEN_EVENT, refresh);
    window.addEventListener(PARTNER_EVENT, refresh);
    return () => {
      window.removeEventListener(ORDER_EVENT, refresh);
      window.removeEventListener(BOOKING_EVENT, refresh);
      window.removeEventListener(KITCHEN_EVENT, refresh);
      window.removeEventListener(PARTNER_EVENT, refresh);
    };
  }, [refresh]);

  if (!sessionReady) {
    return (
      <PartnerShell activeRoute="orders">
        <div className="px-5 py-8 sm:px-8">
          <p className="text-sm text-[var(--muted)]">Loading order…</p>
        </div>
      </PartnerShell>
    );
  }

  if (legacyBooking) return <LegacyBookingView booking={legacyBooking} />;

  if (!order) {
    return (
      <PartnerShell activeRoute="orders">
        <div className="px-5 py-8 sm:px-8">
          <Link
            href="/partner/orders"
            className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Orders
          </Link>
          <p className="text-sm text-[var(--muted)]">Order not found.</p>
        </div>
      </PartnerShell>
    );
  }

  function doUpdate(status: OrderStatus, eventType: string, note?: string) {
    if (!order) return;
    updateOrder(order.id, {
      status,
      ...(status === "APPROVED" || status === "REJECTED" ? { approvalStatus: status } : {}),
    });
    const ticket = getTicketByOrderId(order.id);
    if (status === "APPROVED") {
      getKitchenOrderRepository().hydrateLegacyApprovals(order.restaurantId);
      getKitchenOrderRepository().promoteScheduled(order.restaurantId);
    } else if (ticket) {
      const kitchenStatusMap: Partial<Record<OrderStatus, Parameters<typeof updateTicket>[1]["status"]>> = {
        QUEUED: "NEW",
        PREPARING: "PREPARING",
        READY: "READY",
        SERVED: "COMPLETED",
        COLLECTED: "COMPLETED",
        COMPLETED: "COMPLETED",
      };
      const ks = kitchenStatusMap[status];
      if (ks) updateTicket(ticket.id, { status: ks });
    }
    appendEvent({
      orderId: order.id,
      restaurantId,
      type: eventType as Parameters<typeof appendEvent>[0]["type"],
      note,
      actor: "staff",
    });
    refresh();
  }

  const ticket = getTicketByOrderId(order.id);

  return (
    <PartnerShell activeRoute="orders">
      <div className="px-5 py-8 sm:px-8 max-w-2xl mx-auto">
        <Link
          href="/partner/orders"
          className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Orders
        </Link>

        <div className="space-y-4">
          {/* Header card */}
          <div className="site-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {order.id}
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                  {order.guestName}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {order.orderType.replace(/_/g, " ")} ·{" "}
                  {order.fulfillmentType}
                  {order.flexiSwitchHistory?.length
                    ? ` (FlexiSwitched from ${order.flexiSwitchHistory[0]})`
                    : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                  STATUS_COLOR[order.status] ?? "bg-[var(--muted)]/10 text-[var(--muted)]"
                }`}
              >
                {order.status}
              </span>
            </div>

            {/* Meta */}
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {order.scheduledFor && (
                <>
                  <dt className="text-[var(--muted)]">Scheduled</dt>
                  <dd className="font-medium">{formatDT(order.scheduledFor)}</dd>
                </>
              )}
              {tableName && (
                <>
                  <dt className="text-[var(--muted)]">Table</dt>
                  <dd className="font-medium">{tableName}</dd>
                </>
              )}
              {order.estimatedReadyAt && (
                <>
                  <dt className="text-[var(--muted)]">Est. ready</dt>
                  <dd className="font-medium">{formatDT(order.estimatedReadyAt)}</dd>
                </>
              )}
              <dt className="text-[var(--muted)]">Payment</dt>
              <dd className="font-medium">{order.paymentStatus}</dd>
            </dl>

            {/* Items */}
            {order.items.length > 0 && (
              <div className="mt-5 border-t border-[var(--line)] pt-4">
                <ul className="space-y-1.5">
                  {order.items.map((item) => (
                    <li key={item.menuItemId} className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">
                        {item.quantity} × {item.name}
                      </span>
                      <span className="font-medium">
                        ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between text-sm font-semibold border-t border-[var(--line)] pt-3">
                  <span>Total</span>
                  <span>₹{order.totalRupees.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-wrap gap-2">
              {order.approvalStatus === "PENDING" && (
                <>
                  <button
                    type="button"
                    onClick={() => doUpdate("APPROVED", "APPROVED")}
                    className="site-btn py-2 px-4 text-sm"
                  >
                    Confirm booking
                  </button>
                  <button
                    type="button"
                    onClick={() => doUpdate("REJECTED", "REJECTED")}
                    className="site-card py-2 px-4 text-sm text-red-600 hover:bg-[var(--background)]"
                  >
                    Reject
                  </button>
                </>
              )}
              {order.status === "READY" && order.fulfillmentType === "DINE_IN" && (
                <button
                  type="button"
                  onClick={() => doUpdate("SERVED", "SERVED")}
                  className="site-btn py-2 px-4 text-sm"
                >
                  Mark served
                </button>
              )}
              {order.status === "READY" && order.fulfillmentType === "PICKUP" && (
                <button
                  type="button"
                  onClick={() => doUpdate("COLLECTED", "COLLECTED")}
                  className="site-btn py-2 px-4 text-sm"
                >
                  Mark collected
                </button>
              )}
              {order.fulfillmentType === "DELIVERY" && order.dispatchStatus === "out" && (
                <button
                  type="button"
                  onClick={() => {
                    updateOrder(order.id, { status: "DELIVERED", dispatchStatus: "delivered" });
                    appendEvent({
                      orderId: order.id,
                      restaurantId,
                      type: "DELIVERED",
                      actor: "staff",
                    });
                    refresh();
                  }}
                  className="site-btn py-2 px-4 text-sm"
                >
                  Mark delivered
                </button>
              )}
            </div>
          </div>

          {/* Kitchen ticket card */}
          {ticket && (
            <div className="site-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)] mb-2">
                Kitchen ticket
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{ticket.id}</p>
                <span
                  className={`rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                    ticket.status === "READY" ? "bg-green-100 text-green-800"
                    : ticket.status === "PREPARING" ? "bg-blue-100 text-blue-800"
                    : ticket.status === "NEW" ? "bg-amber-100 text-amber-800"
                    : "bg-[var(--muted)]/10 text-[var(--muted)]"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
              {ticket.flexiSwitched && (
                <p className="mt-2 text-xs text-[var(--accent)] font-medium">FlexiSwitched</p>
              )}
            </div>
          )}

          {/* Timeline */}
          {events.length > 0 && (
            <div className="site-card p-5">
              <OrderTimeline events={events} />
            </div>
          )}
        </div>
      </div>
    </PartnerShell>
  );
}
