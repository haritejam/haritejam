"use client";

import Link from "next/link";
import { dinerOrderTypeLabel, dinerOrderTypeTone, dinerStatusChip, dinerStatusCopy, dinerStatusKey, dinerStatusSteps } from "@/lib/diner-status";
import { getTicketByOrderId, type KitchenTicket } from "@/lib/kitchen";
import type { Booking } from "@/lib/bookings";
import { formatSlotLabel, formatVisitDay } from "@/lib/visit-slots";
import { OrderSlipItems } from "@/components/order-slip-items";
import { BookingPaymentSummary } from "@/components/booking-payment-summary";
import { onTheWayMenuHref, onTheWayWindow } from "@/lib/preorder-window";
import { flexiSwitchOfferCopy } from "@/lib/flexiswitch";
import { SwitchIcon } from "@/components/icons";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function DinerBookingCard({
  booking,
  showItems = false,
}: {
  booking: Booking;
  showItems?: boolean;
}) {
  const ticket = getTicketByOrderId(booking.id);
  return <DinerBookingCardView booking={booking} ticket={ticket} showItems={showItems} />;
}

function StatusPipeline({
  booking,
  ticket,
}: {
  booking: Booking;
  ticket?: KitchenTicket;
}) {
  const key = dinerStatusKey(booking, ticket);
  const copy = dinerStatusCopy(booking, ticket);
  const steps = dinerStatusSteps(booking);
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === key),
  );

  if (key === "rejected") {
    return <p className="text-sm leading-6 text-red-800">{copy.detail}</p>;
  }

  return (
    <ol
      className="grid w-full gap-x-2 gap-y-2"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, index) => {
        const reached = index <= currentIndex;
        const current = index === currentIndex;
        return (
          <li key={step.key} className="flex min-w-0 flex-col items-center text-center">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold ${
                current
                  ? "bg-accent text-ink ring-4 ring-[var(--accent)]/20"
                  : reached
                    ? "bg-accent text-ink"
                    : "border border-line text-muted"
              }`}
            >
              {index + 1}
            </span>
            <p
              className={`mt-2 text-[11px] leading-snug ${
                current ? "font-semibold text-foreground" : reached ? "text-foreground" : "text-muted"
              }`}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function DinerBookingCardView({
  booking,
  ticket,
  showItems = false,
}: {
  booking: Booking;
  ticket?: KitchenTicket;
  showItems?: boolean;
}) {
  const copy = dinerStatusCopy(booking, ticket);
  const chip = dinerStatusChip(dinerStatusKey(booking, ticket), booking);

  return (
    <li className="site-card p-5">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground">{booking.restaurantName}</p>
              <p className="mt-1 text-xs text-muted">{formatWhen(booking.createdAt)}</p>
              <p className="mt-2">
                <span
                  className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-semibold ${dinerOrderTypeTone(booking)}`}
                >
                  {dinerOrderTypeLabel(booking)}
                </span>
              </p>
              {booking.visitDate && booking.slot ? (
                <p className="mt-1 text-sm text-accent">
                  {formatVisitDay(booking.visitDate)} · {formatSlotLabel(booking.slot)}
                </p>
              ) : null}
              {booking.kind !== "pickup" && booking.guests > 0 ? (
                <p className="mt-1 text-sm text-muted">
                  {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
                </p>
              ) : null}
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${chip.className}`}
            >
              {chip.label}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-muted">{copy.detail}</p>
          {showItems ? <OrderSlipItems items={booking.items} restaurantId={booking.restaurantId} /> : null}
          {booking.totalRupees > 0 ? <BookingPaymentSummary booking={booking} /> : null}
          <div className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted">
            <SwitchIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{flexiSwitchOfferCopy(booking)}</span>
          </div>
          <Link href={`/booking/${booking.id}`} className="mt-4 inline-block text-sm font-semibold text-accent">
            View confirmation
          </Link>
          {onTheWayWindow(booking).open ? (
            <Link href={onTheWayMenuHref(booking)} className="mt-2 block text-sm font-semibold text-accent">
              Pre-order on the way · open menu
            </Link>
          ) : null}
        </div>

        <StatusPipeline booking={booking} ticket={ticket} />
      </div>
    </li>
  );
}
