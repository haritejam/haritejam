"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CapabilityFilter, type CapabilityFilterValue } from "@/components/capability-filter";
import { RestaurantGrid } from "@/components/restaurant-grid";
import { Reveal } from "@/components/motion-reveal";
import { PARTNER_EVENT, listLiveRestaurants } from "@/lib/partner-ops";
import { parseSearchQuery, restaurants, restaurantsInCity, searchRestaurants } from "@/lib/restaurant-data";
import { CITY_EVENT } from "@/lib/location";
import { useCity } from "@/lib/use-city";

export function RestaurantDiscovery() {
  const searchParams = useSearchParams();
  const query = parseSearchQuery(searchParams.get("q") ?? undefined);
  const [activeFilter, setActiveFilter] = useState<CapabilityFilterValue>("All");
  const [live, setLive] = useState(() => [...restaurants]);
  const { city } = useCity({ detect: false });

  useEffect(() => {
    function sync() {
      setLive(listLiveRestaurants());
    }
    sync();
    window.addEventListener(PARTNER_EVENT, sync);
    window.addEventListener(CITY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PARTNER_EVENT, sync);
      window.removeEventListener(CITY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const visibleRestaurants = useMemo(() => {
    const matched = searchRestaurants(restaurantsInCity(live, city), query);
    if (activeFilter === "All") {
      return matched;
    }
    return matched.filter((restaurant) => restaurant.capabilities.includes(activeFilter));
  }, [activeFilter, live, query, city]);

  return (
    <section id="restaurants" className="site-section scroll-mt-24 bg-background" data-header-skin="canvas">
      <div className="site-wrap">
        <Reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="site-h2">Best restaurants near you</h2>
            <p className="mt-2 text-sm text-muted">Showing places in {city}.</p>
            {query ? (
              <p className="mt-3 text-sm text-muted">Showing matches for “{query}”.</p>
            ) : null}
          </div>
          <Link href="/restaurants" className="text-[0.9375rem] font-medium tracking-[-0.015em] text-accent hover:brightness-110">
            View all restaurants
          </Link>
        </Reveal>
        <CapabilityFilter value={activeFilter} onChange={setActiveFilter} />
        {visibleRestaurants.length > 0 ? (
          <RestaurantGrid restaurants={visibleRestaurants} />
        ) : (
          <p className="site-card mt-8 p-6 text-sm leading-6 text-muted">
            {query
              ? `No restaurants in ${city} match “${query}”. Try another dish, cuisine, or city.`
              : `No restaurants listed in ${city} yet. Try Mumbai, Delhi, Bengaluru, or Pune.`}
          </p>
        )}
      </div>
    </section>
  );
}
