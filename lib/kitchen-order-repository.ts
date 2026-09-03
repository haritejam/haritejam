import { approveBookingForKitchen, readBookings, type Booking } from "@/lib/bookings";
import {
  addTicket,
  KITCHEN_EVENT,
  readTickets,
  updateTicket,
  writeTickets,
  type KitchenTicket,
  type KitchenTicketStatus,
} from "@/lib/kitchen";
import { appendEvent } from "@/lib/order-events";
import { updateOrder, type OrderStatus } from "@/lib/orders";
import { getSettings } from "@/lib/restaurant-settings";

export type KitchenBoardStatus = "UPCOMING" | "NEW" | "PREPARING" | "READY" | "COMPLETED";

export type KitchenOrder = KitchenTicket;

const ALLOWED_TRANSITIONS: Record<KitchenBoardStatus, KitchenBoardStatus | null> = {
  UPCOMING: "NEW",
  NEW: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
  COMPLETED: null,
};

function emitKitchen() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(KITCHEN_EVENT));
  }
}

function scheduledAt(ticket: Pick<KitchenTicket, "scheduledFor" | "kitchenStartAt">) {
  return ticket.scheduledFor ?? ticket.kitchenStartAt;
}

function leadWindowStart(scheduledFor: string, leadMinutes: number) {
  return new Date(scheduledFor).getTime() - leadMinutes * 60_000;
}

function bookingScheduledIso(booking: Booking) {
  if (booking.visitDate && booking.slot) {
    return `${booking.visitDate}T${booking.slot}:00`;
  }
  return booking.createdAt;
}

function bookingToOrderType(booking: Booking): KitchenTicket["orderType"] {
  if (booking.kind === "pickup") return "PICKUP_SCHEDULED";
  if (booking.kind === "reserve-preorder") return "PREORDER_DINE_IN";
  return "RESERVATION_ONLY";
}

function bookingToFulfillment(booking: Booking): KitchenTicket["fulfillmentType"] {
  return booking.kind === "pickup" ? "PICKUP" : "DINE_IN";
}

export interface KitchenTransitionResult {
  ok: boolean;
  reason?: string;
  ticket?: KitchenOrder;
}

export interface KitchenOrderRepository {
  listActive(restaurantId: string): KitchenOrder[];
  getById(id: string): KitchenOrder | null;
  transition(id: string, restaurantId: string, to: KitchenBoardStatus): KitchenTransitionResult;
  promoteScheduled(restaurantId: string, now?: Date): number;
  hydrateLegacyApprovals(restaurantId: string): number;
}

export class LocalKitchenOrderRepository implements KitchenOrderRepository {
  listActive(restaurantId: string): KitchenOrder[] {
    this.hydrateLegacyApprovals(restaurantId);
    this.promoteScheduled(restaurantId);
    return readTickets().filter(
      (ticket) => ticket.restaurantId === restaurantId && ticket.status !== "COMPLETED" && ticket.status !== "DONE",
    );
  }

  getById(id: string): KitchenOrder | null {
    return readTickets().find((ticket) => ticket.id === id) ?? null;
  }

  transition(id: string, restaurantId: string, to: KitchenBoardStatus): KitchenTransitionResult {
    const ticket = readTickets().find((item) => item.id === id);
    if (!ticket) return { ok: false, reason: "Ticket not found." };
    if (ticket.restaurantId !== restaurantId) return { ok: false, reason: "Access denied." };

    const current = (ticket.status === "DONE" ? "COMPLETED" : ticket.status) as KitchenBoardStatus;
    if (ALLOWED_TRANSITIONS[current] !== to) {
      return { ok: false, reason: `Cannot move ${current} to ${to}.` };
    }

    const updated = updateTicket(id, { status: to });
    if (!updated) return { ok: false, reason: "Could not update ticket." };

    this.syncOrder(updated, to);
    return { ok: true, ticket: updated };
  }

  promoteScheduled(restaurantId: string, now = new Date()): number {
    const settings = getSettings(restaurantId);
    const leadMinutes = settings.preparationLeadTimeMinutes ?? 20;
    const tickets = readTickets();
    let changed = 0;
    const next = tickets.map((ticket) => {
      if (ticket.restaurantId !== restaurantId || ticket.status !== "UPCOMING") {
        return ticket;
      }
      const target = scheduledAt(ticket);
      if (now.getTime() >= leadWindowStart(target, leadMinutes)) {
        changed += 1;
        return { ...ticket, status: "NEW" as const, updatedAt: now.toISOString() };
      }
      return ticket;
    });
    if (changed > 0) {
      writeTickets(next);
    }
    return changed;
  }

  hydrateLegacyApprovals(restaurantId: string): number {
    const existingOrderIds = new Set(readTickets().map((ticket) => ticket.orderId));
    const approved = readBookings().filter(
      (booking) =>
        booking.restaurantId === restaurantId &&
        booking.kitchenStatus === "approved" &&
        !existingOrderIds.has(booking.id),
    );
    if (approved.length === 0) return 0;

    const settings = getSettings(restaurantId);
    const leadMinutes = settings.preparationLeadTimeMinutes ?? 20;
    const now = Date.now();

    approved.forEach((booking) => {
      const scheduledFor = bookingScheduledIso(booking);
      const inWindow = now >= leadWindowStart(scheduledFor, leadMinutes);
      const estimatedReadyAt = new Date(
        new Date(scheduledFor).getTime() + settings.asapPrepMinutes * 60_000,
      ).toISOString();
      addTicket({
        restaurantId: booking.restaurantId,
        orderId: booking.id,
        orderType: bookingToOrderType(booking),
        fulfillmentType: bookingToFulfillment(booking),
        guestName: booking.dinerName || "Guest diner",
        guestCount: booking.guests,
        items: booking.items.map((item, index) => ({
          menuItemId: `${booking.id}-${index}`,
          name: item.name,
          quantity: item.quantity,
          unitPrice: 0,
        })),
        scheduledFor,
        kitchenStartAt: new Date(leadWindowStart(scheduledFor, leadMinutes)).toISOString(),
        estimatedReadyAt,
        status: inWindow ? "NEW" : "UPCOMING",
      });
    });
    return approved.length;
  }

  private syncOrder(ticket: KitchenTicket, to: KitchenBoardStatus) {
    const orderStatus: Partial<Record<KitchenBoardStatus, OrderStatus>> = {
      NEW: "QUEUED",
      PREPARING: "PREPARING",
      READY: "READY",
      COMPLETED: ticket.fulfillmentType === "PICKUP" ? "COLLECTED" : "SERVED",
    };
    const eventType =
      to === "PREPARING"
        ? "PREPARING"
        : to === "READY"
          ? "READY"
          : to === "COMPLETED"
            ? ticket.fulfillmentType === "PICKUP"
              ? "COLLECTED"
              : "SERVED"
            : to === "NEW"
              ? "QUEUED"
              : undefined;
    if (orderStatus[to]) {
      updateOrder(ticket.orderId, { status: orderStatus[to] });
    }
    if (eventType) {
      appendEvent({
        orderId: ticket.orderId,
        restaurantId: ticket.restaurantId,
        type: eventType,
        actor: "staff",
      });
    }
    if (to === "COMPLETED") {
      const booking = readBookings().find((item) => item.id === ticket.orderId);
      if (booking && booking.kitchenStatus !== "approved") {
        approveBookingForKitchen(booking.id);
      }
    }
    emitKitchen();
  }
}

/**
 * Swap this factory for DatabaseKitchenOrderRepository when a backend exists.
 * UI should only import getKitchenOrderRepository() — never localStorage.
 */
let kitchenOrderRepository: KitchenOrderRepository | null = null;

export function getKitchenOrderRepository(): KitchenOrderRepository {
  if (!kitchenOrderRepository) {
    kitchenOrderRepository = new LocalKitchenOrderRepository();
  }
  return kitchenOrderRepository;
}

export function setKitchenOrderRepository(next: KitchenOrderRepository) {
  kitchenOrderRepository = next;
}

/** Production stub — implement against the real API later without changing kitchen UI. */
export class DatabaseKitchenOrderRepository implements KitchenOrderRepository {
  listActive(): KitchenOrder[] {
    throw new Error("DatabaseKitchenOrderRepository is not wired yet.");
  }
  getById(): KitchenOrder | null {
    throw new Error("DatabaseKitchenOrderRepository is not wired yet.");
  }
  transition(): KitchenTransitionResult {
    throw new Error("DatabaseKitchenOrderRepository is not wired yet.");
  }
  promoteScheduled(): number {
    throw new Error("DatabaseKitchenOrderRepository is not wired yet.");
  }
  hydrateLegacyApprovals(): number {
    throw new Error("DatabaseKitchenOrderRepository is not wired yet.");
  }
}
