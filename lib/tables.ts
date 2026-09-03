export const TABLES_KEY = "flexidine-tables";
export const TABLE_EVENT = "flexidine-tables";

export type TableStatus = "AVAILABLE" | "RESERVED" | "OCCUPIED" | "CLEANING" | "UNAVAILABLE";

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  name: string;
  capacity: number;
  status: TableStatus;
  zone?: string;
  currentReservationId?: string;
}

function emitTable() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TABLE_EVENT));
  }
}

export function readTables(): RestaurantTable[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TABLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RestaurantTable[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeTables(list: RestaurantTable[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TABLES_KEY, JSON.stringify(list));
  emitTable();
}

export function tablesForRestaurant(restaurantId: string): RestaurantTable[] {
  return readTables().filter((t) => t.restaurantId === restaurantId);
}

export function addTable(
  table: Omit<RestaurantTable, "id">,
): RestaurantTable {
  const next: RestaurantTable = { ...table, id: `TBL-${Date.now()}` };
  writeTables([...readTables(), next]);
  return next;
}

export function updateTable(
  id: string,
  patch: Partial<Omit<RestaurantTable, "id" | "restaurantId">>,
): RestaurantTable | null {
  const list = readTables();
  let updated: RestaurantTable | null = null;
  const next = list.map((t) => {
    if (t.id !== id) return t;
    updated = { ...t, ...patch };
    return updated;
  });
  if (!updated) return null;
  writeTables(next);
  return updated;
}

export function removeTable(id: string): void {
  writeTables(readTables().filter((t) => t.id !== id));
}

export function seedDefaultTables(restaurantId: string): void {
  if (typeof window === "undefined") return;
  const existing = tablesForRestaurant(restaurantId);
  if (existing.length > 0) return;

  const defaults: Omit<RestaurantTable, "id">[] = [
    { restaurantId, name: "Table 1", capacity: 2, status: "AVAILABLE", zone: "Indoor" },
    { restaurantId, name: "Table 2", capacity: 2, status: "AVAILABLE", zone: "Indoor" },
    { restaurantId, name: "Table 3", capacity: 4, status: "AVAILABLE", zone: "Indoor" },
    { restaurantId, name: "Table 4", capacity: 4, status: "AVAILABLE", zone: "Indoor" },
    { restaurantId, name: "Table 5", capacity: 4, status: "AVAILABLE", zone: "Outdoor" },
    { restaurantId, name: "Table 6", capacity: 4, status: "AVAILABLE", zone: "Outdoor" },
    { restaurantId, name: "Table 7", capacity: 6, status: "AVAILABLE", zone: "Private" },
    { restaurantId, name: "Table 8", capacity: 6, status: "AVAILABLE", zone: "Private" },
  ];

  const stamped: RestaurantTable[] = defaults.map((d, i) => ({
    ...d,
    id: `TBL-${restaurantId}-${i + 1}`,
  }));

  writeTables([...readTables(), ...stamped]);
}
