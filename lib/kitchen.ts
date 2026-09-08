import type { FulfillmentType, OrderItem, OrderType } from "./orders";

export const KITCHEN_TICKETS_KEY = "flexidine-kitchen-tickets";
export const KITCHEN_EVENT = "flexidine-kitchen-tickets";

export type KitchenTicketStatus = "UPCOMING" | "NEW" | "PREPARING" | "READY" | "COMPLETED" | "DONE";

/** True once the ticket has left the scheduled lane and is on the kitchen board. */
export function kitchenHasFired(status?: KitchenTicketStatus | null) {
  return Boolean(status && status !== "UPCOMING");
}

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

function dedupeTickets(list: KitchenTicket[]): KitchenTicket[] {
  const byOrder = new Map<string, KitchenTicket>();
  for (const ticket of list) {
    const key = `${ticket.restaurantId}:${ticket.orderId || ticket.id}`;
    const existing = byOrder.get(key);
    if (!existing || new Date(ticket.updatedAt) >= new Date(existing.updatedAt)) {
      byOrder.set(key, ticket);
    }
  }
  const usedIds = new Set<string>();
  const unique: KitchenTicket[] = [];
  for (const ticket of byOrder.values()) {
    let id = ticket.id;
    if (usedIds.has(id)) {
      id = `${ticket.id}-${ticket.orderId}`;
    }
    usedIds.add(id);
    unique.push(id === ticket.id ? ticket : { ...ticket, id });
  }
  return unique;
}

export function readTickets(): KitchenTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KITCHEN_TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as KitchenTicket[];
    if (!Array.isArray(parsed)) return [];
    return dedupeTickets(
      parsed.map((ticket) => ({
        ...ticket,
        status: normalizeStatus(ticket.status),
      })),
    );
  } catch {
    return [];
  }
}

export function writeTickets(list: KitchenTicket[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KITCHEN_TICKETS_KEY, JSON.stringify(dedupeTickets(list)));
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
    id: `KT-${ticket.orderId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
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
