import { BOOKING_EVENT, bookingsForDiner, getBookingById } from "@/lib/bookings";
import { dinerStatusCopy, dinerStatusKey, type DinerStatusKey } from "@/lib/diner-status";
import { getTicketByOrderId, KITCHEN_EVENT } from "@/lib/kitchen";
import { ORDER_EVENT } from "@/lib/orders";
import { livePreorderCopy, onTheWayMenuHref, onTheWayWindow } from "@/lib/preorder-window";

export const DINER_NOTICE_EVENT = "flexidine-diner-notices";
const NOTICES_KEY = "flexidine-diner-notices";
const SNAP_KEY = "flexidine-diner-status-snap";

export interface DinerNotice {
  id: string;
  username: string;
  bookingId: string;
  restaurantName: string;
  status: DinerStatusKey;
  title: string;
  detail: string;
  createdAt: string;
  read: boolean;
}

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DINER_NOTICE_EVENT));
  }
}

function readAll(): DinerNotice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DinerNotice[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: DinerNotice[]) {
  window.localStorage.setItem(NOTICES_KEY, JSON.stringify(list.slice(0, 80)));
  emit();
}

export function noticesForDiner(username: string | null): DinerNotice[] {
  if (!username) return [];
  const key = username.trim().toLowerCase();
  return readAll()
    .filter((item) => item.username === key)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function noticeActionHref(notice: DinerNotice) {
  const booking = getBookingById(notice.bookingId);
  if (booking && onTheWayWindow(booking).open) {
    return onTheWayMenuHref(booking);
  }
  return `/booking/${notice.bookingId}`;
}

export function unreadNoticeCount(username: string | null) {
  return noticesForDiner(username).filter((item) => !item.read).length;
}

export function markNoticesRead(username: string | null) {
  if (!username) return;
  const key = username.trim().toLowerCase();
  writeAll(readAll().map((item) => (item.username === key ? { ...item, read: true } : item)));
}

export function pushDinerNotice(
  username: string | null,
  bookingId: string,
  copy: { title: string; detail: string },
) {
  upsertLiveNotice(username, bookingId, copy, { unread: true });
}

export function upsertLiveNotice(
  username: string | null,
  bookingId: string,
  copy: { title: string; detail: string },
  options: { unread: boolean; id?: string } = { unread: true },
) {
  if (!username || typeof window === "undefined") return;
  const booking = getBookingById(bookingId);
  const id = options.id ?? `n-${bookingId}-flexi-${Date.now()}`;
  const existing = readAll().find((item) => item.id === id);
  if (existing && existing.title === copy.title && existing.detail === copy.detail && !options.unread) {
    return;
  }
  const notice: DinerNotice = {
    id,
    username: username.trim().toLowerCase(),
    bookingId,
    restaurantName: booking?.restaurantName ?? "",
    status: "accepted",
    title: copy.title,
    detail: copy.detail,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    read: options.unread ? false : (existing?.read ?? true),
  };
  writeAll([notice, ...readAll().filter((item) => item.id !== id)]);
}

const OTW_STAGE_KEY = "flexidine-otw-notice-stage";

function readOtwStage(bookingId: string) {
  try {
    return window.sessionStorage.getItem(`${OTW_STAGE_KEY}:${bookingId}`);
  } catch {
    return null;
  }
}

function writeOtwStage(bookingId: string, stage: string) {
  try {
    window.sessionStorage.setItem(`${OTW_STAGE_KEY}:${bookingId}`, stage);
  } catch {
    /* ignore */
  }
}

export function syncOnTheWayLiveNotices(username: string | null): DinerNotice[] {
  if (!username || typeof window === "undefined") return [];
  const toasts: DinerNotice[] = [];
  for (const booking of bookingsForDiner(username)) {
    const copy = livePreorderCopy(booking);
    if (!copy) continue;
    const liveId = `n-${booking.id}-otw-live`;
    const previous = readOtwStage(booking.id);
    const changed = previous !== copy.stage;
    upsertLiveNotice(username, booking.id, copy, { unread: changed, id: liveId });
    writeOtwStage(booking.id, copy.stage);
    if (changed) {
      const notice = noticesForDiner(username).find((item) => item.id === liveId);
      if (notice) toasts.push(notice);
    }
  }
  return toasts;
}

function readSnap(username: string): Record<string, DinerStatusKey> | null {
  try {
    const raw = window.localStorage.getItem(`${SNAP_KEY}:${username.trim().toLowerCase()}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, DinerStatusKey>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeSnap(username: string, snap: Record<string, DinerStatusKey>) {
  window.localStorage.setItem(`${SNAP_KEY}:${username.trim().toLowerCase()}`, JSON.stringify(snap));
}

function currentStatuses(username: string): Record<string, DinerStatusKey> {
  const snap: Record<string, DinerStatusKey> = {};
  for (const booking of bookingsForDiner(username)) {
    snap[booking.id] = dinerStatusKey(booking, getTicketByOrderId(booking.id));
  }
  return snap;
}

export const DINER_WATCH_EVENTS = [BOOKING_EVENT, KITCHEN_EVENT, ORDER_EVENT, DINER_NOTICE_EVENT];

export function syncDinerNotices(username: string | null): DinerNotice[] {
  if (!username || typeof window === "undefined") return [];
  const current = currentStatuses(username);
  const previous = readSnap(username);
  writeSnap(username, current);
  if (!previous) return [];

  const created: DinerNotice[] = [];
  const key = username.trim().toLowerCase();
  for (const [bookingId, status] of Object.entries(current)) {
    if (!previous[bookingId] || previous[bookingId] === status) continue;
    const booking = getBookingById(bookingId);
    if (!booking) continue;
    const copy = dinerStatusCopy(booking, getTicketByOrderId(bookingId));
    created.push({
      id: `n-${bookingId}-${status}-${Date.now()}`,
      username: key,
      bookingId,
      restaurantName: booking.restaurantName,
      status,
      title: copy.label,
      detail: `${booking.restaurantName} · ${copy.detail}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
  if (created.length === 0) return [];
  writeAll([...created, ...readAll()]);
  return created;
}
