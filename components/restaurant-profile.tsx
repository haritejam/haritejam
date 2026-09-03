"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { RestaurantExperience } from "@/components/restaurant-experience";
import { getLiveRestaurantById } from "@/lib/partner-ops";
import type { DiningIntent, Restaurant } from "@/lib/restaurant-data";

export function RestaurantProfile({
  id,
  catalog,
  intent,
}: {
  id: string;
  catalog?: Restaurant;
  intent?: DiningIntent;
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | undefined>(catalog);
  const [ready, setReady] = useState(Boolean(catalog));

  useEffect(() => {
    if (catalog) {
      setRestaurant(catalog);
      setReady(true);
      return;
    }
    setRestaurant(getLiveRestaurantById(id));
    setReady(true);
  }, [catalog, id]);

  if (!ready) {
    return null;
  }
  if (!restaurant) {
    notFound();
  }
  return <RestaurantExperience restaurant={restaurant} intent={intent} />;
}
