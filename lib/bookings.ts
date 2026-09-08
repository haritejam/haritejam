export const BOOKINGS_KEY = "flexidine-bookings";
export const BOOKING_EVENT = "flexidine-bookings";

export type BookingKind = "reserve" | "reserve-preorder" | "on-the-way" | "pickup" | "delivery";
export type BookingFulfillment = "DINE_IN" | "PICKUP" | "DELIVERY";
export type DispatchStatus = "queued" | "assigned" | "out" | "delivered" | "recalled";

export type KitchenStatus = "pending" | "approved" | "rejected";
export type KitchenStage = "queued" | "preparing" | "ready" | "completed";

export interface FlexiSwitchRequest {
  from: BookingFulfillment;
  to: BookingFulfillment;
  requestedAt: string;
  deliveryAddress?: string;
  etaMinutes?: number;
  quotedChargeRupees?: number;
  quotedDiscountPercent?: number;
}

export interface Booking {
  id: string;
  restaurantId: string;
  restaurantName: string;
  dinerName?: string;
  kind: BookingKind;
  guests: number;
  items: { name: string; quantity: number; unitPriceRupees?: number }[];
  subtotalRupees?: number;
  discountPercent?: number;
  packingRupees?: number;
  totalRupees: number;
  visitDate: string;
  slot: string;
  createdAt: string;
  kitchenStatus?: KitchenStatus;
  kitchenStage?: KitchenStage;
  fulfillment?: BookingFulfillment;
  etaMinutes?: number;
  deliveryAddress?: string;
  dispatchStatus?: DispatchStatus;
  flexiSwitchRequest?: FlexiSwitchRequest | null;
  conversionChargeRupees?: number;
  flexiSwitchHistory?: BookingFulfillment[];
  paymentPlan?: "deposit" | "full";
  paidNowRupees?: number;
  dueAtRestaurantRupees?: number;
}

export function fulfillmentOf(booking: Booking): BookingFulfillment {
  if (booking.fulfillment) return booking.fulfillment;
  if (booking.kind === "pickup") return "PICKUP";
  if (booking.kind === "delivery") return "DELIVERY";
  return "DINE_IN";
}

/** Seating / pickup / delivery clock used to decide when the kitchen should fire. */
export function bookingReadyAtIso(booking: Booking): string | undefined {
  if (booking.visitDate && booking.slot && booking.slot !== "eta" && booking.slot !== "asap") {
    return `${booking.visitDate}T${booking.slot}:00`;
  }
  if ((booking.kind === "on-the-way" || booking.kind === "reserve" || booking.kind === "reserve-preorder") && booking.etaMinutes) {
    return new Date(new Date(booking.createdAt).getTime() + booking.etaMinutes * 60_000).toISOString();
  }
  return undefined;
}

function withKitchenStatus(booking: Booking): Booking {
  if (booking.kitchenStatus === "approved" || booking.kitchenStatus === "rejected") {
    return booking;
  }
  return { ...booking, kitchenStatus: "pending" };
}

export function readBookings(): Booking[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(BOOKINGS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as Booking[];
    return Array.isArray(parsed) ? parsed.map(withKitchenStatus) : [];
  } catch {
    return [];
  }
}

export function addBooking(booking: Omit<Booking, "id" | "createdAt" | "kitchenStatus">): Booking {
  const next: Booking = {
    ...booking,
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    kitchenStatus: "pending",
    fulfillment:
      booking.fulfillment ??
      (booking.kind === "pickup" ? "PICKUP" : booking.kind === "delivery" ? "DELIVERY" : "DINE_IN"),
  };
  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify([next, ...readBookings()]));
  window.dispatchEvent(new Event(BOOKING_EVENT));
  return next;
}

export function getBookingById(id: string): Booking | undefined {
  return readBookings().find((booking) => booking.id === id);
}

export function bookingsForDiner(username: string | null): Booking[] {
  if (!username) {
    return [];
  }
  const name = username.trim().toLowerCase();
  return readBookings().filter((booking) => (booking.dinerName ?? "").trim().toLowerCase() === name);
}

/** Restaurant confirmation for the diner. Does not fire the kitchen ticket. */
export function approveBookingForKitchen(id: string) {
  const next = readBookings().map((booking) =>
    booking.id === id
      ? { ...booking, kitchenStatus: "approved" as const, flexiSwitchRequest: null }
      : booking,
  );
  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(BOOKING_EVENT));
}

export function setBookingKitchenStage(id: string, kitchenStage: KitchenStage) {
  const next = readBookings().map((booking) =>
    booking.id === id ? { ...booking, kitchenStage } : booking,
  );
  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(BOOKING_EVENT));
}

export function rejectBooking(id: string) {
  const next = readBookings().map((booking) =>
    booking.id === id ? { ...booking, kitchenStatus: "rejected" as const } : booking,
  );
  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(BOOKING_EVENT));
}

export function patchBooking(id: string, patch: Partial<Omit<Booking, "id" | "createdAt">>): Booking | null {
  if (typeof window === "undefined") return null;
  let updated: Booking | null = null;
  const next = readBookings().map((booking) => {
    if (booking.id !== id) return booking;
    updated = { ...booking, ...patch };
    return updated;
  });
  if (!updated) return null;
  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(BOOKING_EVENT));
  return updated;
}

export function isPendingBooking(booking: Booking) {
  return booking.kitchenStatus !== "approved" && booking.kitchenStatus !== "rejected";
}

export function isPendingFlexiSwitch(booking: Booking) {
  return Boolean(booking.flexiSwitchRequest);
}

export function needsPartnerAttention(booking: Booking) {
  return isPendingBooking(booking) || isPendingFlexiSwitch(booking);
}

export function isOrder(kind: BookingKind) {
  return (
    kind === "pickup" ||
    kind === "reserve-preorder" ||
    kind === "on-the-way" ||
    kind === "delivery" ||
    kind === "reserve"
  );
}
