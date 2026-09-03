export const RESERVATIONS_KEY = "flexidine-reservations";
export const RESERVATION_EVENT = "flexidine-reservations";

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ARRIVING"
  | "SEATED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Reservation {
  id: string;
  restaurantId: string;
  restaurantName: string;
  guestName: string;
  guestCount: number;
  date: string; // YYYY-MM-DD
  slot: string; // HH:MM
  tableId?: string;
  status: ReservationStatus;
  notes?: string;
  linkedOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

function emitReservation() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(RESERVATION_EVENT));
  }
}

export function readReservations(): Reservation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RESERVATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Reservation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReservations(list: Reservation[]) {
  window.localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(list));
  emitReservation();
}

export function addReservation(
  reservation: Omit<Reservation, "id" | "createdAt" | "updatedAt">,
): Reservation {
  const now = new Date().toISOString();
  const next: Reservation = {
    ...reservation,
    id: `RES-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  writeReservations([next, ...readReservations()]);
  return next;
}

export function updateReservation(
  id: string,
  patch: Partial<Omit<Reservation, "id" | "restaurantId" | "createdAt">>,
): Reservation | null {
  const list = readReservations();
  let updated: Reservation | null = null;
  const next = list.map((r) => {
    if (r.id !== id) return r;
    updated = { ...r, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) return null;
  writeReservations(next);
  return updated;
}

export function reservationsForRestaurant(restaurantId: string): Reservation[] {
  return readReservations().filter((r) => r.restaurantId === restaurantId);
}

export function todayReservationsForRestaurant(restaurantId: string): Reservation[] {
  const today = new Date().toISOString().slice(0, 10);
  return reservationsForRestaurant(restaurantId).filter((r) => r.date === today);
}
