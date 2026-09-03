import { RestaurantProfile } from "@/components/restaurant-profile";
import { getRestaurantById, parseDiningIntent, restaurants } from "@/lib/restaurant-data";

export async function generateStaticParams() {
  return restaurants.map((restaurant) => ({ id: restaurant.id }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = getRestaurantById(id);
  return {
    title: restaurant ? `${restaurant.name} | FlexiDine` : "Restaurant | FlexiDine",
  };
}

export default async function RestaurantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <RestaurantProfile id={id} catalog={getRestaurantById(id)} intent={parseDiningIntent(query.intent)} />
  );
}
