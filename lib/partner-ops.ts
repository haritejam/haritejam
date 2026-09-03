import { readBookings, type Booking } from "@/lib/bookings";
import {
  patchLocalPartnerStatus,
  readPartnerApplication,
  type StoredPartnerValues,
} from "@/lib/partner-onboarding";
import { restaurants, type Restaurant } from "@/lib/restaurant-data";

export const PARTNER_EVENT = "flexidine-partner";
export const PARTNER_FLOW_EVENT = "flexidine-partner-flow";
export const PARTNER_HOME_EVENT = "flexidine-partner-home";
export const ADMIN_SESSION_KEY = "flexidine-admin";
export const KITCHEN_SESSION_KEY = "flexidine-kitchen";

export const ADMIN_NAME = "HariTeja";
export const ADMIN_PASSWORD = "Mangi@3003";
export const CATALOG_KITCHEN_PASSWORD = "Kitchen@3003";

const QUEUE_KEY = "flexidine-partner-queue";
const PUBLISHED_KEY = "flexidine-published-restaurants";
const ACCOUNTS_KEY = "flexidine-kitchen-accounts";
const MAIL_KEY = "flexidine-partner-mail";

export type QueueStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export type PartnerCredentials = {
  username: string;
  password: string;
};

export type PartnerMail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  openedMailClient: boolean;
};

export type KitchenAccount = {
  username: string;
  password: string;
  restaurantId: string;
  restaurantName: string;
  email: string;
  source: "catalog" | "approved";
};

export type QueuedApplication = {
  id: string;
  status: QueueStatus;
  values: StoredPartnerValues;
  submittedAt: string;
  reviewedAt?: string;
  restaurantId?: string;
  credentials?: PartnerCredentials;
  mailId?: string;
  rejectNote?: string;
};

function emitPartner() {
  window.dispatchEvent(new Event(PARTNER_EVENT));
}

export function emitPartnerFlow(filling: boolean) {
  window.dispatchEvent(new CustomEvent(PARTNER_FLOW_EVENT, { detail: { filling } }));
}

export function emitPartnerHome() {
  window.dispatchEvent(new Event(PARTNER_HOME_EVENT));
}

function sessionProof(...parts: string[]) {
  const payload = parts.join("\u001f");
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "partner";
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let token = "";
  for (let index = 0; index < 8; index += 1) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${token}@Fd`;
}

export function applicationIdFor(values: StoredPartnerValues) {
  return `app-${slugify(values.ownerEmail)}-${slugify(values.restaurantName)}`;
}

export function readPartnerQueue(): QueuedApplication[] {
  if (typeof window === "undefined") {
    return [];
  }
  const list = parseJson<QueuedApplication[]>(window.localStorage.getItem(QUEUE_KEY), []);
  return Array.isArray(list) ? list : [];
}

function writeQueue(list: QueuedApplication[]) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
  emitPartner();
}

export function readKitchenAccounts(): KitchenAccount[] {
  if (typeof window === "undefined") {
    return [];
  }
  ensureCatalogKitchenAccounts();
  const list = parseJson<KitchenAccount[]>(window.localStorage.getItem(ACCOUNTS_KEY), []);
  return Array.isArray(list) ? list : [];
}

function writeAccounts(list: KitchenAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

export function ensureCatalogKitchenAccounts() {
  if (typeof window === "undefined") {
    return;
  }
  const existing = parseJson<KitchenAccount[]>(window.localStorage.getItem(ACCOUNTS_KEY), []);
  const known = new Set(existing.map((account) => account.restaurantId));
  const seeded = [...existing];
  for (const restaurant of restaurants) {
    if (known.has(restaurant.id)) {
      continue;
    }
    seeded.push({
      username: restaurant.id,
      password: CATALOG_KITCHEN_PASSWORD,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      email: `kitchen@${restaurant.id}.flexidine.test`,
      source: "catalog",
    });
  }
  if (seeded.length !== existing.length) {
    writeAccounts(seeded);
  }
}

export function enqueuePartnerApplication(values: StoredPartnerValues) {
  const id = applicationIdFor(values);
  const current = readPartnerQueue();
  const next: QueuedApplication = {
    id,
    status: "PENDING_APPROVAL",
    values,
    submittedAt: new Date().toISOString(),
  };
  writeQueue([next, ...current.filter((item) => item.id !== id)]);
}

export function readPublishedRestaurants(): Restaurant[] {
  if (typeof window === "undefined") {
    return [];
  }
  const list = parseJson<Restaurant[]>(window.localStorage.getItem(PUBLISHED_KEY), []);
  return Array.isArray(list) ? list : [];
}

function writePublished(list: Restaurant[]) {
  window.localStorage.setItem(PUBLISHED_KEY, JSON.stringify(list));
}

export function listLiveRestaurants(): Restaurant[] {
  const published = readPublishedRestaurants();
  const seen = new Set(restaurants.map((restaurant) => restaurant.id));
  return [...restaurants, ...published.filter((restaurant) => !seen.has(restaurant.id))];
}

export function getLiveRestaurantById(id: string): Restaurant | undefined {
  return listLiveRestaurants().find((restaurant) => restaurant.id === id);
}

export function readPartnerMail(): PartnerMail[] {
  if (typeof window === "undefined") {
    return [];
  }
  const list = parseJson<PartnerMail[]>(window.localStorage.getItem(MAIL_KEY), []);
  return Array.isArray(list) ? list : [];
}

function writeMail(list: PartnerMail[]) {
  window.localStorage.setItem(MAIL_KEY, JSON.stringify(list));
}

function uniqueRestaurantId(name: string) {
  const base = slugify(name);
  const taken = new Set([
    ...restaurants.map((restaurant) => restaurant.id),
    ...readPublishedRestaurants().map((restaurant) => restaurant.id),
    ...readKitchenAccounts().map((account) => account.restaurantId),
  ]);
  if (!taken.has(base)) {
    return base;
  }
  let index = 2;
  while (taken.has(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

function uniqueUsername(restaurantId: string) {
  const taken = new Set(readKitchenAccounts().map((account) => account.username.toLowerCase()));
  if (!taken.has(restaurantId.toLowerCase())) {
    return restaurantId;
  }
  let suffix = 2;
  while (taken.has(`${restaurantId}${suffix}`.toLowerCase())) {
    suffix += 1;
  }
  return `${restaurantId}${suffix}`;
}

const coverImages = [
  "/images/serein-house.jpg",
  "/images/pasta-social.jpg",
  "/images/honey-and-smoke.jpg",
  "/images/the-verandah.jpg",
  "/images/little-saigon.jpg",
  "/images/restaurant-onboarding.jpg",
] as const;

function restaurantFromApplication(id: string, values: StoredPartnerValues): Restaurant {
  const cover = coverImages[Math.abs(id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % coverImages.length];
  return {
    id,
    name: values.restaurantName,
    neighborhood: values.city,
    location: values.city,
    cuisine: values.cuisine,
    description: `Approved FlexiDine partner. ${values.seatingCapacity} seats. Prep ${values.dineInPrepMinutes} min dine-in, ${values.pickupPrepMinutes} min pickup.`,
    rating: 4.8,
    reviewCount: 1,
    priceRange: "$$$",
    distance: "Nearby",
    eta: `${values.pickupPrepMinutes}–${values.pickupPrepMinutes + 8} min`,
    offer: "New on FlexiDine",
    image: cover,
    imageAlt: `${values.restaurantName} dining room`,
    capabilities: ["Prebook", "Pre-Order", "Pickup"],
    nextAvailability: "Tables from 7:00 PM",
    menuItems: [
      {
        id: `${id}-1`,
        name: "Kitchen signature plate",
        description: "From the uploaded partner menu",
        priceRupees: 640,
        priceLabel: "₹640",
      },
      {
        id: `${id}-2`,
        name: "Seasonal starter",
        description: "Chef’s opening plate",
        priceRupees: 380,
        priceLabel: "₹380",
      },
      {
        id: `${id}-3`,
        name: "House dessert",
        description: "To close the ticket",
        priceRupees: 280,
        priceLabel: "₹280",
      },
    ],
  };
}

function sendCredentialEmail(to: string, restaurantName: string, credentials: PartnerCredentials) {
  const origin = window.location.origin;
  const subject = `FlexiDine kitchen login for ${restaurantName}`;
  const body = [
    `Hello,`,
    ``,
    `${restaurantName} is approved and live on FlexiDine.`,
    ``,
    `Username: ${credentials.username}`,
    `Password: ${credentials.password}`,
    ``,
    `Sign in on the onboarding page: ${origin}/partner/register`,
    `Open order management to approve diner tickets. Kitchen stays empty until you approve.`,
    ``,
    `FlexiDine`,
  ].join("\n");
  const mail: PartnerMail = {
    id: `mail-${Date.now()}`,
    to,
    subject,
    body,
    sentAt: new Date().toISOString(),
    openedMailClient: false,
  };
  try {
    window.open(`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    mail.openedMailClient = true;
  } catch {
    mail.openedMailClient = false;
  }
  writeMail([mail, ...readPartnerMail()]);
  return mail;
}

function syncLocalApplication(values: StoredPartnerValues, status: QueueStatus) {
  const local = readPartnerApplication();
  if (!local) {
    return;
  }
  if (
    local.values.ownerEmail.toLowerCase() === values.ownerEmail.toLowerCase() &&
    local.values.restaurantName.trim().toLowerCase() === values.restaurantName.trim().toLowerCase()
  ) {
    patchLocalPartnerStatus(status);
  }
}

export function approveApplication(id: string) {
  ensureCatalogKitchenAccounts();
  const queue = readPartnerQueue();
  const target = queue.find((item) => item.id === id);
  if (!target || target.status === "APPROVED") {
    return target ?? null;
  }

  const restaurantId = target.restaurantId ?? uniqueRestaurantId(target.values.restaurantName);
  const credentials: PartnerCredentials = {
    username: uniqueUsername(restaurantId),
    password: randomPassword(),
  };
  const published = restaurantFromApplication(restaurantId, target.values);
  writePublished([published, ...readPublishedRestaurants().filter((item) => item.id !== restaurantId)]);

  const accounts = readKitchenAccounts().filter(
    (account) => account.restaurantId !== restaurantId && account.username !== credentials.username,
  );
  writeAccounts([
    {
      username: credentials.username,
      password: credentials.password,
      restaurantId,
      restaurantName: target.values.restaurantName,
      email: target.values.ownerEmail,
      source: "approved",
    },
    ...accounts,
  ]);

  const mail = sendCredentialEmail(target.values.ownerEmail, target.values.restaurantName, credentials);
  const next: QueuedApplication = {
    ...target,
    status: "APPROVED",
    reviewedAt: new Date().toISOString(),
    restaurantId,
    credentials,
    mailId: mail.id,
  };
  writeQueue(queue.map((item) => (item.id === id ? next : item)));
  syncLocalApplication(target.values, "APPROVED");
  return next;
}

export function rejectApplication(id: string, rejectNote: string) {
  const queue = readPartnerQueue();
  const target = queue.find((item) => item.id === id);
  if (!target) {
    return null;
  }
  const next: QueuedApplication = {
    ...target,
    status: "REJECTED",
    reviewedAt: new Date().toISOString(),
    rejectNote,
  };
  writeQueue(queue.map((item) => (item.id === id ? next : item)));
  syncLocalApplication(target.values, "REJECTED");
  return next;
}

export function resendApprovalEmail(id: string) {
  const target = readPartnerQueue().find((item) => item.id === id);
  if (!target?.credentials) {
    return null;
  }
  const mail = sendCredentialEmail(target.values.ownerEmail, target.values.restaurantName, target.credentials);
  writeQueue(
    readPartnerQueue().map((item) => (item.id === id ? { ...item, mailId: mail.id } : item)),
  );
  return mail;
}

export function readAdminSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(ADMIN_SESSION_KEY) === sessionProof(ADMIN_NAME, ADMIN_PASSWORD);
}

export function writeAdminSession() {
  window.localStorage.setItem(ADMIN_SESSION_KEY, sessionProof(ADMIN_NAME, ADMIN_PASSWORD));
  emitPartner();
}

export function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  emitPartner();
}

export function loginAdmin(name: string, password: string) {
  if (name.trim() === ADMIN_NAME && password === ADMIN_PASSWORD) {
    writeAdminSession();
    return true;
  }
  return false;
}

type KitchenSessionRecord = {
  username: string;
  proof: string;
};

export function readKitchenSession(): KitchenAccount | null {
  if (typeof window === "undefined") {
    return null;
  }
  ensureCatalogKitchenAccounts();
  const raw = window.localStorage.getItem(KITCHEN_SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as KitchenSessionRecord;
    if (!parsed?.username || !parsed.proof) {
      window.localStorage.removeItem(KITCHEN_SESSION_KEY);
      return null;
    }
    const account = readKitchenAccounts().find((item) => item.username === parsed.username);
    if (!account || parsed.proof !== sessionProof(account.username, account.password, account.restaurantId)) {
      window.localStorage.removeItem(KITCHEN_SESSION_KEY);
      return null;
    }
    return account;
  } catch {
    window.localStorage.removeItem(KITCHEN_SESSION_KEY);
    return null;
  }
}

export function loginKitchen(username: string, password: string) {
  ensureCatalogKitchenAccounts();
  const account = readKitchenAccounts().find(
    (item) => item.username.toLowerCase() === username.trim().toLowerCase() && item.password === password,
  );
  if (!account) {
    return null;
  }
  const record: KitchenSessionRecord = {
    username: account.username,
    proof: sessionProof(account.username, account.password, account.restaurantId),
  };
  window.localStorage.setItem(KITCHEN_SESSION_KEY, JSON.stringify(record));
  emitPartner();
  return account;
}

export function clearKitchenSession() {
  window.localStorage.removeItem(KITCHEN_SESSION_KEY);
  emitPartner();
}

export function bookingsForRestaurant(restaurantId: string): Booking[] {
  return readBookings().filter((booking) => booking.restaurantId === restaurantId);
}

export function kitchenTicketsForRestaurant(restaurantId: string): Booking[] {
  return bookingsForRestaurant(restaurantId).filter((booking) => booking.kitchenStatus === "approved");
}
