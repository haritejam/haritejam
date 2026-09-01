import { RestaurantGrid } from "@/components/restaurant-grid";
import { restaurants } from "@/lib/restaurant-data";

export const metadata = {
  title: "All restaurants | FlexiDine",
};

export default function RestaurantsPage() {
  return (
    <section className="bg-[#14110e] px-5 py-14 text-[#f4efe6] sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d4af7a]">Mumbai</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">All restaurants</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
          Open a restaurant, then choose how you want to dine: table only, table with pre-order, or pickup.
        </p>
        <RestaurantGrid restaurants={restaurants} layout="grid" />
      </div>
    </section>
  );
}
