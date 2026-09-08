import { bookingReadyAtIso, fulfillmentOf, type Booking } from "./bookings";
import { getKitchenOrderRepository } from "./kitchen-order-repository";
import type { RestaurantSettings } from "./restaurant-settings";

export function dineInFireLeadMinutes(settings: RestaurantSettings) {
  return settings.preparationLeadTimeMinutes ?? 30;
}

/** Pickup/delivery cook time from restaurant prep, stretched a little by dish count. */
export function parcelPrepMinutes(
  fulfillment: "PICKUP" | "DELIVERY",
  settings: RestaurantSettings,
  itemCount = 1,
) {
  const base = fulfillment === "DELIVERY" ? settings.deliveryPrepMinutes : settings.asapPrepMinutes;
  const extra = Math.max(0, itemCount - 1) * 2;
  return Math.min(base + extra, 180);
}

export function calculateKitchenTiming(
  scheduledFor: string,
  settings: RestaurantSettings,
  prepMinutes = settings.asapPrepMinutes,
): { kitchenStartAt: string; estimatedReadyAt: string } {
  const target = new Date(scheduledFor).getTime();
  const prepMs = prepMinutes * 60_000;
  const bufferMs = settings.prepBufferMinutes * 60_000;
  const kitchenStartAt = new Date(target - prepMs - bufferMs).toISOString();
  const estimatedReadyAt = new Date(target - bufferMs).toISOString();
  return { kitchenStartAt, estimatedReadyAt };
}

export function asapKitchenTiming(
  settings: RestaurantSettings,
  prepMinutes = settings.asapPrepMinutes,
): {
  kitchenStartAt: string;
  estimatedReadyAt: string;
} {
  const now = Date.now();
  const prepMs = prepMinutes * 60_000;
  return {
    kitchenStartAt: new Date(now).toISOString(),
    estimatedReadyAt: new Date(now + prepMs).toISOString(),
  };
}

export function timingForFulfillment(
  scheduledFor: string | undefined,
  fulfillment: "DINE_IN" | "PICKUP" | "DELIVERY",
  settings: RestaurantSettings,
  asap = false,
  itemCount = 1,
): { kitchenStartAt: string; estimatedReadyAt: string } {
  if (fulfillment === "DINE_IN") {
    const lead = dineInFireLeadMinutes(settings);
    if (asap || !scheduledFor) {
      return asapKitchenTiming(settings, lead);
    }
    const target = new Date(scheduledFor).getTime();
    return {
      kitchenStartAt: new Date(target - lead * 60_000).toISOString(),
      estimatedReadyAt: new Date(target).toISOString(),
    };
  }

  const prep = parcelPrepMinutes(fulfillment, settings, itemCount);
  const patched = { ...settings, asapPrepMinutes: prep };
  if (asap || !scheduledFor) {
    const base = asapKitchenTiming(patched, prep);
    if (fulfillment === "DELIVERY") {
      return {
        kitchenStartAt: base.kitchenStartAt,
        estimatedReadyAt: new Date(
          new Date(base.estimatedReadyAt).getTime() + settings.riderMinutes * 60_000,
        ).toISOString(),
      };
    }
    return base;
  }
  return calculateKitchenTiming(scheduledFor, patched, prep);
}

export function timingForBooking(booking: Booking, settings: RestaurantSettings) {
  const fulfillment = fulfillmentOf(booking);
  const asap =
    (fulfillment === "PICKUP" || fulfillment === "DELIVERY") &&
    (booking.slot === "asap" || booking.slot === "eta");
  const scheduledFor = asap ? undefined : bookingReadyAtIso(booking);
  return timingForFulfillment(scheduledFor, fulfillment, settings, asap, booking.items.length);
}

export function isPreOrderBlocked(
  targetTimeISO: string,
  settings: RestaurantSettings,
): boolean {
  return Date.now() >= new Date(targetTimeISO).getTime() - settings.preOrderCutoffMinutes * 60_000;
}

/** Idempotent — moves UPCOMING tickets to NEW when the preparation window opens. */
export function advanceScheduledTickets(restaurantId: string): boolean {
  if (typeof window === "undefined") return false;
  return getKitchenOrderRepository().promoteScheduled(restaurantId) > 0;
}

export function formatRelativeTime(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export type DelayStatus = "ON_TIME" | "DUE_SOON" | "LATE";

export function getDelayStatus(
  estimatedReadyAt: string,
  currentStatus: string,
): DelayStatus {
  if (currentStatus === "READY" || currentStatus === "DONE" || currentStatus === "COMPLETED") return "ON_TIME";
  const diff = new Date(estimatedReadyAt).getTime() - Date.now();
  if (diff < 0) return "LATE";
  if (diff < 5 * 60_000) return "DUE_SOON";
  return "ON_TIME";
}
