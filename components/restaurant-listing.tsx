"use client";

import { useEffect, useState } from "react";
import { RestaurantGrid } from "@/components/restaurant-grid";
import type { DiningIntent } from "@/lib/restaurant-data";
import { PARTNER_EVENT, listLiveRestaurants } from "@/lib/partner-ops";
import { restaurants, searchRestaurants } from "@/lib/restaurant-data";

export function RestaurantListing({ search, intent }: { search: string; intent?: DiningIntent }) {
  const [visible, setVisible] = useState(() => searchRestaurants(restaurants, search));

  useEffect(() => {
    function sync() {
      setVisible(searchRestaurants(listLiveRestaurants(), search));
    }
    sync();
    window.addEventListener(PARTNER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PARTNER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [search]);

  return (
    <section className="site-section bg-background text-foreground" data-header-skin="canvas">
      <div className="site-wrap">
        <p className="text-sm text-muted">Mumbai</p>
        <h1 className="site-h1 mt-3">All restaurants</h1>
        <p className="site-lead">
          {search
            ? `Showing matches for “${search}”.`
            : "Open a restaurant, then choose how you want to dine: table only, table with pre-order, or pickup."}
        </p>
        {visible.length > 0 ? (
          <RestaurantGrid restaurants={visible} layout="grid" intent={intent} />
        ) : (
          <p className="mt-8 text-sm text-muted">No restaurants match “{search}”. Try another dish, cuisine, or name.</p>
        )}
      </div>
    </section>
  );
}
