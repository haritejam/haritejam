"use client";

import { useEffect, useMemo, useState } from "react";
import { RestaurantGrid } from "@/components/restaurant-grid";
import type { DiningIntent } from "@/lib/restaurant-data";
import { PARTNER_EVENT, listLiveRestaurants } from "@/lib/partner-ops";
import { restaurants, restaurantsInCity, searchRestaurants } from "@/lib/restaurant-data";
import { useCity } from "@/lib/use-city";

export function RestaurantListing({ search, intent }: { search: string; intent?: DiningIntent }) {
  const { city } = useCity({ detect: false });
  const [live, setLive] = useState(() => [...restaurants]);

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

  const visible = useMemo(
    () => searchRestaurants(restaurantsInCity(live, city), search),
    [live, city, search],
  );

  return (
    <section className="site-section bg-background text-foreground" data-header-skin="canvas">
      <div className="site-wrap">
        <p className="text-sm text-muted">{city}</p>
        <h1 className="site-h1 mt-3">All restaurants</h1>
        <p className="site-lead">
          {search
            ? `Showing matches for “${search}” in ${city}.`
            : `Restaurants in ${city}. Open a place, then choose table only, table with pre-order, or pickup.`}
        </p>
        {visible.length > 0 ? (
          <RestaurantGrid restaurants={visible} layout="grid" intent={intent} />
        ) : (
          <p className="site-card mt-8 p-6 text-sm leading-6 text-muted">
            {search
              ? `No restaurants in ${city} match “${search}”. Try another dish, cuisine, or city.`
              : `No restaurants listed in ${city} yet. Try Mumbai, Delhi, Bengaluru, or Pune.`}
          </p>
        )}
      </div>
    </section>
  );
}
