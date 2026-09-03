export const BOOKINGS_KEY = "flexidine-bookings";
export const BOOKING_EVENT = "flexidine-bookings";

export type BookingKind = "reserve" | "reserve-preorder" | "pickup";

export interface Booking {
  id: string;
  restaurantId: string;
  restaurantName: string;
  dinerName?: string;
  kind: BookingKind;
  guests: number;
  items: { name: string; quantity: number }[];
  totalRupees: number;
  visitDate: string;
  slot: string;
  createdAt: string;
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
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addBooking(booking: Omit<Booking, "id" | "createdAt">) {
  const next: Booking = {
    ...booking,
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify([next, ...readBookings()]));
  window.dispatchEvent(new Event(BOOKING_EVENT));
}

export function isOrder(kind: BookingKind) {
  return kind === "pickup" || kind === "reserve-preorder";
}
