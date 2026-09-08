"use client";

import { availableSlots, formatSlotLabel, isAsapOffered, isAsapSlot, type DayOption } from "@/lib/visit-slots";

interface VisitScheduleProps {
  kind: "pickup" | "dine" | "delivery";
  days: DayOption[];
  visitDate: string;
  slot: string;
  now: Date;
  asapMinutes?: number;
  onDateChange: (value: string) => void;
  onSlotChange: (value: string) => void;
}

export function VisitSchedule({
  kind,
  days,
  visitDate,
  slot,
  now,
  asapMinutes = 30,
  onDateChange,
  onSlotChange,
}: VisitScheduleProps) {
  const slots = visitDate ? availableSlots(kind === "dine" ? "dine" : "pickup", visitDate, now) : [];
  const dayLabel = kind === "dine" ? "Day" : kind === "delivery" ? "Delivery day" : "Pickup day";
  const timeLabel = kind === "dine" ? "Time slot" : kind === "delivery" ? "Delivery time" : "Pickup time";
  const asapOpen = isAsapOffered(now);
  const asap = (kind === "pickup" || kind === "delivery") && isAsapSlot(slot) && asapOpen;
  const scheduled = (kind === "pickup" || kind === "delivery") && !asap;

  return (
    <div className="mt-4 space-y-4">
      {kind === "pickup" || kind === "delivery" ? (
        <div>
          <p className="text-sm text-muted">When do you want it?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!asapOpen}
              onClick={() => {
                if (asapOpen) onSlotChange("asap");
              }}
              className={`rounded-[6px] border px-3 py-3 text-left ${
                !asapOpen
                  ? "cursor-not-allowed border-line bg-[var(--background)] opacity-55"
                  : asap
                    ? "border-accent bg-accent/12"
                    : "border-line text-muted hover:border-accent/40 hover:text-foreground"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">{kind === "delivery" ? "Deliver ASAP" : "Pick ASAP"}</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {asapOpen
                  ? `Ready in about ${asapMinutes} min${kind === "delivery" ? ", then a rider window." : ". Collect when the restaurant says it’s packed."}`
                  : "Unavailable after restaurant hours (noon–10:00 PM)."}
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                if (isAsapSlot(slot)) {
                  onSlotChange("");
                }
              }}
              className={`rounded-[6px] border px-3 py-3 text-left ${
                scheduled
                  ? "border-accent bg-accent/12"
                  : "border-line text-muted hover:border-accent/40 hover:text-foreground"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">Schedule</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {kind === "delivery" ? "Pick a day and a drop-off window." : "Pick a day and a counter time."}
              </p>
            </button>
          </div>
        </div>
      ) : null}

      {kind === "dine" || scheduled ? (
        <>
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
        </>
      ) : null}

      {kind === "pickup" || kind === "delivery" ? (
        <p className="text-xs text-muted">
          {asap
            ? kind === "delivery"
              ? `The restaurant estimates food in about ${asapMinutes} minutes after they accept, then dispatch.`
              : `The restaurant estimates pickup in about ${asapMinutes} minutes after they accept the order.`
            : kind === "delivery"
              ? "Food leaves after the kitchen hits your chosen window."
              : "Collect at the counter at your chosen time."}
        </p>
      ) : null}
    </div>
  );
}
