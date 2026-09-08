import { fulfillmentOf, type Booking } from "./bookings";
import { getTicketByOrderId } from "./kitchen";
import { getSettings } from "./restaurant-settings";
import { formatSlotLabel, formatVisitDay, isAsapSlot } from "./visit-slots";

export function tableBookingTimeMs(booking: Booking): number | null {
  if (!booking.visitDate || !booking.slot || isAsapSlot(booking.slot) || booking.slot === "eta") {
    return null;
  }
  const time = new Date(`${booking.visitDate}T${booking.slot}:00`).getTime();
  return Number.isFinite(time) ? time : null;
}

export function isOnTheWayEligible(booking: Booking) {
  if (booking.kitchenStatus === "rejected") return false;
  if (fulfillmentOf(booking) !== "DINE_IN") return false;
  return booking.kind === "reserve" || booking.kind === "on-the-way";
}

export function preorderCutoffMs(booking: Booking, now = Date.now()) {
  const seating = tableBookingTimeMs(booking);
  if (seating == null) return null;
  const cutoffMinutes = getSettings(booking.restaurantId).preOrderCutoffMinutes;
  void now;
  return seating - cutoffMinutes * 60_000;
}

export function onTheWayWindow(booking: Booking, now = Date.now()) {
  const seating = tableBookingTimeMs(booking);
  const cutoff = preorderCutoffMs(booking, now);
  const cutoffMinutes = getSettings(booking.restaurantId).preOrderCutoffMinutes;
  if (seating == null || cutoff == null) {
    return {
      eligible: false,
      open: false,
      remainingMs: 0,
      seatingAt: null as string | null,
      cutoffAt: null as string | null,
      cutoffMinutes,
      remainingLabel: "",
    };
  }
  const ticket = typeof window === "undefined" ? undefined : getTicketByOrderId(booking.id);
  const kitchenLocked =
    ticket?.status === "PREPARING" ||
    ticket?.status === "READY" ||
    ticket?.status === "COMPLETED" ||
    ticket?.status === "DONE";
  const remainingMs = cutoff - now;
  const open = remainingMs > 0 && !kitchenLocked;
  const mins = Math.max(0, Math.ceil(remainingMs / 60_000));
  return {
    eligible: isOnTheWayEligible(booking),
    open: open && isOnTheWayEligible(booking),
    remainingMs,
    seatingAt: new Date(seating).toISOString(),
    cutoffAt: new Date(cutoff).toISOString(),
    cutoffMinutes,
    remainingLabel:
      remainingMs <= 0
        ? "closed"
        : mins < 60
          ? `${mins} min`
          : `${Math.floor(mins / 60)}h ${mins % 60}m`,
    seatingLabel: `${formatVisitDay(booking.visitDate)} at ${formatSlotLabel(booking.slot)}`,
  };
}

export function livePreorderCopy(booking: Booking, now = Date.now()) {
  const window = onTheWayWindow(booking, now);
  if (!window.eligible) return null;
  if (!window.open) {
    return {
      title: "Pre-order on the way is closed",
      detail: `Last cutoff was ${window.cutoffMinutes} min before your table time (${window.seatingLabel}).`,
      stage: "closed" as const,
    };
  }
  return {
    title: "You can still pre-order on the way",
    detail: `Before you reach ${booking.restaurantName}, add dishes. Last cutoff is ${window.cutoffMinutes} min before ${window.seatingLabel} · ${window.remainingLabel} left.`,
    stage: window.remainingMs <= 12 * 60_000 ? ("urgent" as const) : ("open" as const),
  };
}

export function onTheWayMenuHref(booking: Booking) {
  return `/restaurants/${booking.restaurantId}?intent=on-the-way&booking=${booking.id}`;
}
