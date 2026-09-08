"use client";

import { useEffect, useState } from "react";
import {
  allowedSwitchTargets,
  evaluateTimeline,
  flexiSwitchClosedReason,
  requestFlexiSwitch,
  switchLabel,
  type SwitchTarget,
} from "@/lib/flexiswitch";
import { fulfillmentOf, type Booking } from "@/lib/bookings";
import { quoteBillForBooking, packingDeltaRupees } from "@/lib/pricing";
import { getSettings } from "@/lib/restaurant-settings";

function switchHint(delta: number) {
  if (delta > 0) {
    return `Packing ₹${delta.toLocaleString("en-IN")} is added. The original food discount stays — the new service percent is not applied.`;
  }
  if (delta < 0) {
    return "Packing is removed. The original food discount stays.";
  }
  return "Packing is unchanged. The original food discount stays — the new service percent is not applied.";
}

export function DinerFlexiSwitch({ booking }: { booking: Booking }) {
  const settings = getSettings(booking.restaurantId);
  const from = fulfillmentOf(booking);
  const closed = flexiSwitchClosedReason(booking);
  const targets = allowedSwitchTargets(booking, settings);
  const [to, setTo] = useState<SwitchTarget | "">(targets[0] ?? "");
  const [address, setAddress] = useState(booking.deliveryAddress ?? "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setTo(targets[0] ?? "");
    setMessage("");
  }, [from, booking.id, booking.kitchenStatus]);

  if (booking.kitchenStatus === "rejected") return null;

  if (fulfillmentOf(booking) === "DINE_IN" && booking.items.length === 0) {
    return null;
  }

  if (closed) {
    return (
      <div className="border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">FlexiSwitch</p>
        <p className="mt-2 text-sm leading-6 text-muted">{closed}</p>
      </div>
    );
  }

  if (!settings.allowFlexiSwitch || targets.length === 0) return null;

  const previewBill = to ? quoteBillForBooking(booking, to, settings) : null;
  const preview = to ? evaluateTimeline(booking, to, settings) : { success: true };

  function submit() {
    if (!to) return;
    const result = requestFlexiSwitch(booking.id, to, { deliveryAddress: address });
    setMessage(result.reason ?? `Switched to ${switchLabel(to)}.`);
  }

  return (
    <div className="border-t border-line pt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">FlexiSwitch</p>
      <p className="mt-2 text-sm leading-6 text-muted">
        One FlexiSwitch on this order: dine-in, pickup, or delivery. After that the booking is final. The first food discount stays; only packing can change.
      </p>
      <p className="mt-2 text-xs text-muted">Now: {switchLabel(from)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {targets.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTo(option)}
            className={`rounded-[6px] border px-3 py-1.5 text-xs font-medium ${
              to === option ? "border-accent bg-accent text-ink" : "border-line text-muted hover:text-foreground"
            }`}
          >
            Switch to {switchLabel(option)}
          </button>
        ))}
      </div>
      {to === "DELIVERY" ? (
        <label className="mt-3 block text-sm text-muted">
          Delivery address
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="mt-1 w-full rounded-[6px] border border-line bg-background px-3 py-2 text-foreground"
            placeholder="Building, street, area"
          />
        </label>
      ) : null}
      {previewBill && to ? (
        <p className="mt-2 text-sm text-foreground">
          {switchHint(packingDeltaRupees(booking, to, settings))} New total ₹
          {previewBill.totalRupees.toLocaleString("en-IN")}.
        </p>
      ) : null}
      {!preview.success ? <p className="mt-2 text-sm text-red-800">{preview.reason}</p> : null}
      <button
        type="button"
        className="site-btn mt-4"
        onClick={submit}
        disabled={!to || !preview.success || (to === "DELIVERY" && !address.trim())}
      >
        Switch now
      </button>
      {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
