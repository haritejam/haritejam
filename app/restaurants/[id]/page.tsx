import { RestaurantExperience } from "@/components/restaurant-experience";
import { getRestaurantById, parseDiningIntent, restaurants } from "@/lib/restaurant-data";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return restaurants.map((restaurant) => ({ id: restaurant.id }));
}

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
  const restaurant = getRestaurantById(id);

  if (!restaurant) {
    notFound();
  }

  return <RestaurantExperience restaurant={restaurant} intent={parseDiningIntent(query.intent)} />;
}
