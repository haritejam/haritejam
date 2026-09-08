"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { addBooking, getBookingById, type Booking } from "@/lib/bookings";
import { fulfillPendingBooking, readPendingBooking, savePendingBooking } from "@/lib/booking-draft";
import { pushDinerNotice } from "@/lib/diner-notifications";
import { setTablePreorder } from "@/lib/on-the-way-order";
import { livePreorderCopy, isOnTheWayEligible, onTheWayWindow } from "@/lib/preorder-window";
import { readSession } from "@/lib/session";
import type { DiningIntent, Restaurant } from "@/lib/restaurant-data";
import { availableSlots, isAsapOffered, isAsapSlot, upcomingDays, type DayOption } from "@/lib/visit-slots";
import { GuestAuthModal } from "@/components/guest-auth-modal";
import { VisitSchedule } from "@/components/visit-schedule";
import { FlexiSwitchBanner } from "@/components/flexiswitch-banner";
import { SwitchIcon } from "@/components/icons";
import { getSettings } from "@/lib/restaurant-settings";
import { fulfillmentFromKind, quoteBill, discountPercentFor, tablePreorderPaySplit, TABLE_PREORDER_DEPOSIT_PERCENT, type TablePreorderPayPlan } from "@/lib/pricing";
const visitOptions: { id: DiningIntent; title: string; detail: string; flexi: boolean }[] = [
  {
    id: "reserve",
    title: "Reserve a table",
    detail:
      "Hold seats for your party. You choose the day and time; the restaurant keeps the table. Pre-order dishes on the way until 10 minutes before you sit.",
    flexi: true,
  },
  {
    id: "reserve-preorder",
    title: "Reserve a table and pre-order",
    detail: "Book seats and choose dishes now. FlexiSwitch can still move this to pickup or delivery before the kitchen fires.",
    flexi: true,
  },
  {
    id: "on-the-way",
    title: "Reserve table and order on the way",
    detail: "Pick a table time. Add dishes later while you travel, until 10 min before seating.",
    flexi: true,
  },
  {
    id: "pickup",
    title: "Pickup",
    detail: "Skip the table. Collect ASAP while the restaurant is open, or at a chosen time. FlexiSwitch can move this to dine-in or delivery.",
    flexi: true,
  },
  {
    id: "delivery",
    title: "Delivery",
    detail: "Same kitchen ticket, dropped at your address. FlexiSwitch is available on scheduled delivery, not on Deliver ASAP.",
    flexi: true,
  },
];

function ThinkerNote({ children }: { children: ReactNode }) {
  return (
    <aside className="thinker-note mt-8 flex gap-4 rounded-[6px] border bg-surface p-4 sm:p-5">
      <span className="thinker-orb mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-[6px] text-ink">
        <SwitchIcon className="h-5 w-5" />
      </span>
      <p className="text-sm leading-6 text-muted">{children}</p>
    </aside>
  );
}

interface RestaurantExperienceProps {
  restaurant: Restaurant;
  intent?: DiningIntent;
  bookingId?: string;
}

export function RestaurantExperience({ restaurant, intent, bookingId }: RestaurantExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState<DiningIntent | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [guests, setGuests] = useState(2);
  const [now, setNow] = useState<Date | null>(null);
  const [days, setDays] = useState<DayOption[]>([]);
  const [visitDate, setVisitDate] = useState("");
  const [slot, setSlot] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [payPlan, setPayPlan] = useState<TablePreorderPayPlan>("deposit");
  const [asapMinutes, setAsapMinutes] = useState(30);
  const [existing, setExisting] = useState<Booking | null>(null);
  const [placedBooking, setPlacedBooking] = useState<Booking | null>(null);
  const [closedHold, setClosedHold] = useState<Booking | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const current = new Date();
    const nextDays = upcomingDays(current);
    setNow(current);
    setDays(nextDays);
    const held = bookingId ? getBookingById(bookingId) : undefined;
    const matched = held && held.restaurantId === restaurant.id ? held : null;
    const canAddOnTheWay = Boolean(matched && isOnTheWayEligible(matched) && onTheWayWindow(matched).open);
    setExisting(canAddOnTheWay ? matched : null);
    setPlacedBooking(matched && !isOnTheWayEligible(matched) ? matched : null);
    setClosedHold(matched && isOnTheWayEligible(matched) && !canAddOnTheWay ? matched : null);
    setMode(intent ?? (canAddOnTheWay ? "on-the-way" : null));
    setGuests(matched?.guests || 2);
    setVisitDate(matched?.visitDate || nextDays[0]?.value || "");
    if (matched?.slot) {
      setSlot(matched.slot);
    } else if (intent === "pickup" || intent === "delivery") {
      setSlot(isAsapOffered(current) ? "asap" : "");
    } else {
      setSlot("");
    }
    if (matched) {
      const nextCart: Record<string, number> = {};
      for (const item of restaurant.menuItems) {
        const line = matched.items.find((entry) => entry.name === item.name);
        if (line) nextCart[item.id] = line.quantity;
      }
      setCart(nextCart);
    } else {
      setCart({});
    }
    setAsapMinutes(getSettings(restaurant.id).asapPrepMinutes);
    setDeliveryAddress("");
  }, [intent, restaurant.id, bookingId]);

  const lines = useMemo(
    () =>
      restaurant.menuItems
        .map((menuItem) => ({ menuItem, quantity: cart[menuItem.id] ?? 0 }))
        .filter((line) => line.quantity > 0),
    [cart, restaurant.menuItems],
  );

  const subtotalRupees = lines.reduce((sum, line) => sum + line.menuItem.priceRupees * line.quantity, 0);
  const settings = getSettings(restaurant.id);
  const bill = quoteBill(subtotalRupees, fulfillmentFromKind(mode), settings);
  const showMenu =
    mode === "reserve-preorder" ||
    mode === "pickup" ||
    mode === "delivery" ||
    Boolean(existing && mode === "on-the-way");
  const showGuests = mode === "reserve" || mode === "reserve-preorder" || mode === "on-the-way";
  const scheduleKind = mode === "pickup" || mode === "delivery" ? mode : "dine";
  const openSlots = now && visitDate ? availableSlots(mode === "pickup" || mode === "delivery" ? "pickup" : "dine", visitDate, now) : [];
  const tableReady = Boolean(visitDate && slot && openSlots.includes(slot));
  const pickupReady =
    mode === "pickup" || mode === "delivery"
      ? isAsapSlot(slot)
        ? mode !== "delivery" || deliveryAddress.trim().length > 8
        : Boolean(visitDate && slot && openSlots.includes(slot)) && (mode !== "delivery" || deliveryAddress.trim().length > 8)
      : tableReady;
  const canConfirm = existing
    ? Boolean(existing)
    : Boolean(mode && pickupReady) &&
      (mode === "reserve" ||
        mode === "on-the-way" ||
        ((mode === "reserve-preorder" || mode === "pickup" || mode === "delivery") && lines.length > 0));

  function updateQty(id: string, delta: number) {
    setCart((current) => {
      const next = Math.max(0, (current[id] ?? 0) + delta);
      if (next === 0) {
        const rest = { ...current };
        delete rest[id];
        return rest;
      }
      return { ...current, [id]: next };
    });
  }

  function returnTo() {
    if (typeof window !== "undefined") {
      return `${window.location.pathname}${window.location.search}`;
    }
    return pathname;
  }

  function draftPayload() {
    if (!mode) {
      return null;
    }
    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      kind: mode,
      guests: showGuests ? guests : 0,
      items: lines.map((line) => ({
        name: line.menuItem.name,
        quantity: line.quantity,
        unitPriceRupees: line.menuItem.priceRupees,
      })),
      subtotalRupees: bill.subtotalRupees,
      discountPercent: bill.discountPercent,
      packingRupees: bill.packingRupees,
      totalRupees: bill.totalRupees,
      visitDate,
      slot,
      deliveryAddress: mode === "delivery" ? deliveryAddress.trim() : undefined,
      ...(mode === "reserve-preorder" && bill.totalRupees > 0
        ? {
            paymentPlan: payPlan,
            paidNowRupees: tablePreorderPaySplit(bill.totalRupees, payPlan).paidNowRupees,
            dueAtRestaurantRupees: tablePreorderPaySplit(bill.totalRupees, payPlan).dueAtRestaurantRupees,
          }
        : mode === "pickup" || mode === "delivery"
          ? {
              paymentPlan: "full" as const,
              paidNowRupees: bill.totalRupees,
              dueAtRestaurantRupees: 0,
            }
          : {}),
      returnTo: returnTo(),
    };
  }

  function goToConfirmation(bookingId: string) {
    router.push(`/booking/${bookingId}`);
  }

  function notifyHold(booking: ReturnType<typeof addBooking>) {
    const copy = livePreorderCopy(booking);
    if (copy && booking.dinerName) {
      pushDinerNotice(booking.dinerName, booking.id, copy);
    }
  }

  function placeForUser(username: string) {
    const pending = readPendingBooking();
    if (pending?.restaurantId === restaurant.id) {
      const booking = fulfillPendingBooking(username);
      if (booking) {
        notifyHold(booking);
        goToConfirmation(booking.id);
        return;
      }
    }
    const draft = draftPayload();
    if (!draft) {
      return;
    }
    const { returnTo: _returnTo, ...payload } = draft;
    const booking = addBooking({ ...payload, dinerName: username });
    notifyHold(booking);
    goToConfirmation(booking.id);
  }

  function confirm() {
    if (existing) {
      const result = setTablePreorder(
        existing.id,
        lines.map((line) => ({
          name: line.menuItem.name,
          quantity: line.quantity,
          unitPriceRupees: line.menuItem.priceRupees,
        })),
        subtotalRupees,
      );
      if (result.ok) {
        goToConfirmation(existing.id);
      }
      return;
    }
    if (!canConfirm || !mode) {
      return;
    }
    const draft = draftPayload();
    if (!draft) {
      return;
    }
    const session = readSession();
    if (!session) {
      savePendingBooking(draft);
      setAuthOpen(true);
      return;
    }
    const { returnTo: _returnTo, ...payload } = draft;
    const booking = addBooking({ ...payload, dinerName: session });
    notifyHold(booking);
    goToConfirmation(booking.id);
  }

  const intentOptions = visitOptions.filter((option) => option.id !== "delivery" || settings.allowDelivery);
  const paySplit = tablePreorderPaySplit(bill.totalRupees, payPlan);
  const confirmLabel =
    mode === "pickup"
      ? isAsapSlot(slot)
        ? "Place ASAP pickup"
        : "Confirm pickup order"
      : mode === "delivery"
        ? "Confirm delivery"
        : mode === "on-the-way"
          ? existing
            ? "Save on-the-way pre-order"
            : "Reserve table and order on the way"
          : mode === "reserve-preorder" && bill.totalRupees > 0
            ? `Pay ₹${paySplit.paidNowRupees.toLocaleString("en-IN")} now`
            : "Confirm table booking";

  return (
    <div className="bg-background text-foreground">
      <div className="relative h-[240px] overflow-hidden sm:h-[300px]">
        <Image src={restaurant.image} alt={restaurant.imageAlt} fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="site-wrap pb-7">
            <Link href="/restaurants" className="text-sm text-accent hover:brightness-110">
              All restaurants
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{restaurant.name}</h1>
            <p className="mt-2 text-sm text-white/80">
              {restaurant.cuisine} · {restaurant.neighborhood} · {restaurant.priceRange}
            </p>
          </div>
        </div>
      </div>

      <div className="site-wrap py-10">
        <p className="text-sm leading-7 text-muted">{restaurant.description}</p>
        {!placedBooking && !closedHold ? <FlexiSwitchBanner className="mt-8" /> : null}
        {placedBooking ? (
          <div className="site-card mt-8 p-5">
            <p className="text-sm font-semibold text-foreground">This order is already confirmed</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {placedBooking.kind === "pickup" || placedBooking.kind === "delivery"
                ? "Pickup and delivery cannot add more dishes after you place them. Follow status on the confirmation."
                : "This table booking already includes your dishes. On-the-way pre-order is only for a table hold without a menu yet."}
            </p>
            <Link href={`/booking/${placedBooking.id}`} className="site-btn mt-4 inline-flex">
              View confirmation
            </Link>
          </div>
        ) : closedHold ? (
          <div className="site-card mt-8 p-5">
            <p className="text-sm font-semibold text-foreground">Pre-order on the way is closed</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Last cutoff is 10 minutes before your table time. You can still dine; the kitchen will take the order at the
              restaurant.
            </p>
            <Link href={`/booking/${closedHold.id}`} className="site-btn mt-4 inline-flex">
              View confirmation
            </Link>
          </div>
        ) : !existing ? (
          <>
            <h2 className="mt-8 text-lg font-semibold">How would you like to dine?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {intentOptions.map((option) => {
                const selected = mode === option.id;
                const offer = discountPercentFor(fulfillmentFromKind(option.id), settings);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setMode(option.id);
                      setSlot(option.id === "pickup" || option.id === "delivery" ? (isAsapOffered(now ?? new Date()) ? "asap" : "") : "");
                      setPayPlan("deposit");
                      if (option.id === "reserve") {
                        setCart({});
                      }
                    }}
                    className={`relative rounded-[6px] border px-4 py-5 pr-16 text-left transition ${
                      selected
                        ? "border-accent bg-accent/12"
                        : "border-line bg-surface hover:border-accent/40"
                    }`}
                  >
                    {option.flexi ? (
                      <span className="absolute bottom-3 right-3 text-accent" title="FlexiSwitch available">
                        <SwitchIcon className="h-4 w-4" />
                      </span>
                    ) : null}
                    {offer > 0 ? (
                      <span className="absolute right-3 top-3 rounded-[4px] bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink">
                        {offer}% off
                      </span>
                    ) : null}
                    <p className="text-sm font-semibold leading-snug">{option.title}</p>
                    <p className="mt-2 text-xs leading-5 text-muted">{option.detail}</p>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <h2 className="mt-8 text-lg font-semibold">Pre-order on the way</h2>
        )}

        {mode && !placedBooking && !closedHold && (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              {mode === "reserve" && !existing && (
                <ThinkerNote>
                  Reserve a table for your party. FlexiSwitch opens after you pre-order, so you can still move to pickup or delivery before the kitchen fires.
                </ThinkerNote>
              )}
              {existing && (
                <p className="site-card p-5 text-sm leading-6 text-muted">
                  Your table is held. Add dishes now. Last cutoff is 10 minutes before seating.
                </p>
              )}

              {showMenu && (
                <ul className="divide-y divide-line border-y border-line">
                  {restaurant.menuItems.map((menuItem) => (
                    <li key={menuItem.id} className="flex items-start justify-between gap-4 py-5">
                      <div>
                        <p className="font-medium">{menuItem.name}</p>
                        <p className="mt-1 text-sm text-muted">{menuItem.description}</p>
                        <p className="mt-2 text-sm text-accent">{menuItem.priceLabel}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-[6px] border border-line text-lg"
                          onClick={() => updateQty(menuItem.id, -1)}
                          aria-label={`Remove ${menuItem.name}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm">{cart[menuItem.id] ?? 0}</span>
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-[6px] bg-accent text-lg text-ink"
                          onClick={() => updateQty(menuItem.id, 1)}
                          aria-label={`Add ${menuItem.name}`}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {mode === "on-the-way" && !existing && (
                <ThinkerNote>
                  Same as a table reservation: choose guests and a time. After you confirm, a live notice will take you back to this
                  menu to order on the way until 10 minutes before you sit. FlexiSwitch opens once dishes are on the ticket.
                </ThinkerNote>
              )}
              {mode === "pickup" && (
                <ThinkerNote>
                  Pickup can FlexiSwitch to dine-in or delivery until the kitchen has the ticket. Pick ASAP is only offered while the restaurant is open (noon–10:00 PM).
                </ThinkerNote>
              )}
              {mode === "delivery" && isAsapSlot(slot) && (
                <ThinkerNote>
                  Deliver ASAP has no FlexiSwitch. If you need to change fulfillment later, choose a scheduled delivery time instead.
                </ThinkerNote>
              )}
              {mode === "delivery" && !isAsapSlot(slot) && (
                <ThinkerNote>
                  Scheduled delivery is a FlexiDine fulfillment on the same kitchen ticket. You can FlexiSwitch to pickup or dine-in if the rider window fails, until the kitchen fires.
                </ThinkerNote>
              )}
            </div>

            <aside className="site-card h-fit p-6 lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {mode === "pickup"
                  ? "Pickup order"
                  : mode === "delivery"
                    ? "Delivery"
                    : mode === "on-the-way"
                      ? "Table booking"
                      : "Table booking"}
              </p>
              {showGuests && (
                <label className="mt-4 block text-sm text-muted">
                  Guests
                  <select
                    value={guests}
                    onChange={(event) => setGuests(Number(event.target.value))}
                    className="mt-1 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground"
                  >
                    {Array.from({ length: 20 }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {count} {count === 1 ? "guest" : "guests"}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {existing ? (
                <p className="mt-4 text-sm text-muted">
                  Table time is already set for this booking. Add dishes below, then save.
                </p>
              ) : now ? (
                <VisitSchedule
                  kind={scheduleKind}
                  days={days}
                  visitDate={visitDate}
                  slot={slot}
                  now={now}
                  asapMinutes={asapMinutes}
                  onDateChange={(value) => {
                    setVisitDate(value);
                    setSlot("");
                  }}
                  onSlotChange={(value) => {
                    setSlot(value);
                    if (value === "asap" && days[0]?.value) {
                      setVisitDate(days[0].value);
                    }
                  }}
                />
              ) : null}
              {mode === "delivery" ? (
                <label className="mt-4 block text-sm text-muted">
                  Delivery address
                  <textarea
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-[6px] border border-line bg-background px-3 py-2 text-foreground"
                    placeholder="Building, street, area, pin"
                  />
                </label>
              ) : null}

              {lines.length > 0 && (
                <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                  {lines.map((line) => (
                    <li key={line.menuItem.id} className="flex justify-between gap-3 text-muted">
                      <span>
                        {line.quantity} × {line.menuItem.name}
                      </span>
                      <span>₹{(line.menuItem.priceRupees * line.quantity).toLocaleString("en-IN")}</span>
                    </li>
                  ))}
                </ul>
              )}

              {showMenu && bill.subtotalRupees > 0 ? (
                <div className="mt-5 space-y-1 text-sm">
                  <p className="flex justify-between text-muted">
                    <span>Menu</span>
                    <span>₹{bill.subtotalRupees.toLocaleString("en-IN")}</span>
                  </p>
                  {bill.discountPercent > 0 ? (
                    <p className="flex justify-between text-muted">
                      <span>{bill.discountPercent}% {mode === "pickup" ? "pickup" : mode === "delivery" ? "delivery" : "dine-in"} discount</span>
                      <span>−₹{bill.discountRupees.toLocaleString("en-IN")}</span>
                    </p>
                  ) : null}
                  {bill.packingRupees > 0 ? (
                    <p className="flex justify-between text-muted">
                      <span>Packing</span>
                      <span>₹{bill.packingRupees.toLocaleString("en-IN")}</span>
                    </p>
                  ) : null}
                  <p className="mt-3 flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>₹{bill.totalRupees.toLocaleString("en-IN")}</span>
                  </p>
                </div>
              ) : showMenu ? (
                <p className="mt-5 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>—</span>
                </p>
              ) : null}

              {mode === "reserve-preorder" && bill.totalRupees > 0 ? (
                <fieldset className="mt-5 border-t border-line pt-4">
                  <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Pay now</legend>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Table with food can feel like a big hit. Pay {TABLE_PREORDER_DEPOSIT_PERCENT}% now, or settle the whole bill.
                  </p>
                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      onClick={() => setPayPlan("deposit")}
                      className={`rounded-[6px] border px-3 py-3 text-left ${
                        payPlan === "deposit" ? "border-accent bg-accent/12" : "border-line hover:border-accent/40"
                      }`}
                    >
                      <p className="text-sm font-semibold">Pay {TABLE_PREORDER_DEPOSIT_PERCENT}% now</p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        ₹{tablePreorderPaySplit(bill.totalRupees, "deposit").paidNowRupees.toLocaleString("en-IN")} now · ₹
                        {tablePreorderPaySplit(bill.totalRupees, "deposit").dueAtRestaurantRupees.toLocaleString("en-IN")} at the
                        restaurant
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayPlan("full")}
                      className={`rounded-[6px] border px-3 py-3 text-left ${
                        payPlan === "full" ? "border-accent bg-accent/12" : "border-line hover:border-accent/40"
                      }`}
                    >
                      <p className="text-sm font-semibold">Pay in full</p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        ₹{bill.totalRupees.toLocaleString("en-IN")} now. Nothing due at the table.
                      </p>
                    </button>
                  </div>
                </fieldset>
              ) : null}

              <button
                type="button"
                onClick={confirm}
                disabled={!canConfirm}
                className="site-btn mt-5 w-full"
              >
                {confirmLabel}
              </button>
            </aside>
          </div>
        )}
      </div>
      {authOpen ? (
        <GuestAuthModal
          onClose={() => setAuthOpen(false)}
          onAuthenticated={(username) => {
            setAuthOpen(false);
            placeForUser(username);
          }}
        />
      ) : null}
    </div>
  );
}
