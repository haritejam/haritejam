import { restaurants } from "@/lib/restaurant-data";

export type SlipItem = { name: string; quantity: number; unitPriceRupees?: number; unitPrice?: number };

export function lineUnitPrice(item: SlipItem, restaurantId?: string) {
  if (item.unitPriceRupees && item.unitPriceRupees > 0) return item.unitPriceRupees;
  if (item.unitPrice && item.unitPrice > 0) return item.unitPrice;
  if (!restaurantId) return 0;
  const menu = restaurants.find((row) => row.id === restaurantId)?.menuItems;
  return menu?.find((row) => row.name === item.name)?.priceRupees ?? 0;
}

export function OrderSlipItems({
  items,
  restaurantId,
}: {
  items: SlipItem[];
  restaurantId?: string;
}) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1.5 rounded-[6px] bg-[var(--accent)]/10 px-3 py-2.5">
      {items.map((item) => {
        const unit = lineUnitPrice(item, restaurantId);
        const line = unit * item.quantity;
        return (
          <li
            key={`${item.name}-${item.quantity}`}
            className="flex items-baseline justify-between gap-3 text-[15px] leading-snug text-[var(--accent)]"
          >
            <span className="min-w-0">
              <span className="shrink-0 font-bold tabular-nums">{item.quantity}×</span>{" "}
              <span className="font-semibold tracking-[-0.01em]">{item.name}</span>
            </span>
            <span className="shrink-0 tabular-nums">
              {unit > 0 ? `₹${line.toLocaleString("en-IN")}` : "—"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
