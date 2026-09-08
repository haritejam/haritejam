import { approveBookingForKitchen, bookingReadyAtIso, patchBooking, readBookings, setBookingKitchenStage, type Booking } from "@/lib/bookings";
import { pushDinerNotice } from "@/lib/diner-notifications";
import { stageFromTicket } from "@/lib/foh-status";
import {
  addTicket,
  KITCHEN_EVENT,
  readTickets,
  updateTicket,
  writeTickets,
  type KitchenTicket,
} from "@/lib/kitchen";
import { appendEvent } from "@/lib/order-events";
import { updateOrder, type OrderStatus } from "@/lib/orders";
import { getSettings } from "@/lib/restaurant-settings";
import { timingForBooking } from "@/lib/scheduling";
import { seedDefaultTables, tablesForRestaurant, updateTable } from "@/lib/tables";

export type KitchenBoardStatus = "UPCOMING" | "NEW" | "PREPARING" | "READY" | "COMPLETED";

export type KitchenOrder = KitchenTicket;

const ALLOWED_TRANSITIONS: Record<KitchenBoardStatus, KitchenBoardStatus[]> = {
  UPCOMING: ["NEW", "PREPARING"],
  NEW: ["PREPARING"],
  PREPARING: ["READY"],
  READY: ["COMPLETED"],
  COMPLETED: [],
};

function emitKitchen() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(KITCHEN_EVENT));
  }
}

function shouldCreateKitchenTicket(booking: Booking) {
  const fulfillment = bookingToFulfillment(booking);
  if (fulfillment === "DINE_IN" && booking.items.length === 0) return false;
  return true;
}

function fireAtMs(ticket: Pick<KitchenTicket, "kitchenStartAt" | "scheduledFor">) {
  return new Date(ticket.kitchenStartAt || ticket.scheduledFor || 0).getTime();
}

function bookingToOrderType(booking: Booking): KitchenTicket["orderType"] {
  if (booking.kind === "delivery") return "DELIVERY";
  if (booking.kind === "on-the-way") return "PREORDER_ON_THE_WAY";
  if (booking.kind === "pickup" && booking.slot === "asap") return "PICKUP_ASAP";
  if (booking.kind === "pickup") return "PICKUP_SCHEDULED";
  if (booking.kind === "reserve-preorder") return "PREORDER_DINE_IN";
  return "RESERVATION_ONLY";
}

function bookingToFulfillment(booking: Booking): KitchenTicket["fulfillmentType"] {
  if (booking.fulfillment) return booking.fulfillment;
  if (booking.kind === "pickup") return "PICKUP";
  if (booking.kind === "delivery") return "DELIVERY";
  return "DINE_IN";
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
    if (!ALLOWED_TRANSITIONS[current].includes(to)) {
      return { ok: false, reason: `Cannot move ${current} to ${to}.` };
    }

    const updated = updateTicket(id, { status: to });
    if (!updated) return { ok: false, reason: "Could not update ticket." };

    this.syncOrder(updated, to);
    this.syncBooking(updated, to);
    return { ok: true, ticket: updated };
  }

  promoteScheduled(restaurantId: string, now = new Date()): number {
    const tickets = readTickets();
    let changed = 0;
    const next = tickets.map((ticket) => {
      if (ticket.restaurantId !== restaurantId || ticket.status !== "UPCOMING") {
        return ticket;
      }
      if (now.getTime() >= fireAtMs(ticket)) {
        changed += 1;
        setBookingKitchenStage(ticket.orderId, "queued");
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
      (booking) => booking.restaurantId === restaurantId && booking.kitchenStatus === "approved",
    );
    if (approved.length === 0) return 0;

    const settings = getSettings(restaurantId);
    const now = Date.now();
    let created = 0;

    approved.forEach((booking) => {
      const tableId = this.ensureDineInTable(booking);
      if (!shouldCreateKitchenTicket(booking) || existingOrderIds.has(booking.id)) {
        return;
      }

      const fulfillment = bookingToFulfillment(booking);
      const times = timingForBooking(booking, settings);
      const scheduledFor = bookingReadyAtIso(booking) ?? times.estimatedReadyAt;
      const inWindow = now >= new Date(times.kitchenStartAt).getTime();

      addTicket({
        restaurantId: booking.restaurantId,
        orderId: booking.id,
        orderType: bookingToOrderType(booking),
        fulfillmentType: fulfillment,
        guestName: booking.dinerName || "Guest diner",
        guestCount: booking.guests,
        items: booking.items.map((item, index) => ({
          menuItemId: `${booking.id}-${index}`,
          name: item.name,
          quantity: item.quantity,
          unitPrice: 0,
        })),
        scheduledFor,
        kitchenStartAt: times.kitchenStartAt,
        estimatedReadyAt: times.estimatedReadyAt,
        status: inWindow ? "NEW" : "UPCOMING",
        tableId,
      });
      if (inWindow) {
        setBookingKitchenStage(booking.id, "queued");
      }
      created += 1;
    });
    return created;
  }

  private ensureDineInTable(booking: Booking): string | undefined {
    if (bookingToFulfillment(booking) !== "DINE_IN") return undefined;
    seedDefaultTables(booking.restaurantId);
    const tables = tablesForRestaurant(booking.restaurantId);
    const held = tables.find((table) => table.currentReservationId === booking.id);
    if (held) return held.id;
    const available =
      tables.find((t) => t.status === "AVAILABLE" && t.capacity >= (booking.guests || 1)) ??
      tables.find((t) => t.status === "AVAILABLE");
    if (!available) return undefined;
    updateTable(available.id, { status: "RESERVED", currentReservationId: booking.id });
    return available.id;
  }

  private syncOrder(ticket: KitchenTicket, to: KitchenBoardStatus) {
    const orderStatus: Partial<Record<KitchenBoardStatus, OrderStatus>> = {
      NEW: "QUEUED",
      PREPARING: "PREPARING",
      READY: "READY",
      COMPLETED: ticket.fulfillmentType === "PICKUP" ? "COLLECTED" : ticket.fulfillmentType === "DELIVERY" ? "READY" : "SERVED",
    };
    const eventType =
      to === "PREPARING"
        ? "PREPARING"
        : to === "READY"
          ? "READY"
          : to === "COMPLETED"
            ? ticket.fulfillmentType === "PICKUP"
              ? "COLLECTED"
              : ticket.fulfillmentType === "DELIVERY"
                ? "DISPATCHED"
                : "SERVED"
            : to === "NEW"
              ? "QUEUED"
              : undefined;
    if (orderStatus[to]) {
      updateOrder(
        ticket.orderId,
        to === "COMPLETED" && ticket.fulfillmentType === "DELIVERY"
          ? { status: "READY", dispatchStatus: "out" }
          : { status: orderStatus[to] },
      );
    }
    if (to === "COMPLETED" && ticket.fulfillmentType === "DELIVERY") {
      patchBooking(ticket.orderId, { dispatchStatus: "out" });
      const deliveryBooking = readBookings().find((item) => item.id === ticket.orderId);
      pushDinerNotice(deliveryBooking?.dinerName ?? null, ticket.orderId, {
        title: "Out for delivery",
        detail: `A rider has left ${deliveryBooking?.restaurantName ?? "the restaurant"}.`,
      });
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
      if (booking && booking.kitchenStatus === "pending") {
        approveBookingForKitchen(booking.id);
      }
    }
    emitKitchen();
  }

  private syncBooking(ticket: KitchenTicket, to: KitchenBoardStatus) {
    const booking = readBookings().find((item) => item.id === ticket.orderId);
    if (!booking) return;
    const stage = stageFromTicket(to);
    if (stage && stage !== "pending" && stage !== "rejected") {
      setBookingKitchenStage(booking.id, stage);
    }
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
