import { getKitchenOrderRepository } from "./kitchen-order-repository";
import type { RestaurantSettings } from "./restaurant-settings";

export function calculateKitchenTiming(
  scheduledFor: string,
  settings: RestaurantSettings,
): { kitchenStartAt: string; estimatedReadyAt: string } {
  const target = new Date(scheduledFor).getTime();
  const prepMs = settings.asapPrepMinutes * 60_000;
  const bufferMs = settings.prepBufferMinutes * 60_000;
  const kitchenStartAt = new Date(target - prepMs - bufferMs).toISOString();
  const estimatedReadyAt = new Date(target - bufferMs).toISOString();
  return { kitchenStartAt, estimatedReadyAt };
}

export function asapKitchenTiming(settings: RestaurantSettings): {
  kitchenStartAt: string;
  estimatedReadyAt: string;
} {
  const now = Date.now();
  const prepMs = settings.asapPrepMinutes * 60_000;
  return {
    kitchenStartAt: new Date(now).toISOString(),
    estimatedReadyAt: new Date(now + prepMs).toISOString(),
  };
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
