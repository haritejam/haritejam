export const ORDER_EVENTS_KEY = "flexidine-order-events";

export type OrderEventType =
  | "ORDER_CREATED"
  | "APPROVED"
  | "REJECTED"
  | "QUEUED"
  | "KITCHEN_STARTED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COLLECTED"
  | "COMPLETED"
  | "CANCELLED"
  | "FLEXISWITCH_REQUESTED"
  | "FLEXISWITCH_APPROVED"
  | "FLEXISWITCH_REJECTED"
  | "FULFILLMENT_CHANGED"
  | "TABLE_ASSIGNED"
  | "RESERVATION_LINKED"
  | "NOTE_ADDED";

export interface OrderEvent {
  id: string;
  orderId: string;
  restaurantId: string;
  type: OrderEventType;
  note?: string;
  actor?: string; // "staff" | "customer" | "system"
  createdAt: string;
}

export function readEvents(): OrderEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDER_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OrderEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendEvent(
  event: Omit<OrderEvent, "id" | "createdAt">,
): OrderEvent {
  const next: OrderEvent = {
    ...event,
    id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const list = readEvents();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ORDER_EVENTS_KEY, JSON.stringify([next, ...list]));
  }
  return next;
}

export function eventsForOrder(orderId: string): OrderEvent[] {
  return readEvents()
    .filter((e) => e.orderId === orderId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
