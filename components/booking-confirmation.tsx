"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BOOKING_EVENT, fulfillmentOf, getBookingById, type Booking } from "@/lib/bookings";
import { dinerOrderTypeLabel, dinerStatusCopy, dinerStatusKey, dinerStatusSteps } from "@/lib/diner-status";
import { getTicketByOrderId, KITCHEN_EVENT, type KitchenTicket } from "@/lib/kitchen";
import { getKitchenOrderRepository } from "@/lib/kitchen-order-repository";
import { mapsDirectionsUrl } from "@/lib/location";
import { ORDER_EVENT } from "@/lib/orders";
import { getLiveRestaurantById } from "@/lib/partner-ops";
import { formatSlotLabel, formatVisitDay, isAsapSlot } from "@/lib/visit-slots";
import { LocationPin } from "@/components/icons";
import { DinerFlexiSwitch } from "@/components/diner-flexiswitch";
import { BookingPaymentSummary } from "@/components/booking-payment-summary";
import { livePreorderCopy, onTheWayMenuHref, onTheWayWindow } from "@/lib/preorder-window";
import { getSettings } from "@/lib/restaurant-settings";

function openDirections(destination: string) {
  const url = mapsDirectionsUrl(destination);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = url;
  }
}

function venueQuery(booking: Booking, neighborhood?: string, city?: string) {
  return [booking.restaurantName, neighborhood, city].filter(Boolean).join(", ");
}

export function BookingConfirmation({ id }: { id: string }) {
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [ticket, setTicket] = useState<KitchenTicket | undefined>(undefined);

  useEffect(() => {
    function sync() {
      const next = getBookingById(id) ?? null;
      setBooking(next);
      if (next) {
        getKitchenOrderRepository().hydrateLegacyApprovals(next.restaurantId);
        getKitchenOrderRepository().promoteScheduled(next.restaurantId);
        setTicket(getTicketByOrderId(next.id));
      } else {
        setTicket(undefined);
      }
    }
    sync();
    window.addEventListener(BOOKING_EVENT, sync);
    window.addEventListener(KITCHEN_EVENT, sync);
    window.addEventListener(ORDER_EVENT, sync);
    window.addEventListener("storage", sync);
    const timer = window.setInterval(sync, 2500);
    return () => {
      window.removeEventListener(BOOKING_EVENT, sync);
      window.removeEventListener(KITCHEN_EVENT, sync);
      window.removeEventListener(ORDER_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.clearInterval(timer);
    };
  }, [id]);

  if (booking === undefined) {
    return (
      <section className="site-section bg-background text-foreground">
        <div className="site-wrap">
          <p className="text-sm text-muted">Loading your confirmation…</p>
        </div>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="site-section bg-background text-foreground">
        <div className="site-wrap max-w-lg">
          <h1 className="site-h1">Booking not found</h1>
          <p className="site-lead">This confirmation is not on this device.</p>
          <Link href="/restaurants" className="site-btn mt-6 inline-flex">
            Browse restaurants
          </Link>
        </div>
      </section>
    );
  }

  const restaurant = getLiveRestaurantById(booking.restaurantId);
  const settings = getSettings(booking.restaurantId);
  const pickup = fulfillmentOf(booking) === "PICKUP";
  const delivery = fulfillmentOf(booking) === "DELIVERY";
  const reservationOnly = !pickup && !delivery && booking.items.length === 0;
  const when = isAsapSlot(booking.slot)
    ? "ASAP"
    : `${formatVisitDay(booking.visitDate)} at ${formatSlotLabel(booking.slot)}`;
  const orderType = dinerOrderTypeLabel(booking);
  const status = dinerStatusCopy(booking, ticket);
  const steps = dinerStatusSteps(booking);
  const currentKey = dinerStatusKey(booking, ticket);
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === currentKey),
  );
  const destination = venueQuery(booking, restaurant?.neighborhood, restaurant?.location);
  const rejected = booking.kitchenStatus === "rejected";

  return (
    <section className="site-section bg-background text-foreground" data-header-skin="canvas">
      <div className="site-wrap max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Thanks for choosing FlexiDine</p>
        <h1 className="site-h1 mt-3">You are all set</h1>
        <p className="mt-4 text-lg leading-8 text-muted">
          {pickup
            ? `See you soon at the ${booking.restaurantName} counter.`
            : delivery
              ? booking.dispatchStatus === "delivered"
                ? `Delivered from ${booking.restaurantName}.`
                : booking.dispatchStatus === "out"
                  ? `Your order is on the way from ${booking.restaurantName}.`
                  : `Delivery from ${booking.restaurantName} is confirmed.`
              : booking.kind === "on-the-way"
                ? `Table is held. Pre-order on the way until 10 minutes before you sit at ${booking.restaurantName}.`
                : booking.kind === "reserve"
                  ? `See you soon at ${booking.restaurantName}. We will keep reminding you that you can pre-order on the way until 10 minutes before your table.`
                  : `See you soon at ${booking.restaurantName}. Your dishes are already on this booking.`}
        </p>

        <div className="site-card mt-10 space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Venue</p>
              <p className="mt-1 text-xl font-semibold tracking-tight">{booking.restaurantName}</p>
              {restaurant ? (
                <p className="mt-1 text-sm text-muted">
                  {restaurant.neighborhood}, {restaurant.location}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border border-line bg-background px-3 py-2 text-sm font-semibold text-foreground"
              onClick={() => openDirections(destination)}
            >
              <LocationPin className="h-4 w-4 text-accent" />
              Directions
            </button>
          </div>

          <div className="border-t border-line pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Order type</p>
            <p className="mt-1 text-base font-medium">{orderType}</p>
            <p className="mt-1 text-sm text-muted">{when}</p>
          </div>

          <div className="border-t border-line pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Order status</p>
            <p className="mt-1 text-base font-medium">{status.label}</p>
            <p className="mt-1 text-sm text-muted">{status.detail}</p>
            {!rejected ? (
              <ol className="mt-4 space-y-2">
                {steps.map((step, index) => {
                  const reached = index <= currentIndex;
                  return (
                    <li
                      key={step.key}
                      className={`flex items-center gap-3 text-sm ${reached ? "text-foreground" : "text-muted"}`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold ${
                          reached ? "bg-accent text-ink" : "border border-line"
                        }`}
                      >
                        {index + 1}
                      </span>
                      {step.label}
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </div>

          {!pickup && !delivery ? (
            <div className="border-t border-line pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Party</p>
              <p className="mt-1 text-base">
                {booking.guests} {booking.guests === 1 ? "person" : "people"}
              </p>
            </div>
          ) : null}

          {delivery && booking.deliveryAddress ? (
            <div className="border-t border-line pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Deliver to</p>
              <p className="mt-1 text-sm leading-6">{booking.deliveryAddress}</p>
            </div>
          ) : null}

          {booking.items.length > 0 ? (
            <div className="border-t border-line pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {pickup ? "Order" : delivery ? "Delivery order" : booking.kind === "on-the-way" || booking.kind === "reserve" ? "Dishes so far" : "Your dishes"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {booking.items.map((item) => (
                  <li key={`${item.name}-${item.quantity}`}>
                    {item.quantity} × {item.name}
                  </li>
                ))}
              </ul>
              {booking.totalRupees > 0 ? <BookingPaymentSummary booking={booking} /> : null}
            </div>
          ) : null}

          <DinerFlexiSwitch booking={booking} />

          {!pickup && !delivery && livePreorderCopy(booking) ? (
            <Link
              href={onTheWayWindow(booking).open ? onTheWayMenuHref(booking) : `/booking/${booking.id}`}
              className="block rounded-[6px] border border-accent/40 bg-accent/10 px-4 py-3"
            >
              <p className="text-sm font-semibold text-foreground">{livePreorderCopy(booking)?.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{livePreorderCopy(booking)?.detail}</p>
              {onTheWayWindow(booking).open ? (
                <p className="mt-2 text-sm font-semibold text-accent">Open the restaurant menu</p>
              ) : null}
            </Link>
          ) : null}

          <p className="rounded-[6px] bg-accent/15 px-4 py-3 text-sm leading-6 text-foreground">
            {reservationOnly
              ? settings.dineInDiscountPercent > 0
                ? `No pre-order bill on this table. Pay the restaurant bill with FlexiDine to avail the ${settings.dineInDiscountPercent}% dine-in offer.`
                : "No pre-order bill on this table. Pay the restaurant bill with FlexiDine."
              : booking.dueAtRestaurantRupees && booking.dueAtRestaurantRupees > 0
                ? `Pay the remaining ₹${booking.dueAtRestaurantRupees.toLocaleString("en-IN")} with FlexiDine at the restaurant. This amount is already after discount.`
                : booking.paymentPlan === "full"
                  ? "Paid in full. Show this confirmation at the restaurant."
                  : "The bill on this booking is already after discount. Pay any remaining amount with FlexiDine at the restaurant."}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/account/bookings" className="site-btn">
            View bookings
          </Link>
          <Link href="/restaurants" className="booking-gate__stay">
            Find another restaurant
          </Link>
        </div>
      </div>
    </section>
  );
}
