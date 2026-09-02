"use client";

import { RestaurantCard } from "@/components/restaurant-card";
import { Stagger, StaggerItem } from "@/components/motion-reveal";
import type { DiningIntent, Restaurant } from "@/lib/restaurant-data";

interface RestaurantGridProps {
  restaurants: readonly Restaurant[];
  layout?: "carousel" | "grid";
  intent?: DiningIntent;
}

export function RestaurantGrid({ restaurants, layout = "carousel", intent }: RestaurantGridProps) {
  if (layout === "grid") {
    return (
      <Stagger className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {restaurants.map((restaurant) => (
          <StaggerItem key={restaurant.id}>
            <RestaurantCard restaurant={restaurant} intent={intent} />
          </StaggerItem>
        ))}
      </Stagger>
    );
  }

  return (
    <Stagger className="mt-8 flex snap-x gap-6 overflow-x-auto pb-4 [scrollbar-width:thin]">
      {restaurants.map((restaurant) => (
        <StaggerItem key={restaurant.id} className="w-[min(100%,320px)] shrink-0 snap-start sm:w-[300px]">
          <RestaurantCard restaurant={restaurant} intent={intent} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
