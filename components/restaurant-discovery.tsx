"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CapabilityFilter, type CapabilityFilterValue } from "@/components/capability-filter";
import { RestaurantGrid } from "@/components/restaurant-grid";
import { Reveal } from "@/components/motion-reveal";
import { restaurants } from "@/lib/restaurant-data";

export function RestaurantDiscovery() {
  const [activeFilter, setActiveFilter] = useState<CapabilityFilterValue>("All");

  const visibleRestaurants = useMemo(
    () =>
      activeFilter === "All"
        ? restaurants
        : restaurants.filter((restaurant) => restaurant.capabilities.includes(activeFilter)),
    [activeFilter],
  );

  return (
    <section id="restaurants" className="site-section scroll-mt-24 bg-background" data-header-skin="canvas">
      <div className="site-wrap">
        <Reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="site-h2">Best restaurants near you</h2>
          <Link href="/restaurants" className="text-[0.9375rem] font-medium tracking-[-0.015em] text-accent hover:brightness-110">
            View all restaurants
          </Link>
        </Reveal>
        <CapabilityFilter value={activeFilter} onChange={setActiveFilter} />
        {visibleRestaurants.length > 0 ? (
          <RestaurantGrid restaurants={visibleRestaurants} />
        ) : (
          <p className="mt-8 text-sm text-muted">More restaurants are joining FlexiDine soon.</p>
        )}
      </div>
    </section>
  );
}
