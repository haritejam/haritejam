"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { addBooking } from "@/lib/bookings";
import type { DiningIntent, Restaurant } from "@/lib/restaurant-data";
import { availableSlots, formatSlotLabel, formatVisitDay, upcomingDays, type DayOption } from "@/lib/visit-slots";
import { VisitSchedule } from "@/components/visit-schedule";

const visitOptions: { id: DiningIntent; title: string; detail: string }[] = [
  {
    id: "reserve",
    title: "Reserve a table",
    detail: "Hold a table. No menu required.",
  },
  {
    id: "reserve-preorder",
    title: "Reserve a table and pre-order the food",
    detail: "Book seats and choose dishes now.",
  },
  {
    id: "pickup",
    title: "Pre-order food for pickup",
    detail: "Skip the table. Collect when ready.",
  },
];

function ThinkerNote({ children }: { children: string }) {
  return (
    <aside className="thinker-note mt-8 flex gap-4 rounded-[6px] border bg-surface p-4 sm:p-5">
      <span className="thinker-orb mt-0.5 h-10 w-10 shrink-0 rounded-[6px]" aria-hidden="true" />
      <p className="text-sm leading-6 text-muted">{children}</p>
    </aside>
  );
}

interface RestaurantExperienceProps {
  restaurant: Restaurant;
  intent?: DiningIntent;
}

export function RestaurantExperience({ restaurant, intent }: RestaurantExperienceProps) {
  const [mode, setMode] = useState<DiningIntent | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [guests, setGuests] = useState(2);
  const [placed, setPlaced] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [days, setDays] = useState<DayOption[]>([]);
  const [visitDate, setVisitDate] = useState("");
  const [slot, setSlot] = useState("");

  useEffect(() => {
    const current = new Date();
    const nextDays = upcomingDays(current);
    setNow(current);
    setDays(nextDays);
    setMode(intent ?? null);
    setCart({});
    setPlaced(false);
    setGuests(2);
    setVisitDate(nextDays[0]?.value ?? "");
    setSlot("");
  }, [intent, restaurant.id]);

  const lines = useMemo(
    () =>
      restaurant.menuItems
        .map((menuItem) => ({ menuItem, quantity: cart[menuItem.id] ?? 0 }))
        .filter((line) => line.quantity > 0),
    [cart, restaurant.menuItems],
  );

  const totalRupees = lines.reduce((sum, line) => sum + line.menuItem.priceRupees * line.quantity, 0);
  const showMenu = mode === "reserve-preorder" || mode === "pickup";
  const showGuests = mode === "reserve" || mode === "reserve-preorder";
  const scheduleKind = mode === "pickup" ? "pickup" : "dine";
  const openSlots = now && visitDate ? availableSlots(scheduleKind, visitDate, now) : [];
  const canConfirm =
    Boolean(mode && visitDate && slot && openSlots.includes(slot)) &&
    (mode === "reserve" || ((mode === "reserve-preorder" || mode === "pickup") && lines.length > 0));

  function updateQty(id: string, delta: number) {
    setPlaced(false);
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

  function confirm() {
    if (!canConfirm || !mode) {
      return;
    }
    addBooking({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      kind: mode,
      guests: showGuests ? guests : 0,
      items: lines.map((line) => ({ name: line.menuItem.name, quantity: line.quantity })),
      totalRupees,
      visitDate,
      slot,
    });
    setPlaced(true);
  }

  const confirmLabel =
    mode === "pickup" ? "Confirm pickup order" : mode === "reserve" ? "Confirm table booking" : "Confirm table booking";

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
        <h2 className="mt-8 text-lg font-semibold">How would you like to dine?</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {visitOptions.map((option) => {
            const selected = mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setMode(option.id);
                  setPlaced(false);
                  setSlot("");
                  if (option.id === "reserve") {
                    setCart({});
                  }
                }}
                className={`rounded-[6px] border px-4 py-5 text-left transition ${
                  selected
                    ? "border-accent bg-accent/12"
                    : "border-line bg-surface hover:border-accent/40"
                }`}
              >
                <p className="text-sm font-semibold leading-snug">{option.title}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{option.detail}</p>
              </button>
            );
          })}
        </div>

        {mode && (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              {mode === "reserve" && (
                <p className="site-card p-5 text-sm leading-6 text-muted">
                  This is a table booking only. You will choose dishes at the restaurant.
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

              {mode === "reserve-preorder" && (
                <ThinkerNote>
                  No need to worry if plans change. You can switch this booking to pickup with FlexiSwitch.
                </ThinkerNote>
              )}
              {mode === "pickup" && (
                <ThinkerNote>
                  No need to worry if plans change. You can switch this to dine-in with FlexiSwitch up to an hour before arrival.
                </ThinkerNote>
              )}
            </div>

            <aside className="site-card h-fit p-6 lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {mode === "pickup" ? "Pickup order" : "Table booking"}
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
              {now ? (
                <VisitSchedule
                  kind={scheduleKind}
                  days={days}
                  visitDate={visitDate}
                  slot={slot}
                  now={now}
                  onDateChange={(value) => {
                    setVisitDate(value);
                    setSlot("");
                    setPlaced(false);
                  }}
                  onSlotChange={(value) => {
                    setSlot(value);
                    setPlaced(false);
                  }}
                />
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

              {showMenu && (
                <p className="mt-5 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{totalRupees > 0 ? `₹${totalRupees.toLocaleString("en-IN")}` : "—"}</span>
                </p>
              )}

              <button
                type="button"
                onClick={confirm}
                disabled={!canConfirm}
                className="site-btn mt-5 w-full"
              >
                {confirmLabel}
              </button>

              {placed && (
                <p className="mt-4 rounded-[6px] bg-accent/15 px-3 py-3 text-sm text-foreground">
                  {mode === "pickup"
                    ? `Pickup confirmed for ${formatVisitDay(visitDate)} at ${formatSlotLabel(slot)}. The kitchen will have your dishes ready.`
                    : mode === "reserve"
                      ? `Table booked for ${guests} ${guests === 1 ? "guest" : "guests"} on ${formatVisitDay(visitDate)} at ${formatSlotLabel(slot)}.`
                      : `Table booked for ${guests} ${guests === 1 ? "guest" : "guests"} on ${formatVisitDay(visitDate)} at ${formatSlotLabel(slot)}, and your pre-order is with the kitchen.`}
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
