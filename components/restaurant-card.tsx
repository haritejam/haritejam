import Image from "next/image";
import Link from "next/link";
import { BagIcon, StarIcon, SwitchIcon, TableIcon } from "@/components/icons";
import type { Restaurant } from "@/lib/restaurant-data";

const highlights = [
  { label: "Dine in", icon: TableIcon, className: "border-[#d4af7a]/50 bg-[#d4af7a]/15 text-[#e6c49a]" },
  { label: "Pickup", icon: BagIcon, className: "border-[#7dba8d]/45 bg-[#7dba8d]/12 text-[#b7e0c0]" },
  { label: "Flex Switch", icon: SwitchIcon, className: "border-[#b39bdb]/45 bg-[#b39bdb]/12 text-[#d7c8f3]" },
];

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const href = `/restaurants/${restaurant.id}`;

  return (
    <article className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1c1814] transition hover:border-[#d4af7a]/50">
      <Link href={href} className="flex h-full flex-col">
        <div className="relative aspect-[1.35] overflow-hidden bg-[#2a2e36]">
          <Image src={restaurant.image} alt={restaurant.imageAlt} fill sizes="(max-width: 768px) 100vw, 320px" className="object-cover" />
          <span className="absolute left-3 top-3 rounded-md bg-[#d4a574] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1a140c]">
            {restaurant.offer}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{restaurant.name}</h3>
              <p className="mt-1 text-xs text-white/55">
                {restaurant.cuisine} · {restaurant.neighborhood}
              </p>
            </div>
            <p className="flex items-center gap-1 text-sm font-medium text-white">
              <StarIcon className="h-3.5 w-3.5 fill-[#d4a574] text-[#d4a574]" />
              {restaurant.rating.toFixed(1)}
            </p>
          </div>
          <p className="mt-2 text-xs text-white/50">
            {restaurant.eta} · {restaurant.distance}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${item.className}`}
                >
                  <Icon className="h-3.5 w-3.5" />
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
