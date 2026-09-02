import { RestaurantCard } from "@/components/restaurant-card";
import type { DiningIntent, Restaurant } from "@/lib/restaurant-data";

interface RestaurantGridProps {
  restaurants: readonly Restaurant[];
  layout?: "carousel" | "grid";
  intent?: DiningIntent;
}

export function RestaurantGrid({ restaurants, layout = "carousel", intent }: RestaurantGridProps) {
  if (layout === "grid") {
    return (
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} intent={intent} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 flex snap-x gap-6 overflow-x-auto pb-4 [scrollbar-width:thin]">
      {restaurants.map((restaurant) => (
        <div key={restaurant.id} className="w-[min(100%,320px)] shrink-0 snap-start sm:w-[300px]">
          <RestaurantCard restaurant={restaurant} intent={intent} />
        </div>
      ))}
    </div>
  );
}
