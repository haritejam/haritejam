import { RestaurantGrid } from "@/components/restaurant-grid";
import { parseDiningIntent, restaurants } from "@/lib/restaurant-data";

export const metadata = {
  title: "All restaurants | FlexiDine",
};

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const intent = parseDiningIntent(query.intent);

  return (
    <section className="site-section bg-background text-foreground" data-header-skin="canvas">
      <div className="site-wrap">
        <p className="text-sm text-muted">Mumbai</p>
        <h1 className="site-h1 mt-3">All restaurants</h1>
        <p className="site-lead">
          Open a restaurant, then choose how you want to dine: table only, table with pre-order, or pickup.
        </p>
        <RestaurantGrid restaurants={restaurants} layout="grid" intent={intent} />
      </div>
    </section>
  );
}
