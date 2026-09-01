"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DiningIntent, Restaurant } from "@/lib/restaurant-data";

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
    <aside className="thinker-note mt-8 flex gap-4 rounded-2xl border border-[#c4a574]/25 bg-[#1c1814] p-4 sm:p-5">
      <span className="thinker-orb mt-0.5 h-10 w-10 shrink-0 rounded-full" aria-hidden="true" />
      <p className="text-sm leading-6 text-[#e8dcc8]">{children}</p>
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

  useEffect(() => {
    setMode(intent ?? null);
    setCart({});
    setPlaced(false);
    setGuests(2);
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
  const canConfirm =
    mode === "reserve" || ((mode === "reserve-preorder" || mode === "pickup") && lines.length > 0);

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
    if (!canConfirm) {
      return;
    }
    setPlaced(true);
  }

  const confirmLabel =
    mode === "pickup" ? "Confirm pickup order" : mode === "reserve" ? "Confirm table booking" : "Confirm table booking";

  return (
    <div className="bg-[#14110e] text-[#f4efe6]">
      <div className="relative h-[240px] overflow-hidden sm:h-[300px]">
        <Image src={restaurant.image} alt={restaurant.imageAlt} fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-[#14110e]/45 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1100px] px-5 pb-7 sm:px-8">
          <Link href="/restaurants" className="text-sm text-[#d4af7a] hover:text-[#e6c49a]">
            ← All restaurants
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{restaurant.name}</h1>
          <p className="mt-2 text-sm text-white/70">
            {restaurant.cuisine} · {restaurant.neighborhood} · {restaurant.priceRange}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
        <p className="text-sm leading-7 text-white/65">{restaurant.description}</p>
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
                  if (option.id === "reserve") {
                    setCart({});
                  }
                }}
                className={`rounded-2xl border px-4 py-5 text-left transition ${
                  selected
                    ? "border-[#d4af7a] bg-[#d4af7a]/12 shadow-[0_0_0_1px_#d4af7a]"
                    : "border-white/12 bg-[#1c1814] hover:border-[#d4af7a]/40"
                }`}
              >
                <p className="text-sm font-semibold leading-snug">{option.title}</p>
                <p className="mt-2 text-xs leading-5 text-white/55">{option.detail}</p>
              </button>
            );
          })}
        </div>

        {mode && (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              {mode === "reserve" && (
                <p className="rounded-2xl border border-white/10 bg-[#1c1814] p-5 text-sm leading-6 text-white/70">
                  This is a table booking only. You will choose dishes at the restaurant.
                </p>
              )}

              {showMenu && (
                <ul className="divide-y divide-white/10 border-y border-white/10">
                  {restaurant.menuItems.map((menuItem) => (
                    <li key={menuItem.id} className="flex items-start justify-between gap-4 py-5">
                      <div>
                        <p className="font-medium">{menuItem.name}</p>
                        <p className="mt-1 text-sm text-white/50">{menuItem.description}</p>
                        <p className="mt-2 text-sm text-[#e6c49a]">{menuItem.priceLabel}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-full border border-white/20 text-lg"
                          onClick={() => updateQty(menuItem.id, -1)}
                          aria-label={`Remove ${menuItem.name}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm">{cart[menuItem.id] ?? 0}</span>
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-full bg-[#d4af7a] text-lg text-[#1a140c]"
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

            <aside className="h-fit rounded-2xl border border-white/10 bg-[#1c1814] p-6 lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d4af7a]/80">
                {mode === "pickup" ? "Pickup order" : "Table booking"}
              </p>
              {showGuests && (
                <label className="mt-4 block text-sm text-white/60">
                  Guests
                  <select
                    value={guests}
                    onChange={(event) => setGuests(Number(event.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#14110e] px-3 py-2.5 text-white"
                  >
                    {Array.from({ length: 20 }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {count} {count === 1 ? "guest" : "guests"}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {mode === "pickup" && (
                <p className="mt-4 text-sm text-white/55">Collect at the counter · {restaurant.eta}</p>
              )}

              {lines.length > 0 && (
                <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
                  {lines.map((line) => (
                    <li key={line.menuItem.id} className="flex justify-between gap-3 text-white/80">
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
                className="mt-5 w-full rounded-full bg-[#d4af7a] py-3 text-sm font-semibold text-[#1a140c] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {confirmLabel}
              </button>

              {placed && (
                <p className="mt-4 rounded-xl bg-[#d4af7a]/15 px-3 py-3 text-sm text-[#e8d2b4]">
                  {mode === "pickup"
                    ? "Pickup order confirmed. The kitchen has started your dishes."
                    : mode === "reserve"
                      ? `Table booked for ${guests} ${guests === 1 ? "guest" : "guests"}.`
                      : `Table booked for ${guests} ${guests === 1 ? "guest" : "guests"}, and your pre-order is with the kitchen.`}
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
