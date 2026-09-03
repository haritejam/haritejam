import { appendEvent } from "./order-events";
import { getOrderById, updateOrder, writeOrders, readOrders, ORDER_EVENT } from "./orders";
import { getTicketByOrderId, updateTicket, KITCHEN_EVENT } from "./kitchen";
import { getSettings } from "./restaurant-settings";
import { tablesForRestaurant, updateTable } from "./tables";

export interface FlexiSwitchResult {
  success: boolean;
  reason?: string;
  tableId?: string;
}

export function switchDineInToPickup(
  orderId: string,
  restaurantId: string,
): FlexiSwitchResult {
  const order = getOrderById(orderId);
  if (!order) return { success: false, reason: "Order not found." };
  if (order.restaurantId !== restaurantId)
    return { success: false, reason: "Access denied." };
  if (order.fulfillmentType === "PICKUP")
    return { success: false, reason: "Order is already a pickup." };

  const history = [...(order.flexiSwitchHistory ?? []), order.fulfillmentType];

  updateOrder(orderId, {
    fulfillmentType: "PICKUP",
    flexiSwitchHistory: history,
    tableId: undefined,
  });

  // Release table if one was assigned
  if (order.tableId) {
    updateTable(order.tableId, { status: "AVAILABLE", currentReservationId: undefined });
  }

  // Update kitchen ticket
  const ticket = getTicketByOrderId(orderId);
  if (ticket) {
    updateTicket(ticket.id, { fulfillmentType: "PICKUP", flexiSwitched: true, tableId: undefined });
  }

  appendEvent({
    orderId,
    restaurantId,
    type: "FLEXISWITCH_APPROVED",
    note: "DINE_IN → PICKUP",
    actor: "staff",
  });
  appendEvent({
    orderId,
    restaurantId,
    type: "FULFILLMENT_CHANGED",
    note: "Fulfillment changed from DINE_IN to PICKUP",
    actor: "system",
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ORDER_EVENT));
    window.dispatchEvent(new Event(KITCHEN_EVENT));
  }

  return { success: true };
}

export function switchPickupToDineIn(
  orderId: string,
  restaurantId: string,
): FlexiSwitchResult {
  const settings = getSettings(restaurantId);
  if (!settings.allowFlexiSwitch)
    return { success: false, reason: "FlexiSwitch is disabled for this restaurant." };
  if (!settings.allowPickupToDineIn)
    return { success: false, reason: "Pickup to dine-in switching is disabled." };

  const order = getOrderById(orderId);
  if (!order) return { success: false, reason: "Order not found." };
  if (order.restaurantId !== restaurantId)
    return { success: false, reason: "Access denied." };
  if (order.fulfillmentType === "DINE_IN")
    return { success: false, reason: "Order is already dine-in." };

  // Find available table
  const tables = tablesForRestaurant(restaurantId);
  const available = tables.find(
    (t) => t.status === "AVAILABLE" && t.capacity >= (order.guestCount ?? 1),
  ) ?? tables.find((t) => t.status === "AVAILABLE");

  if (!available) {
    return {
      success: false,
      reason: "Dine-in is currently unavailable. Your pickup order remains unchanged.",
    };
  }

  const history = [...(order.flexiSwitchHistory ?? []), order.fulfillmentType];

  updateOrder(orderId, {
    fulfillmentType: "DINE_IN",
    flexiSwitchHistory: history,
    tableId: available.id,
  });

  updateTable(available.id, { status: "RESERVED", currentReservationId: orderId });

  const ticket = getTicketByOrderId(orderId);
  if (ticket) {
    updateTicket(ticket.id, {
      fulfillmentType: "DINE_IN",
      flexiSwitched: true,
      tableId: available.id,
    });
  }

  appendEvent({
    orderId,
    restaurantId,
    type: "FLEXISWITCH_APPROVED",
    note: "PICKUP → DINE_IN",
    actor: "staff",
  });
  appendEvent({
    orderId,
    restaurantId,
    type: "FULFILLMENT_CHANGED",
    note: `Fulfillment changed from PICKUP to DINE_IN. Table: ${available.name}`,
    actor: "system",
  });
  appendEvent({
    orderId,
    restaurantId,
    type: "TABLE_ASSIGNED",
    note: `Table assigned: ${available.name}`,
    actor: "system",
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ORDER_EVENT));
    window.dispatchEvent(new Event(KITCHEN_EVENT));
  }

  return { success: true, tableId: available.id };
}
