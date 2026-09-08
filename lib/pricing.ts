import { fulfillmentOf, type Booking, type BookingFulfillment, type BookingKind } from "./bookings";
import { restaurants } from "./restaurant-data";
import { getSettings, type RestaurantSettings } from "./restaurant-settings";

export interface PricedBill {
  subtotalRupees: number;
  discountPercent: number;
  discountRupees: number;
  packingRupees: number;
  totalRupees: number;
}

export function fulfillmentFromKind(kind: BookingKind | null | undefined): BookingFulfillment {
  if (kind === "pickup") return "PICKUP";
  if (kind === "delivery") return "DELIVERY";
  return "DINE_IN";
}

export function packingForFulfillment(fulfillment: BookingFulfillment, settings: RestaurantSettings): number {
  return fulfillment === "PICKUP" || fulfillment === "DELIVERY" ? Math.max(0, Math.round(settings.packingChargeRupees)) : 0;
}

export function discountPercentFor(fulfillment: BookingFulfillment, settings: RestaurantSettings): number {
  if (fulfillment === "PICKUP") return settings.pickupDiscountPercent;
  if (fulfillment === "DELIVERY") return settings.deliveryDiscountPercent;
  return settings.dineInDiscountPercent;
}

export function quoteBill(
  subtotalRupees: number,
  fulfillment: BookingFulfillment,
  settings: RestaurantSettings,
): PricedBill {
  const subtotal = Math.max(0, Math.round(subtotalRupees));
  if (subtotal <= 0) {
    return {
      subtotalRupees: 0,
      discountPercent: 0,
      discountRupees: 0,
      packingRupees: 0,
      totalRupees: 0,
    };
  }
  const discountPercent = discountPercentFor(fulfillment, settings);
  const discountRupees = Math.round((subtotal * discountPercent) / 100);
  const packingRupees = packingForFulfillment(fulfillment, settings);
  return {
    subtotalRupees: subtotal,
    discountPercent,
    discountRupees,
    packingRupees,
    totalRupees: Math.max(0, subtotal - discountRupees + packingRupees),
  };
}

/** Packing already sitting on this ticket (inferred for older bookings). */
export function packingOnBooking(booking: Booking, settings: RestaurantSettings): number {
  if (booking.packingRupees != null) return Math.max(0, Math.round(booking.packingRupees));
  return packingForFulfillment(fulfillmentOf(booking), settings);
}

/** Menu after the first-quote discount. FlexiSwitch never recuts this with another %. */
export function discountedFoodRupees(booking: Booking, settings: RestaurantSettings): number {
  return Math.max(0, Math.round(booking.totalRupees) - packingOnBooking(booking, settings));
}

export function packingDeltaRupees(booking: Booking, to: BookingFulfillment, settings: RestaurantSettings): number {
  return packingForFulfillment(to, settings) - packingOnBooking(booking, settings);
}

/**
 * FlexiSwitch quote for dine-in, pickup, and delivery.
 * Destination % is used only on the original booking. Later switches keep that food total
 * and only add, remove, or keep packing (pickup and delivery share packing).
 */
export function quoteBillForBooking(
  booking: Booking,
  to: BookingFulfillment,
  settings = getSettings(booking.restaurantId),
): PricedBill {
  const packingRupees = packingForFulfillment(to, settings);
  const discountedFood = discountedFoodRupees(booking, settings);
  const subtotalRupees = booking.subtotalRupees ?? discountedFood;
  const discountPercent = booking.discountPercent ?? 0;
  const discountRupees =
    booking.subtotalRupees != null && booking.discountPercent != null
      ? Math.round((booking.subtotalRupees * booking.discountPercent) / 100)
      : Math.max(0, subtotalRupees - discountedFood);
  return {
    subtotalRupees,
    discountPercent,
    discountRupees,
    packingRupees,
    totalRupees: discountedFood + packingRupees,
  };
}

/** Pickup/delivery are paid at confirm when paidNow was never stored. */
export function alreadyPaidRupees(booking: Booking): number {
  if (booking.paidNowRupees != null) return Math.max(0, Math.round(booking.paidNowRupees));
  const from = fulfillmentOf(booking);
  if (from === "PICKUP" || from === "DELIVERY") {
    return Math.max(0, Math.round(booking.totalRupees));
  }
  return 0;
}

export const TABLE_PREORDER_DEPOSIT_PERCENT = 30;

export type TablePreorderPayPlan = "deposit" | "full";

export function tablePreorderPaySplit(totalRupees: number, plan: TablePreorderPayPlan) {
  const total = Math.max(0, Math.round(totalRupees));
  if (plan === "full" || total === 0) {
    return {
      plan: plan === "full" ? ("full" as const) : ("deposit" as const),
      depositPercent: plan === "full" ? 100 : TABLE_PREORDER_DEPOSIT_PERCENT,
      paidNowRupees: total,
      dueAtRestaurantRupees: 0,
    };
  }
  const paidNowRupees = Math.min(total, Math.max(1, Math.round((total * TABLE_PREORDER_DEPOSIT_PERCENT) / 100)));
  return {
    plan: "deposit" as const,
    depositPercent: TABLE_PREORDER_DEPOSIT_PERCENT,
    paidNowRupees,
    dueAtRestaurantRupees: total - paidNowRupees,
  };
}

export function dueAfterPaid(totalRupees: number, paidNowRupees: number | undefined) {
  const total = Math.max(0, Math.round(totalRupees));
  const paid = Math.max(0, Math.round(paidNowRupees ?? 0));
  return Math.max(0, total - paid);
}

export function menuSubtotalFromItems(booking: Booking) {
  const menu = restaurants.find((row) => row.id === booking.restaurantId)?.menuItems;
  return booking.items.reduce((sum, item) => {
    const unit =
      item.unitPriceRupees && item.unitPriceRupees > 0
        ? item.unitPriceRupees
        : (menu?.find((row) => row.name === item.name)?.priceRupees ?? 0);
    return sum + unit * item.quantity;
  }, 0);
}

/** Reconstruct the diner bill so line items, % off, packing, and total line up. */
export function billLinesForBooking(booking: Booking, settings = getSettings(booking.restaurantId)): PricedBill {
  const fromItems = menuSubtotalFromItems(booking);
  const subtotal = booking.subtotalRupees && booking.subtotalRupees > 0 ? booking.subtotalRupees : fromItems;
  const discountPercent =
    booking.discountPercent != null
      ? booking.discountPercent
      : subtotal > 0
        ? discountPercentFor(fulfillmentOf(booking), settings)
        : 0;
  const discountRupees = subtotal > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
  const packingRupees = packingOnBooking(booking, settings);
  const computed = Math.max(0, subtotal - discountRupees + packingRupees);
  return {
    subtotalRupees: subtotal,
    discountPercent,
    discountRupees,
    packingRupees,
    totalRupees: booking.totalRupees > 0 ? Math.round(booking.totalRupees) : computed,
  };
}
