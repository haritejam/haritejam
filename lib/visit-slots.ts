export const ASAP_SLOT = "asap";

/** Kitchen service window used for ASAP pickup and delivery. */
export const RESTAURANT_OPEN_MINUTES = 12 * 60;
export const RESTAURANT_CLOSE_MINUTES = 22 * 60;

export function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function isWithinRestaurantHours(now: Date) {
  const current = minutesOfDay(now);
  return current >= RESTAURANT_OPEN_MINUTES && current < RESTAURANT_CLOSE_MINUTES;
}

export function isAsapOffered(now: Date) {
  return isWithinRestaurantHours(now);
}

export function isAsapSlot(slot: string) {
  return slot === ASAP_SLOT;
}

export interface DayOption {
  value: string;
  label: string;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function upcomingDays(now: Date, count = 7): DayOption[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() + index);
    date.setHours(0, 0, 0, 0);
    const weekday = date.toLocaleDateString("en-IN", { weekday: "short" });
    const day = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return {
      value: dateKey(date),
      label: index === 0 ? `Today · ${day}` : `${weekday} · ${day}`,
    };
  });
}

function allSlots() {
  const slots: string[] = [];
  for (let hour = 12; hour <= 21; hour += 1) {
    slots.push(`${pad(hour)}:00`);
    slots.push(`${pad(hour)}:30`);
  }
  slots.push("22:00");
  return slots;
}

export function availableSlots(_kind: "pickup" | "dine", visitDate: string, now: Date) {
  const slots = allSlots();
  if (visitDate !== dateKey(now)) {
    return slots;
  }
  const current = now.getHours() * 60 + now.getMinutes();
  return slots.filter((slot) => {
    const [hour, minute] = slot.split(":").map(Number);
    return hour * 60 + minute > current + 30;
  });
}

export function formatSlotLabel(slot: string) {
  if (isAsapSlot(slot)) {
    return "ASAP";
  }
  if (slot === "eta") {
    return "On the way";
  }
  const [hourRaw, minute] = slot.split(":");
  const hour = Number(hourRaw);
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${minute} ${suffix}`;
}

export function nextOpenTableSlot(now: Date): { visitDate: string; slot: string } | null {
  for (const day of upcomingDays(now)) {
    const slots = availableSlots("dine", day.value, now);
    if (slots[0]) return { visitDate: day.value, slot: slots[0] };
  }
  return null;
}

export function formatVisitDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
