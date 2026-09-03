import type { FulfillmentType, OrderItem, OrderType } from "./orders";

export const KITCHEN_TICKETS_KEY = "flexidine-kitchen-tickets";
export const KITCHEN_EVENT = "flexidine-kitchen-tickets";

export type KitchenTicketStatus = "UPCOMING" | "NEW" | "PREPARING" | "READY" | "COMPLETED" | "DONE";

export interface KitchenTicket {
  id: string;
  restaurantId: string;
  orderId: string;
  orderType: OrderType;
  fulfillmentType: FulfillmentType;
  guestName: string;
  guestCount: number;
  tableId?: string;
  items: OrderItem[];
  scheduledFor?: string;
  kitchenStartAt: string;
  estimatedReadyAt: string;
  status: KitchenTicketStatus;
  flexiSwitched?: boolean;
  createdAt: string;
  updatedAt: string;
}

function emitKitchen() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(KITCHEN_EVENT));
  }
}

function normalizeStatus(status: KitchenTicketStatus | string | undefined): KitchenTicketStatus {
  if (status === "DONE") return "COMPLETED";
  if (
    status === "UPCOMING" ||
    status === "NEW" ||
    status === "PREPARING" ||
    status === "READY" ||
    status === "COMPLETED"
  ) {
    return status;
  }
  return "NEW";
}

export function readTickets(): KitchenTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KITCHEN_TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as KitchenTicket[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((ticket) => ({
      ...ticket,
      status: normalizeStatus(ticket.status),
    }));
  } catch {
    return [];
  }
}

export function writeTickets(list: KitchenTicket[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KITCHEN_TICKETS_KEY, JSON.stringify(list));
  emitKitchen();
}

export function ticketsForRestaurant(restaurantId: string): KitchenTicket[] {
  return readTickets().filter((t) => t.restaurantId === restaurantId);
}

export function addTicket(
  ticket: Omit<KitchenTicket, "id" | "createdAt" | "updatedAt">,
): KitchenTicket {
  const now = new Date().toISOString();
  const next: KitchenTicket = {
    ...ticket,
    id: `KT-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  writeTickets([next, ...readTickets()]);
  return next;
}

export function updateTicket(
  id: string,
  patch: Partial<Omit<KitchenTicket, "id" | "restaurantId" | "createdAt">>,
): KitchenTicket | null {
  const list = readTickets();
  let updated: KitchenTicket | null = null;
  const next = list.map((t) => {
    if (t.id !== id) return t;
    updated = { ...t, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) return null;
  writeTickets(next);
  return updated;
}

export function getTicketByOrderId(orderId: string): KitchenTicket | undefined {
  return readTickets().find((t) => t.orderId === orderId);
}
