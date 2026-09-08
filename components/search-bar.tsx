"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import { parseSearchQuery, restaurants, restaurantsInCity, searchRestaurants } from "@/lib/restaurant-data";
import { PARTNER_EVENT, listLiveRestaurants } from "@/lib/partner-ops";
import { useCity } from "@/lib/use-city";
import type { Restaurant } from "@/lib/restaurant-data";

function scrollToRestaurants() {
  document.getElementById("restaurants")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function topNearby(list: readonly Restaurant[], city: string, query: string) {
  const inCity = restaurantsInCity(list, city);
  const matched = searchRestaurants(inCity, query);
  return [...matched].sort((a, b) => b.rating - a.rating).slice(0, 6);
}

export function SearchBar({ appearance = "light" }: { appearance?: "light" | "hero" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { city } = useCity({ detect: false });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState(() => [...restaurants]);
  const rootRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setQuery(parseSearchQuery(searchParams.get("q") ?? undefined));
  }, [searchParams]);

  useEffect(() => {
    function sync() {
      setLive(listLiveRestaurants());
    }
    sync();
    window.addEventListener(PARTNER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PARTNER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const suggestions = useMemo(() => topNearby(live, city, query), [live, city, query]);

  function go(nextQuery: string) {
    const q = nextQuery.trim();
    setOpen(false);
    const onHome = pathname === "/";
    if (onHome) {
      router.push(q ? `/?q=${encodeURIComponent(q)}#restaurants` : "/#restaurants");
      window.setTimeout(scrollToRestaurants, 40);
      return;
    }
    router.push(q ? `/restaurants?q=${encodeURIComponent(q)}` : "/restaurants");
  }

  function openRestaurant(restaurant: Restaurant) {
    setOpen(false);
    setQuery("");
    router.push(`/restaurants/${restaurant.id}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (suggestions.length === 1 && query.trim()) {
      openRestaurant(suggestions[0]);
      return;
    }
    go(query);
  }

  const hero = appearance === "hero";

  return (
    <form
      ref={rootRef}
      onSubmit={handleSubmit}
      className={
        hero
          ? "hero-search relative"
          : "site-card relative mt-8 flex w-full max-w-[690px] flex-col gap-2 p-1.5 sm:flex-row sm:items-center sm:gap-0"
      }
      role="search"
    >
      <label className={hero ? "hero-search-field" : "flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 sm:py-2"} htmlFor="restaurant-search">
        <SearchIcon className="h-5 w-5 shrink-0 text-accent" />
        <span className="sr-only">Top restaurants near you</span>
        <input
          id="restaurant-search"
          type="text"
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          placeholder="Top restaurants near you"
          className="search-suggest-input min-w-0 flex-1 border-0 bg-transparent text-[15px] text-foreground shadow-none outline-none ring-0 placeholder:text-muted"
          aria-expanded={open}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          role="combobox"
        />
      </label>
      <div className={hero ? "hero-search-actions" : "flex items-center gap-1 sm:pl-1"}>
        <button type="button" className={hero ? "hero-search-nearby" : "px-3 py-2.5 text-sm font-semibold text-accent sm:py-2"} onClick={() => go("")}>
          Nearby
        </button>
        <button type="submit" className="site-btn">
          Search
        </button>
      </div>

      {open ? (
        <div
          id="search-suggestions"
          role="listbox"
          aria-label={`Top restaurants near you in ${city}`}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[6px] border border-line bg-surface shadow-[0_16px_40px_rgba(15,14,12,0.28)]"
        >
          <p className="border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Top restaurants near you · {city}
          </p>
          {suggestions.length > 0 ? (
            <ul>
              {suggestions.map((restaurant) => (
                <li key={restaurant.id}>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-black/[0.04]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openRestaurant(restaurant)}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{restaurant.name}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {restaurant.cuisine} · {restaurant.neighborhood}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-foreground">{restaurant.rating.toFixed(1)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-muted">No restaurants listed in {city} yet.</p>
          )}
        </div>
      ) : null}
    </form>
  );
}
