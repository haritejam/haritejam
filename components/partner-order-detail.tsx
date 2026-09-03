"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { getOrderById, updateOrder, ORDER_EVENT, type Order, type OrderStatus } from "@/lib/orders";
import { eventsForOrder, appendEvent, type OrderEvent } from "@/lib/order-events";
import { getTicketByOrderId, updateTicket, KITCHEN_EVENT } from "@/lib/kitchen";
import { tablesForRestaurant } from "@/lib/tables";
import { readKitchenSession } from "@/lib/partner-ops";
import { readBookings, approveBookingForKitchen, type Booking, BOOKING_EVENT } from "@/lib/bookings";
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
            {booking.kind} · {booking.visitDate} · {booking.slot}
          </p>
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
          <div className="mt-5 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                booking.kitchenStatus === "approved"
                  ? "bg-teal-100 text-teal-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {booking.kitchenStatus === "approved" ? "In kitchen" : "Pending"}
            </span>
            {booking.kitchenStatus !== "approved" && (
              <button type="button" onClick={approve} className="site-btn py-1.5 px-4 text-sm">
                Approve for kitchen
              </button>
            )}
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

  const refresh = useCallback(() => {
    const session = readKitchenSession();
    if (!session) return;
    setRestaurantId(session.restaurantId);

    // Try new-style order first
    const found = getOrderById(orderId);
    if (found && found.restaurantId === session.restaurantId) {
      setOrder(found);
      setEvents(eventsForOrder(orderId));
      if (found.tableId) {
        const tables = tablesForRestaurant(session.restaurantId);
        const t = tables.find((tbl) => tbl.id === found.tableId);
        setTableName(t?.name ?? null);
      }
      return;
    }

    // Try legacy booking
    const booking = readBookings().find(
      (b) => b.id === orderId && b.restaurantId === session.restaurantId,
    );
    if (booking) {
      setLegacyBooking(booking);
    }
  }, [orderId]);

  useEffect(() => {
    refresh();
    window.addEventListener(ORDER_EVENT, refresh);
    window.addEventListener(BOOKING_EVENT, refresh);
    window.addEventListener(KITCHEN_EVENT, refresh);
    return () => {
      window.removeEventListener(ORDER_EVENT, refresh);
      window.removeEventListener(BOOKING_EVENT, refresh);
      window.removeEventListener(KITCHEN_EVENT, refresh);
    };
  }, [refresh]);

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
    updateOrder(order.id, { status });
    const ticket = getTicketByOrderId(order.id);
    if (ticket) {
      const kitchenStatusMap: Partial<Record<OrderStatus, Parameters<typeof updateTicket>[1]["status"]>> = {
        APPROVED: "NEW",
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
                    Approve
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
