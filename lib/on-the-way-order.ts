import { getBookingById, patchBooking, type Booking } from "./bookings";
import { getTicketByOrderId, updateTicket, KITCHEN_EVENT } from "./kitchen";
import { getKitchenOrderRepository } from "./kitchen-order-repository";
import { ORDER_EVENT, getOrderById, updateOrder } from "./orders";
import { quoteBill } from "./pricing";
import { onTheWayWindow } from "./preorder-window";
import { getSettings } from "./restaurant-settings";
import { pushDinerNotice } from "./diner-notifications";

export function setTablePreorder(
  bookingId: string,
  items: { name: string; quantity: number; unitPriceRupees?: number }[],
  subtotalRupees: number,
): { ok: boolean; reason?: string; booking?: Booking } {
  const booking = getBookingById(bookingId);
  if (!booking) return { ok: false, reason: "Booking not found." };
  const slotWindow = onTheWayWindow(booking);
  if (!slotWindow.open) {
    return {
      ok: false,
      reason: `Pre-order on the way is closed. Last cutoff is ${slotWindow.cutoffMinutes} min before your table time.`,
    };
  }
  const lines = items.filter((item) => item.quantity > 0);
  const bill = quoteBill(subtotalRupees, "DINE_IN", getSettings(booking.restaurantId));
  const kind = booking.kind === "reserve" ? "on-the-way" : booking.kind;
  const next = patchBooking(bookingId, {
    kind,
    items: lines,
    subtotalRupees: bill.subtotalRupees,
    discountPercent: bill.discountPercent,
    packingRupees: 0,
    totalRupees: bill.totalRupees,
  });
  if (!next) return { ok: false, reason: "Could not update this booking." };
  const ticket = getTicketByOrderId(bookingId);
  if (ticket) {
    updateTicket(ticket.id, {
      items: lines.map((item, index) => ({
        menuItemId: `${bookingId}-${index}`,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPriceRupees ?? 0,
      })),
      orderType: kind === "on-the-way" ? "PREORDER_ON_THE_WAY" : "PREORDER_DINE_IN",
    });
  }
  if (getOrderById(bookingId)) {
    updateOrder(bookingId, { totalRupees: bill.totalRupees });
  }
  if (next.kitchenStatus === "approved") {
    getKitchenOrderRepository().hydrateLegacyApprovals(next.restaurantId);
    getKitchenOrderRepository().promoteScheduled(next.restaurantId);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ORDER_EVENT));
    window.dispatchEvent(new Event(KITCHEN_EVENT));
  }
  pushDinerNotice(booking.dinerName ?? null, bookingId, {
    title: lines.length ? "On-the-way pre-order saved" : "Pre-order cleared",
    detail: lines.length
      ? `${booking.restaurantName}: dishes are saved. The kitchen sees them about 30 minutes before your table.`
      : "No dishes on this booking yet. You can add them until cutoff.",
  });
  return { ok: true, booking: next };
}
