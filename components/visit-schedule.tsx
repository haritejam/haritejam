"use client";

import { availableSlots, formatSlotLabel, type DayOption } from "@/lib/visit-slots";

interface VisitScheduleProps {
  kind: "pickup" | "dine";
  days: DayOption[];
  visitDate: string;
  slot: string;
  now: Date;
  onDateChange: (value: string) => void;
  onSlotChange: (value: string) => void;
}

export function VisitSchedule({
  kind,
  days,
  visitDate,
  slot,
  now,
  onDateChange,
  onSlotChange,
}: VisitScheduleProps) {
  const slots = visitDate ? availableSlots(kind, visitDate, now) : [];
  const dayLabel = kind === "pickup" ? "Pickup day" : "Day";
  const timeLabel = kind === "pickup" ? "Pickup time" : "Time slot";

  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="text-sm text-muted">{dayLabel}</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {days.map((day) => {
            const selected = day.value === visitDate;
            return (
              <button
                key={day.value}
                type="button"
                suppressHydrationWarning
                onClick={() => onDateChange(day.value)}
                className={`shrink-0 rounded-[6px] border px-3 py-1.5 text-xs font-medium ${
                  selected
                    ? "border-accent bg-accent text-ink"
                    : "border-line text-muted hover:border-foreground/25 hover:text-foreground"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-sm text-muted">{timeLabel}</p>
        {slots.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No more slots today. Pick another day.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {slots.map((option) => {
              const selected = option === slot;
              return (
                <button
                  key={option}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => onSlotChange(option)}
                  className={`rounded-[6px] border px-3 py-1.5 text-xs font-medium ${
                    selected
                      ? "border-accent bg-accent text-ink"
                      : "border-line text-muted hover:border-foreground/25 hover:text-foreground"
                  }`}
                >
                  {formatSlotLabel(option)}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {kind === "pickup" ? <p className="text-xs text-muted">Collect at the counter at your chosen time.</p> : null}
    </div>
  );
}
