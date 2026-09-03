export const SETTINGS_KEY = "flexidine-restaurant-settings";

export interface RestaurantSettings {
  restaurantId: string;
  asapPrepMinutes: number;
  reservationDurationMinutes: number;
  preOrderCutoffMinutes: number;
  prepBufferMinutes: number;
  preparationLeadTimeMinutes: number;
  allowFlexiSwitch: boolean;
  allowPickupToDineIn: boolean;
  requireApproval: boolean;
}

const DEFAULTS: Omit<RestaurantSettings, "restaurantId"> = {
  asapPrepMinutes: 30,
  reservationDurationMinutes: 90,
  preOrderCutoffMinutes: 10,
  prepBufferMinutes: 5,
  preparationLeadTimeMinutes: 20,
  allowFlexiSwitch: true,
  allowPickupToDineIn: true,
  requireApproval: true,
};

export function readAllSettings(): RestaurantSettings[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RestaurantSettings[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getSettings(restaurantId: string): RestaurantSettings {
  const all = readAllSettings();
  const found = all.find((s) => s.restaurantId === restaurantId);
  return { ...DEFAULTS, restaurantId, ...found };
}

export function writeSettings(settings: RestaurantSettings): void {
  if (typeof window === "undefined") return;
  const all = readAllSettings().filter((s) => s.restaurantId !== settings.restaurantId);
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify([settings, ...all]));
}
