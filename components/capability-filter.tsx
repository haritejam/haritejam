"use client";

import type { Capability } from "@/lib/restaurant-data";

export type CapabilityFilterValue = "All" | Capability;

const filters: readonly { value: CapabilityFilterValue; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Prebook", label: "Dine-in" },
  { value: "Pre-Order", label: "Pre-order" },
  { value: "Pickup", label: "Pickup" },
];

interface CapabilityFilterProps {
  value: CapabilityFilterValue;
  onChange: (value: CapabilityFilterValue) => void;
}

export function CapabilityFilter({ value, onChange }: CapabilityFilterProps) {
  return (
    <div className="mt-6 overflow-x-auto" aria-label="Filter restaurants by service">
      <div className="flex w-max items-center gap-2">
        {filters.map((filter) => {
          const isActive = value === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onChange(filter.value)}
              aria-pressed={isActive}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-[#d4a574] bg-[#d4a574] text-[#1a140c]"
                  : "border-white/15 bg-transparent text-white/70 hover:border-white/35 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
