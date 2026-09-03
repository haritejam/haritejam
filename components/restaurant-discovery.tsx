"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CapabilityFilter, type CapabilityFilterValue } from "@/components/capability-filter";
import { RestaurantGrid } from "@/components/restaurant-grid";
import { Reveal } from "@/components/motion-reveal";
import { PARTNER_EVENT, listLiveRestaurants } from "@/lib/partner-ops";
import { parseSearchQuery, restaurants, searchRestaurants } from "@/lib/restaurant-data";

export function RestaurantDiscovery() {
  const searchParams = useSearchParams();
  const query = parseSearchQuery(searchParams.get("q") ?? undefined);
  const [activeFilter, setActiveFilter] = useState<CapabilityFilterValue>("All");
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

  const visibleRestaurants = useMemo(() => {
    const matched = searchRestaurants(live, query);
    if (activeFilter === "All") {
      return matched;
    }
    return matched.filter((restaurant) => restaurant.capabilities.includes(activeFilter));
  }, [activeFilter, live, query]);

  return (
    <section id="restaurants" className="site-section scroll-mt-24 bg-background" data-header-skin="canvas">
      <div className="site-wrap">
        <Reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="site-h2">Best restaurants near you</h2>
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
          <p className="mt-8 text-sm text-muted">
            {query ? `No restaurants match “${query}”. Try another dish, cuisine, or name.` : "More restaurants are joining FlexiDine soon."}
          </p>
        )}
      </div>
    </section>
  );
}
