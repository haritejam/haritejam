import { RestaurantListing } from "@/components/restaurant-listing";
import { parseDiningIntent, parseSearchQuery } from "@/lib/restaurant-data";

export const metadata = {
  title: "All restaurants | FlexiDine",
};

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  return <RestaurantListing search={parseSearchQuery(query.q)} intent={parseDiningIntent(query.intent)} />;
}
