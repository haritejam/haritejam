"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CapabilityFilter, type CapabilityFilterValue } from "@/components/capability-filter";
import { RestaurantGrid } from "@/components/restaurant-grid";
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
    <section id="restaurants" className="restaurants-stage relative scroll-mt-24 overflow-hidden bg-[#14110e] py-16 sm:py-20">
      <div className="restaurants-stage-glow" aria-hidden="true" />
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Best restaurants near you</h2>
          <Link href="/restaurants" className="text-sm font-medium text-[#d4a574] hover:text-[#e0b686]">
            View all restaurants
          </Link>
        </div>
        <CapabilityFilter value={activeFilter} onChange={setActiveFilter} />
        {visibleRestaurants.length > 0 ? (
          <RestaurantGrid restaurants={visibleRestaurants} />
        ) : (
          <p className="mt-8 text-sm text-white/55">More restaurants are joining FlexiDine soon.</p>
        )}
      </div>
    </section>
  );
}
