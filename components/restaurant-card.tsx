import Image from "next/image";
import Link from "next/link";
import { BagIcon, StarIcon, SwitchIcon, TableIcon } from "@/components/icons";
import type { DiningIntent, Restaurant } from "@/lib/restaurant-data";

const highlights = [
  { label: "Dine in", icon: TableIcon },
  { label: "Pickup", icon: BagIcon },
  { label: "Flex Switch", icon: SwitchIcon },
];

interface RestaurantCardProps {
  restaurant: Restaurant;
  intent?: DiningIntent;
}

export function RestaurantCard({ restaurant, intent }: RestaurantCardProps) {
  const href = intent ? `/restaurants/${restaurant.id}?intent=${intent}` : `/restaurants/${restaurant.id}`;

  return (
    <article className="site-card flex w-full min-w-0 flex-col overflow-hidden transition hover:border-accent/50">
      <Link href={href} className="flex h-full flex-col">
        <div className="relative aspect-[1.35] overflow-hidden bg-background">
          <Image src={restaurant.image} alt={restaurant.imageAlt} fill sizes="(max-width: 768px) 100vw, 320px" className="object-cover" />
          <span className="absolute left-3 top-3 rounded-[6px] bg-accent px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">
            {restaurant.offer}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.025em] text-foreground">{restaurant.name}</h3>
              <p className="mt-1 text-xs text-muted">
                {restaurant.cuisine} · {restaurant.neighborhood}
              </p>
            </div>
            <p className="flex items-center gap-1 text-sm font-medium text-foreground">
              <StarIcon className="h-3.5 w-3.5 fill-accent text-accent" />
              {restaurant.rating.toFixed(1)}
            </p>
          </div>
          <p className="mt-2 text-xs text-muted">
            {restaurant.eta} · {restaurant.distance}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-[6px] border border-line px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted"
                >
                  <Icon className="h-3.5 w-3.5 text-accent" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>
      </Link>
    </article>
  );
}
