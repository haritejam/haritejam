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
  allowDelivery: boolean;
  allowPickupDeliverySwitch: boolean;
  requireApproval: boolean;
  foodHoldMinutes: number;
  riderMinutes: number;
  deliveryPrepMinutes: number;
  conversionPolicy: "A" | "B" | "C";
  dineInDiscountPercent: number;
  pickupDiscountPercent: number;
  deliveryDiscountPercent: number;
  packingChargeRupees: number;
}

const DEFAULTS: Omit<RestaurantSettings, "restaurantId"> = {
  asapPrepMinutes: 30,
  reservationDurationMinutes: 90,
  preOrderCutoffMinutes: 10,
  prepBufferMinutes: 5,
  preparationLeadTimeMinutes: 30,
  allowFlexiSwitch: true,
  allowPickupToDineIn: true,
  allowDelivery: true,
  allowPickupDeliverySwitch: true,
  requireApproval: true,
  foodHoldMinutes: 15,
  riderMinutes: 25,
  deliveryPrepMinutes: 30,
  conversionPolicy: "A",
  dineInDiscountPercent: 30,
  pickupDiscountPercent: 35,
  deliveryDiscountPercent: 35,
  packingChargeRupees: 40,
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

export function applyOnboardingSettings(
  restaurantId: string,
  values: {
    conversionPolicy?: RestaurantSettings["conversionPolicy"];
    pickupPrepMinutes: number;
    fireTicketMinutes: number;
    dineInDiscountPercent?: number;
    pickupDiscountPercent?: number;
    deliveryDiscountPercent?: number;
    packingChargeRupees?: number;
  },
) {
  const current = getSettings(restaurantId);
  writeSettings({
    ...current,
    restaurantId,
    conversionPolicy: values.conversionPolicy ?? current.conversionPolicy,
    asapPrepMinutes: values.pickupPrepMinutes,
    deliveryPrepMinutes: values.pickupPrepMinutes,
    preparationLeadTimeMinutes: values.fireTicketMinutes,
    dineInDiscountPercent: values.dineInDiscountPercent ?? current.dineInDiscountPercent,
    pickupDiscountPercent: values.pickupDiscountPercent ?? current.pickupDiscountPercent,
    deliveryDiscountPercent: values.deliveryDiscountPercent ?? current.deliveryDiscountPercent,
    packingChargeRupees: values.packingChargeRupees ?? current.packingChargeRupees,
  });
}
