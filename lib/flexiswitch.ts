import { fulfillmentOf, getBookingById, patchBooking, bookingReadyAtIso, type Booking, type BookingFulfillment } from "./bookings";
import { getTicketByOrderId, updateTicket, KITCHEN_EVENT, kitchenHasFired } from "./kitchen";
import { appendEvent } from "./order-events";
import { getOrderById, updateOrder, ORDER_EVENT } from "./orders";
import { quoteBillForBooking, dueAfterPaid, alreadyPaidRupees, packingDeltaRupees } from "./pricing";
import { getSettings } from "./restaurant-settings";
import { timingForFulfillment } from "./scheduling";
import { tablesForRestaurant, updateTable } from "./tables";
import { isAsapSlot } from "./visit-slots";
import { pushDinerNotice } from "./diner-notifications";

export type SwitchTarget = BookingFulfillment;

export interface FlexiSwitchResult {
  success: boolean;
  reason?: string;
  tableId?: string;
  chargeRupees?: number;
  pendingApproval?: boolean;
}

export function switchLabel(value: SwitchTarget) {
  if (value === "PICKUP") return "Pickup";
  if (value === "DELIVERY") return "Delivery";
  return "Dine-in";
}

export function quoteConversionCharge(booking: Booking, to: SwitchTarget, settings = getSettings(booking.restaurantId)) {
  return Math.max(0, packingDeltaRupees(booking, to, settings));
}

export function flexiSwitchAlreadyUsed(booking: Booking): boolean {
  if ((booking.flexiSwitchHistory?.length ?? 0) > 0) return true;
  const ticket = getTicketByOrderId(booking.id);
  if (ticket?.flexiSwitched) return true;
  const order = getOrderById(booking.id);
  return (order?.flexiSwitchHistory?.length ?? 0) > 0;
}

export function flexiSwitchClosedReason(booking: Booking): string | null {
  if (booking.kitchenStatus === "rejected") return "This booking was rejected.";
  if (fulfillmentOf(booking) === "DELIVERY" && isAsapSlot(booking.slot)) {
    return "FlexiSwitch is not available on Delivery ASAP.";
  }
  if (flexiSwitchAlreadyUsed(booking)) {
    return "FlexiSwitch was used once. This booking is now final.";
  }
  if (fulfillmentOf(booking) === "DINE_IN" && booking.items.length === 0) {
    return "FlexiSwitch opens after you pre-order.";
  }
  const ticket = getTicketByOrderId(booking.id);
  if (kitchenHasFired(ticket?.status)) {
    return "This order is already with the kitchen. FlexiSwitch is closed.";
  }
  return null;
}

export function flexiSwitchOfferCopy(booking: Booking, settings = getSettings(booking.restaurantId)): string {
  const closed = flexiSwitchClosedReason(booking);
  if (closed) return closed;
  if (!settings.allowFlexiSwitch) return "FlexiSwitch is turned off for this restaurant.";
  const targets = allowedSwitchTargets(booking, settings);
  if (targets.length === 0) return "No FlexiSwitch options on this order.";
  return `FlexiSwitch to ${targets.map(switchLabel).join(" or ")}.`;
}

export function allowedSwitchTargets(booking: Booking, settings = getSettings(booking.restaurantId)): SwitchTarget[] {
  if (!settings.allowFlexiSwitch) return [];
  if (flexiSwitchClosedReason(booking)) return [];
  const from = fulfillmentOf(booking);
  const next: SwitchTarget[] = [];
  if (from === "DINE_IN") {
    next.push("PICKUP");
    if (settings.allowDelivery && settings.allowPickupDeliverySwitch) next.push("DELIVERY");
  }
  if (from === "PICKUP") {
    if (settings.allowPickupToDineIn) next.push("DINE_IN");
    if (settings.allowDelivery && settings.allowPickupDeliverySwitch) next.push("DELIVERY");
  }
  if (from === "DELIVERY") {
    if (settings.allowPickupDeliverySwitch) next.push("PICKUP");
    if (settings.allowPickupToDineIn) next.push("DINE_IN");
  }
  return next.filter((item) => item !== from);
}

export function evaluateTimeline(
  booking: Booking,
  _to: SwitchTarget,
  _settings = getSettings(booking.restaurantId),
): FlexiSwitchResult {
  const closed = flexiSwitchClosedReason(booking);
  if (closed) return { success: false, reason: closed };
  return { success: true };
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ORDER_EVENT));
  window.dispatchEvent(new Event(KITCHEN_EVENT));
}

function applyKitchenTimes(bookingId: string, restaurantId: string, to: SwitchTarget, asap: boolean, scheduledFor?: string, itemCount = 1) {
  const settings = getSettings(restaurantId);
  const times = timingForFulfillment(scheduledFor, to, settings, asap, itemCount);
  const ticket = getTicketByOrderId(bookingId);
  if (ticket) {
    const shouldFire = ticket.status === "UPCOMING" && Date.now() >= new Date(times.kitchenStartAt).getTime();
    updateTicket(ticket.id, {
      fulfillmentType: to,
      flexiSwitched: true,
      kitchenStartAt: times.kitchenStartAt,
      estimatedReadyAt: times.estimatedReadyAt,
      scheduledFor: scheduledFor ?? ticket.scheduledFor,
      tableId: to === "DINE_IN" ? ticket.tableId : undefined,
      status: shouldFire ? "NEW" : ticket.status,
    });
  }
  if (getOrderById(bookingId)) {
    updateOrder(bookingId, {
      kitchenStartAt: times.kitchenStartAt,
      estimatedReadyAt: times.estimatedReadyAt,
      scheduledFor: scheduledFor,
    });
  }
  return times;
}

function commitSwitch(
  booking: Booking,
  to: SwitchTarget,
  extras: { deliveryAddress?: string; etaMinutes?: number; quotedChargeRupees?: number },
  actor: "staff" | "customer" | "system",
): FlexiSwitchResult {
  const from = fulfillmentOf(booking);
  const settings = getSettings(booking.restaurantId);
  const timeline = evaluateTimeline(booking, to, settings);
  if (!timeline.success) return timeline;

  let tableId: string | undefined;
  if (to === "DINE_IN") {
    const tables = tablesForRestaurant(booking.restaurantId);
    const available =
      tables.find((t) => t.status === "AVAILABLE" && t.capacity >= (booking.guests || 1)) ??
      tables.find((t) => t.status === "AVAILABLE");
    if (!available) {
      return { success: false, reason: "Dine-in is currently unavailable. The current order is unchanged." };
    }
    tableId = available.id;
    updateTable(available.id, { status: "RESERVED", currentReservationId: booking.id });
  }

  if (from === "DINE_IN") {
    const previous = getBookingById(booking.id);
    if (previous?.flexiSwitchHistory) {
      /* table id lives on kitchen ticket */
    }
    const ticket = getTicketByOrderId(booking.id);
    if (ticket?.tableId) {
      updateTable(ticket.tableId, { status: "AVAILABLE", currentReservationId: undefined });
    }
  }

  const bill = quoteBillForBooking(booking, to, settings);
  const packingDelta = packingDeltaRupees(booking, to, settings);
  const packingAdded = Math.max(0, packingDelta);
  const paidNow = alreadyPaidRupees(booking);
  const due = dueAfterPaid(bill.totalRupees, paidNow);
  const history = [...(booking.flexiSwitchHistory ?? []), from];
  const asap = to === "PICKUP" || to === "DELIVERY" ? isAsapSlot(booking.slot) || booking.slot === "eta" : false;
  const scheduledFor =
    extras.etaMinutes
      ? new Date(Date.now() + extras.etaMinutes * 60_000).toISOString()
      : bookingReadyAtIso({ ...booking, etaMinutes: extras.etaMinutes ?? booking.etaMinutes });

  const nextKind =
    to === "DELIVERY" ? "delivery" : to === "PICKUP" ? "pickup" : booking.kind === "on-the-way" ? "on-the-way" : "reserve-preorder";

  patchBooking(booking.id, {
    fulfillment: to,
    kind: booking.items.length > 0 ? nextKind : to === "DINE_IN" ? "reserve" : nextKind,
    flexiSwitchRequest: null,
    flexiSwitchHistory: history,
    subtotalRupees: booking.subtotalRupees ?? bill.subtotalRupees,
    discountPercent: booking.discountPercent ?? bill.discountPercent,
    packingRupees: bill.packingRupees,
    conversionChargeRupees: packingAdded,
    totalRupees: bill.totalRupees,
    paidNowRupees: paidNow,
    dueAtRestaurantRupees: due,
    paymentPlan: due === 0 ? "full" : booking.paymentPlan,
    deliveryAddress: to === "DELIVERY" ? extras.deliveryAddress ?? booking.deliveryAddress : undefined,
    dispatchStatus: to === "DELIVERY" ? "queued" : to === "PICKUP" && from === "DELIVERY" ? "recalled" : undefined,
    etaMinutes: extras.etaMinutes ?? booking.etaMinutes,
  });

  const ticket = getTicketByOrderId(booking.id);
  if (ticket) {
    updateTicket(ticket.id, {
      fulfillmentType: to,
      flexiSwitched: true,
      tableId,
      orderType:
        to === "DELIVERY"
          ? "DELIVERY"
          : to === "PICKUP"
            ? asap
              ? "PICKUP_ASAP"
              : "PICKUP_SCHEDULED"
            : booking.kind === "on-the-way"
              ? "PREORDER_ON_THE_WAY"
              : booking.items.length > 0
                ? "PREORDER_DINE_IN"
                : "RESERVATION_ONLY",
    });
  }
  applyKitchenTimes(booking.id, booking.restaurantId, to, asap, scheduledFor, booking.items.length);

  if (getOrderById(booking.id)) {
    updateOrder(booking.id, {
      fulfillmentType: to,
      flexiSwitchHistory: history,
      totalRupees: bill.totalRupees,
      tableId,
      deliveryAddress: to === "DELIVERY" ? extras.deliveryAddress ?? booking.deliveryAddress : undefined,
      dispatchStatus: to === "DELIVERY" ? "queued" : undefined,
    });
  }

  appendEvent({
    orderId: booking.id,
    restaurantId: booking.restaurantId,
    type: "FLEXISWITCH_APPROVED",
    note: `${from} → ${to}${
      packingAdded ? ` · packing ₹${packingAdded}` : packingDelta < 0 ? " · packing removed" : " · packing unchanged"
    }`,
    actor,
  });
  appendEvent({
    orderId: booking.id,
    restaurantId: booking.restaurantId,
    type: "FULFILLMENT_CHANGED",
    note: `Fulfillment changed from ${from} to ${to}`,
    actor: "system",
  });
  if (tableId) {
    appendEvent({
      orderId: booking.id,
      restaurantId: booking.restaurantId,
      type: "TABLE_ASSIGNED",
      note: `Table ${tableId}`,
      actor: "system",
    });
  }
  if (to === "DELIVERY") {
    appendEvent({
      orderId: booking.id,
      restaurantId: booking.restaurantId,
      type: "DISPATCH_ASSIGNED",
      note: extras.deliveryAddress ?? booking.deliveryAddress,
      actor: "system",
    });
  }
  if (from === "DELIVERY" && to === "PICKUP") {
    appendEvent({
      orderId: booking.id,
      restaurantId: booking.restaurantId,
      type: "DISPATCH_CANCELLED",
      note: "Recalled to pickup",
      actor: "system",
    });
  }

  emit();
  pushDinerNotice(booking.dinerName ?? null, booking.id, {
    title: `FlexiSwitch to ${switchLabel(to)}`,
    detail: packingAdded
      ? `Switched to ${switchLabel(to)}. Packing ₹${packingAdded.toLocaleString("en-IN")} is added. The original food discount stays.`
      : packingDelta < 0
        ? `Switched to ${switchLabel(to)}. Packing is removed. The original food discount stays.`
        : `Switched to ${switchLabel(to)}. Packing is unchanged. The original food discount stays.`,
  });
  return { success: true, tableId, chargeRupees: packingAdded };
}

export function requestFlexiSwitch(
  bookingId: string,
  to: SwitchTarget,
  extras: { deliveryAddress?: string; etaMinutes?: number } = {},
): FlexiSwitchResult {
  const booking = getBookingById(bookingId);
  if (!booking) return { success: false, reason: "Booking not found." };
  if (booking.kitchenStatus === "rejected") return { success: false, reason: "This booking was rejected." };
  const settings = getSettings(booking.restaurantId);
  if (!allowedSwitchTargets(booking, settings).includes(to)) {
    return { success: false, reason: "This restaurant does not allow that FlexiSwitch." };
  }
  if (to === "DELIVERY" && !(extras.deliveryAddress ?? booking.deliveryAddress)?.trim()) {
    return { success: false, reason: "Add a delivery address to switch to delivery." };
  }
  const timeline = evaluateTimeline(booking, to, settings);
  if (!timeline.success) return timeline;

  const extraPacking = quoteConversionCharge(booking, to, settings);
  return commitSwitch(booking, to, { ...extras, quotedChargeRupees: extraPacking }, "customer");
}

export function approveFlexiSwitch(bookingId: string): FlexiSwitchResult {
  const booking = getBookingById(bookingId);
  if (!booking?.flexiSwitchRequest) return { success: false, reason: "No FlexiSwitch request waiting." };
  const req = booking.flexiSwitchRequest;
  return commitSwitch(
    booking,
    req.to,
    {
      deliveryAddress: req.deliveryAddress,
      etaMinutes: req.etaMinutes,
      quotedChargeRupees: req.quotedChargeRupees,
    },
    "staff",
  );
}

export function rejectFlexiSwitch(bookingId: string): FlexiSwitchResult {
  const booking = getBookingById(bookingId);
  if (!booking?.flexiSwitchRequest) return { success: false, reason: "No FlexiSwitch request waiting." };
  const req = booking.flexiSwitchRequest;
  patchBooking(booking.id, { flexiSwitchRequest: null });
  appendEvent({
    orderId: booking.id,
    restaurantId: booking.restaurantId,
    type: "FLEXISWITCH_REJECTED",
    note: `${req.from} → ${req.to}`,
    actor: "staff",
  });
  emit();
  pushDinerNotice(booking.dinerName ?? null, booking.id, {
    title: "FlexiSwitch declined",
    detail: `${booking.restaurantName} kept this as ${switchLabel(req.from)}.`,
  });
  return { success: true };
}

export function switchDineInToPickup(orderId: string, restaurantId: string): FlexiSwitchResult {
  const booking = getBookingById(orderId);
  if (!booking || booking.restaurantId !== restaurantId) return { success: false, reason: "Order not found." };
  return commitSwitch(booking, "PICKUP", {}, "staff");
}

export function switchPickupToDineIn(orderId: string, restaurantId: string): FlexiSwitchResult {
  const booking = getBookingById(orderId);
  if (!booking || booking.restaurantId !== restaurantId) return { success: false, reason: "Order not found." };
  return commitSwitch(booking, "DINE_IN", {}, "staff");
}

export function switchToDelivery(orderId: string, restaurantId: string, deliveryAddress?: string): FlexiSwitchResult {
  const booking = getBookingById(orderId);
  if (!booking || booking.restaurantId !== restaurantId) return { success: false, reason: "Order not found." };
  const address = deliveryAddress ?? booking.deliveryAddress;
  if (!address?.trim()) return { success: false, reason: "Add a delivery address to switch to delivery." };
  return commitSwitch(booking, "DELIVERY", { deliveryAddress: address }, "staff");
}

export function markOutForDelivery(bookingId: string): FlexiSwitchResult {
  const booking = getBookingById(bookingId);
  if (!booking) return { success: false, reason: "Booking not found." };
  if (fulfillmentOf(booking) !== "DELIVERY") return { success: false, reason: "This is not a delivery ticket." };
  if (booking.dispatchStatus === "delivered") return { success: false, reason: "This delivery is complete." };
  patchBooking(bookingId, { dispatchStatus: "out" });
  if (getOrderById(bookingId)) {
    updateOrder(bookingId, { dispatchStatus: "out" });
  }
  appendEvent({
    orderId: bookingId,
    restaurantId: booking.restaurantId,
    type: "DISPATCHED",
    note: booking.deliveryAddress,
    actor: "staff",
  });
  emit();
  pushDinerNotice(booking.dinerName ?? null, bookingId, {
    title: "Out for delivery",
    detail: `A rider has left ${booking.restaurantName}.`,
  });
  return { success: true };
}

export function markDelivered(bookingId: string): FlexiSwitchResult {
  const booking = getBookingById(bookingId);
  if (!booking) return { success: false, reason: "Booking not found." };
  if (fulfillmentOf(booking) !== "DELIVERY") return { success: false, reason: "This is not a delivery ticket." };
  patchBooking(bookingId, { dispatchStatus: "delivered", kitchenStage: "completed" });
  const ticket = getTicketByOrderId(bookingId);
  if (ticket && ticket.status !== "COMPLETED" && ticket.status !== "DONE") {
    updateTicket(ticket.id, { status: "COMPLETED" });
  }
  if (getOrderById(bookingId)) {
    updateOrder(bookingId, { dispatchStatus: "delivered", status: "DELIVERED" });
  }
  appendEvent({
    orderId: bookingId,
    restaurantId: booking.restaurantId,
    type: "DELIVERED",
    note: booking.deliveryAddress,
    actor: "staff",
  });
  emit();
  pushDinerNotice(booking.dinerName ?? null, bookingId, {
    title: "Delivered",
    detail: `Your order from ${booking.restaurantName} has arrived.`,
  });
  return { success: true };
}
