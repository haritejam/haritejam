import type { Booking } from "@/lib/bookings";
import { fulfillmentOf } from "@/lib/bookings";
import type { KitchenTicket, KitchenTicketStatus } from "@/lib/kitchen";
import { isAsapSlot } from "@/lib/visit-slots";

export function dinerOrderTypeTone(booking: Booking) {
  const fulfillment = fulfillmentOf(booking);
  if (fulfillment === "DELIVERY" || booking.kind === "delivery") {
    return isAsapSlot(booking.slot)
      ? "bg-violet-100 text-violet-900"
      : "bg-violet-50 text-violet-800 ring-1 ring-violet-200";
  }
  if (fulfillment === "PICKUP" || booking.kind === "pickup") {
    return isAsapSlot(booking.slot) ? "bg-amber-100 text-amber-900" : "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
  }
  if (booking.kind === "on-the-way") return "bg-sky-100 text-sky-900";
  if (booking.kind === "reserve-preorder") return "bg-teal-100 text-teal-900";
  return "bg-[var(--accent)]/12 text-[var(--accent)]";
}

export function dinerOrderTypeLabel(booking: Booking) {
  const fulfillment = fulfillmentOf(booking);
  if (booking.kind === "on-the-way" && fulfillment === "DINE_IN") {
    return "Table · pre-order on the way";
  }
  if (fulfillment === "DELIVERY" || booking.kind === "delivery") {
    return isAsapSlot(booking.slot) ? "Delivery · ASAP" : "Delivery · scheduled";
  }
  if (fulfillment === "PICKUP" || booking.kind === "pickup") {
    return isAsapSlot(booking.slot) ? "Pickup ASAP" : "Pickup · scheduled";
  }
  if (booking.kind === "reserve-preorder") {
    return "Table with pre-order";
  }
  return "Table reservation";
}

export type DinerStatusKey =
  | "awaiting"
  | "rejected"
  | "accepted"
  | "preparing"
  | "ready"
  | "done";

export function dinerStatusSteps(booking: Booking) {
  const fulfillment = fulfillmentOf(booking);
  const kitchenFlow = booking.kind !== "reserve" || Boolean(booking.items.length);
  const ready =
    fulfillment === "PICKUP"
      ? "Ready for pickup"
      : fulfillment === "DELIVERY"
        ? "Out for delivery"
        : "Ready for the table";
  const done =
    fulfillment === "PICKUP" ? "Collected" : fulfillment === "DELIVERY" ? "Delivered" : "Served";
  if (!kitchenFlow && booking.kind === "reserve") {
    return [
      { key: "awaiting" as const, label: "Waiting for restaurant" },
      { key: "accepted" as const, label: "Accepted" },
    ];
  }
  return [
    { key: "awaiting" as const, label: "Waiting for restaurant" },
    { key: "accepted" as const, label: "Accepted" },
    { key: "preparing" as const, label: "Preparing" },
    { key: "ready" as const, label: ready },
    { key: "done" as const, label: done },
  ];
}

function ticketPhase(status: KitchenTicketStatus | undefined): DinerStatusKey | null {
  if (!status) return null;
  if (status === "NEW" || status === "PREPARING") return "preparing";
  if (status === "READY") return "ready";
  if (status === "COMPLETED" || status === "DONE") return "done";
  return "accepted";
}

export function dinerStatusKey(booking: Booking, ticket?: KitchenTicket): DinerStatusKey {
  if (booking.kitchenStatus === "rejected") {
    return "rejected";
  }
  if (booking.kitchenStatus !== "approved") {
    return "awaiting";
  }
  const fulfillment = fulfillmentOf(booking);
  if (fulfillment === "DELIVERY") {
    if (booking.dispatchStatus === "delivered") return "done";
    if (booking.dispatchStatus === "out") return "ready";
  }
  const fromTicket = ticketPhase(ticket?.status);
  if (booking.kind === "reserve" && !booking.items.length) {
    return fromTicket === "done" ? "done" : "accepted";
  }
  if (fulfillment === "DELIVERY" && fromTicket === "ready") {
    return "preparing";
  }
  if (fulfillment === "DELIVERY" && fromTicket === "done" && booking.dispatchStatus !== "delivered") {
    return "ready";
  }
  return fromTicket ?? "accepted";
}

export function dinerStatusCopy(booking: Booking, ticket?: KitchenTicket) {
  const key = dinerStatusKey(booking, ticket);
  const fulfillment = fulfillmentOf(booking);
  switch (key) {
    case "awaiting":
      return {
        label: "Waiting for restaurant",
        detail: booking.flexiSwitchRequest
          ? "FlexiSwitch is waiting for the restaurant to confirm."
          : "The restaurant has not accepted this yet.",
      };
    case "rejected":
      return {
        label: "Rejected",
        detail: "The restaurant could not take this booking.",
      };
    case "accepted":
      return {
        label: "Accepted",
        detail:
          booking.kind === "on-the-way" || booking.kind === "reserve"
            ? "Accepted. Pre-order on the way until 10 minutes before your table time."
            : ticket?.status === "UPCOMING" || !ticket
              ? "Accepted. The kitchen starts closer to your visit — FlexiSwitch stays open until then."
              : "The restaurant accepted this. It is with the kitchen.",
      };
    case "preparing":
      return {
        label: "Preparing",
        detail: "The kitchen is preparing your order.",
      };
    case "ready":
      return {
        label:
          fulfillment === "PICKUP"
            ? "Ready for pickup"
            : fulfillment === "DELIVERY"
              ? "Out for delivery"
              : "Ready for the table",
        detail:
          fulfillment === "PICKUP"
            ? "Your order is packed. Head to the counter."
            : fulfillment === "DELIVERY"
              ? "Your order has left the restaurant."
              : "Your food is ready to be served.",
      };
    case "done":
      return {
        label: fulfillment === "PICKUP" ? "Collected" : fulfillment === "DELIVERY" ? "Delivered" : "Served",
        detail:
          fulfillment === "PICKUP"
            ? "This pickup is complete."
            : fulfillment === "DELIVERY"
              ? "This delivery is complete."
              : "This visit is complete.",
      };
  }
}

export function dinerStatusChip(key: DinerStatusKey, booking?: Booking) {
  const fulfillment = booking ? fulfillmentOf(booking) : undefined;
  switch (key) {
    case "awaiting":
      return { label: "Waiting for restaurant", className: "bg-amber-100 text-amber-800" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-100 text-red-800" };
    case "accepted":
      return { label: "Accepted", className: "bg-teal-100 text-teal-800" };
    case "preparing":
      return { label: "Preparing", className: "bg-blue-100 text-blue-800" };
    case "ready":
      return {
        label:
          fulfillment === "DELIVERY"
            ? "Out for delivery"
            : fulfillment === "PICKUP"
              ? "Ready for pickup"
              : "Ready",
        className: "bg-green-100 text-green-800",
      };
    case "done":
      return {
        label: fulfillment === "DELIVERY" ? "Delivered" : fulfillment === "PICKUP" ? "Collected" : "Served",
        className: "bg-[var(--muted)]/15 text-[var(--foreground)]",
      };
  }
}
