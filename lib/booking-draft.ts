import { addBooking, type Booking } from "@/lib/bookings";

export const PENDING_BOOKING_KEY = "flexidine-pending-booking";

export type PendingBooking = Omit<Booking, "id" | "createdAt" | "kitchenStatus" | "dinerName"> & {
  returnTo: string;
};

export function savePendingBooking(draft: PendingBooking) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(draft));
}

export function readPendingBooking(): PendingBooking | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_BOOKING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingBooking;
  } catch {
    return null;
  }
}

export function clearPendingBooking() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_BOOKING_KEY);
}

export function fulfillPendingBooking(dinerName: string): Booking | null {
  const draft = readPendingBooking();
  if (!draft) {
    return null;
  }
  const { returnTo: _returnTo, ...payload } = draft;
  const booking = addBooking({ ...payload, dinerName });
  clearPendingBooking();
  return booking;
}
