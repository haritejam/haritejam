export const ORDERS_KEY = "flexidine-orders";
export const ORDER_EVENT = "flexidine-orders";

export type OrderType =
  | "RESERVATION_ONLY"
  | "PREORDER_DINE_IN"
  | "PICKUP_ASAP"
  | "PICKUP_SCHEDULED"
  | "DINE_IN";

export type FulfillmentType = "DINE_IN" | "PICKUP";

export type OrderStatus =
  | "PENDING"
  | "APPROVED"
  | "QUEUED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COLLECTED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string; // "FD" + timestamp
  restaurantId: string;
  restaurantName: string;
  guestName: string;
  guestCount: number;
  orderType: OrderType;
  fulfillmentType: FulfillmentType;
  status: OrderStatus;
  approvalStatus: ApprovalStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  totalRupees: number;
  reservationId?: string;
  tableId?: string;
  scheduledFor?: string; // ISO datetime
  kitchenStartAt?: string; // ISO datetime
  estimatedReadyAt?: string; // ISO datetime
  createdAt: string;
  updatedAt: string;
  flexiSwitchHistory?: FulfillmentType[];
}

function emitOrder() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ORDER_EVENT));
  }
}

export function readOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeOrders(list: Order[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  emitOrder();
}

export function ordersForRestaurant(restaurantId: string): Order[] {
  return readOrders().filter((o) => o.restaurantId === restaurantId);
}

export function addOrder(
  order: Omit<Order, "id" | "createdAt" | "updatedAt">,
): Order {
  const now = new Date().toISOString();
  const next: Order = {
    ...order,
    id: `FD${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  writeOrders([next, ...readOrders()]);
  return next;
}

export function updateOrder(
  id: string,
  patch: Partial<Omit<Order, "id" | "restaurantId" | "createdAt">>,
): Order | null {
  const list = readOrders();
  let updated: Order | null = null;
  const next = list.map((o) => {
    if (o.id !== id) return o;
    updated = { ...o, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) return null;
  writeOrders(next);
  return updated;
}

export function getOrderById(id: string): Order | undefined {
  return readOrders().find((o) => o.id === id);
}

export function todayOrdersForRestaurant(restaurantId: string): Order[] {
  const today = new Date().toISOString().slice(0, 10);
  return ordersForRestaurant(restaurantId).filter((o) => {
    const ref = o.scheduledFor ?? o.createdAt;
    return ref.slice(0, 10) === today;
  });
}
