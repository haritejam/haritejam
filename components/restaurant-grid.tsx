import { RestaurantCard } from "@/components/restaurant-card";
import type { Restaurant } from "@/lib/restaurant-data";

interface RestaurantGridProps {
  restaurants: readonly Restaurant[];
  layout?: "carousel" | "grid";
}

export function RestaurantGrid({ restaurants, layout = "carousel" }: RestaurantGridProps) {
  if (layout === "grid") {
    return (
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
      {restaurants.map((restaurant) => (
        <div key={restaurant.id} className="w-[min(100%,320px)] shrink-0 snap-start sm:w-[300px]">
          <RestaurantCard restaurant={restaurant} />
        </div>
      ))}
    </div>
  );
}
