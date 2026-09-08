"use client";

import { useEffect, useState } from "react";
import { readKitchenSession } from "@/lib/partner-ops";
import { getSettings, writeSettings, type RestaurantSettings } from "@/lib/restaurant-settings";
import { PartnerShell } from "@/components/partner-shell";

export function PartnerSettings() {
  const [restaurantId, setRestaurantId] = useState("");
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const session = readKitchenSession();
    if (!session) return;
    setRestaurantId(session.restaurantId);
    setSettings(getSettings(session.restaurantId));
  }, []);

  if (!settings) return null;

  function update<K extends keyof RestaurantSettings>(key: K, value: RestaurantSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (settings) {
      writeSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  const labelClass = "block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] mb-1";
  const inputClass =
    "w-full rounded-[6px] border border-[var(--line)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]";

  function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 py-5 border-b border-[var(--line)] last:border-0">
        <div className="sm:max-w-[50%]">
          <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-[var(--muted)]">{hint}</p>}
        </div>
        <div className="sm:w-48">{children}</div>
      </div>
    );
  }

  function Toggle({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-[var(--accent)]" : "bg-[var(--muted)]/30"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    );
  }

  return (
    <PartnerShell activeRoute="settings">
      <div className="px-5 py-8 sm:px-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Configuration
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Settings
          </h1>
        </div>

        <form onSubmit={handleSave}>
          <div className="site-card p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)] mb-1">Timing</h2>
            <p className="text-xs text-[var(--muted)] mb-4">Controls how kitchen scheduling and cutoffs work.</p>

            <Row label="ASAP prep time" hint="How long a pickup-ASAP order takes to prepare.">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={120}
                  className={inputClass}
                  value={settings.asapPrepMinutes}
                  onChange={(e) => update("asapPrepMinutes", Number(e.target.value))}
                />
                <span className="text-xs text-[var(--muted)] shrink-0">min</span>
              </div>
            </Row>

            <Row label="Reservation duration" hint="Default block length for a reservation.">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={30}
                  max={300}
                  className={inputClass}
                  value={settings.reservationDurationMinutes}
                  onChange={(e) => update("reservationDurationMinutes", Number(e.target.value))}
                />
                <span className="text-xs text-[var(--muted)] shrink-0">min</span>
              </div>
            </Row>

            <Row label="Pre-order cutoff" hint="Minimum minutes before a scheduled order to still accept it.">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={60}
                  className={inputClass}
                  value={settings.preOrderCutoffMinutes}
                  onChange={(e) => update("preOrderCutoffMinutes", Number(e.target.value))}
                />
                <span className="text-xs text-[var(--muted)] shrink-0">min</span>
              </div>
            </Row>

            <Row label="Kitchen lead time" hint="Dine-in only: minutes before seating that a confirmed pre-order leaves Scheduled and enters the kitchen. Pickup and delivery use their own prep times.">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={120}
                  className={inputClass}
                  value={settings.preparationLeadTimeMinutes}
                  onChange={(e) => update("preparationLeadTimeMinutes", Number(e.target.value))}
                />
                <span className="text-xs text-[var(--muted)] shrink-0">min</span>
              </div>
            </Row>

            <Row label="Preparation buffer" hint="Extra time added between kitchen start and estimated ready.">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={30}
                  className={inputClass}
                  value={settings.prepBufferMinutes}
                  onChange={(e) => update("prepBufferMinutes", Number(e.target.value))}
                />
                <span className="text-xs text-[var(--muted)] shrink-0">min</span>
              </div>
            </Row>
          </div>

          <div className="site-card p-6 mt-4">
            <h2 className="text-base font-semibold text-[var(--foreground)] mb-1">Operations</h2>
            <p className="text-xs text-[var(--muted)] mb-4">Approval and FlexiSwitch controls.</p>

            <Row label="Require approval" hint="Orders wait for restaurant approval before going to kitchen.">
              <Toggle
                value={settings.requireApproval}
                onChange={(v) => update("requireApproval", v)}
              />
            </Row>

            <Row label="FlexiSwitch" hint="Diners may change fulfillment once per booking, and only until the kitchen has the ticket. Table holds get FlexiSwitch after they pre-order.">
              <Toggle
                value={settings.allowFlexiSwitch}
                onChange={(v) => update("allowFlexiSwitch", v)}
              />
            </Row>

            <Row label="Pickup → Dine-in" hint="Allow pickup orders to switch to dine-in when a table is free.">
              <Toggle
                value={settings.allowPickupToDineIn}
                onChange={(v) => update("allowPickupToDineIn", v)}
              />
            </Row>

            <Row label="Pickup → Delivery" hint="Allow one FlexiSwitch between pickup and delivery before the kitchen has the ticket.">
              <Toggle
                value={settings.allowPickupDeliverySwitch}
                onChange={(v) => update("allowPickupDeliverySwitch", v)}
              />
            </Row>

            <Row label="Delivery" hint="Accept delivery as a first-class fulfillment.">
              <Toggle value={settings.allowDelivery} onChange={(v) => update("allowDelivery", v)} />
            </Row>

            <Row label="Delivery prep" hint="Kitchen minutes used when the ticket is delivery.">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={90}
                  className={inputClass}
                  value={settings.deliveryPrepMinutes}
                  onChange={(e) => update("deliveryPrepMinutes", Number(e.target.value))}
                />
                <span className="text-xs text-[var(--muted)] shrink-0">min</span>
              </div>
            </Row>

            <Row label="Food-hold limit" hint="How long READY food may sit before FOH treats it as held. FlexiSwitch is already closed once the kitchen has the ticket.">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={45}
                  className={inputClass}
                  value={settings.foodHoldMinutes}
                  onChange={(e) => update("foodHoldMinutes", Number(e.target.value))}
                />
                <span className="text-xs text-[var(--muted)] shrink-0">min</span>
              </div>
            </Row>

            <Row label="Rider window" hint="Added to kitchen ready time when converting to delivery.">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={60}
                  className={inputClass}
                  value={settings.riderMinutes}
                  onChange={(e) => update("riderMinutes", Number(e.target.value))}
                />
                <span className="text-xs text-[var(--muted)] shrink-0">min</span>
              </div>
            </Row>

            <Row
              label="Dine-in discount"
              hint="Percent off the menu when the booking starts as dine-in pre-order. FlexiSwitch keeps this food total and does not recut it."
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={90}
                  className={inputClass}
                  value={settings.dineInDiscountPercent}
                  onChange={(e) => update("dineInDiscountPercent", Number(e.target.value))}
                />
                <span className="text-xs text-[var(--muted)] shrink-0">%</span>
              </div>
            </Row>

            <Row
              label="Pickup discount"
              hint="Percent off the menu when the booking starts as pickup. FlexiSwitch to dine-in or delivery does not apply another percent."
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={90}
                  className={inputClass}
                  value={settings.pickupDiscountPercent}
                  onChange={(e) => update("pickupDiscountPercent", Number(e.target.value))}
                />
                <span className="text-xs text-[var(--muted)] shrink-0">%</span>
              </div>
            </Row>

            <Row
              label="Delivery discount"
              hint="Percent off the menu when the booking starts as delivery. FlexiSwitch does not recut the food total."
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={90}
                  className={inputClass}
                  value={settings.deliveryDiscountPercent}
                  onChange={(e) => update("deliveryDiscountPercent", Number(e.target.value))}
                />
                <span className="text-xs text-[var(--muted)] shrink-0">%</span>
              </div>
            </Row>

            <Row
              label="Packing charge"
              hint="On pickup and delivery. FlexiSwitch dine-in → pickup or delivery adds it. Pickup ↔ delivery keeps it. Back to dine-in removes it."
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted)] shrink-0">₹</span>
                <input
                  type="number"
                  min={0}
                  max={500}
                  className={inputClass}
                  value={settings.packingChargeRupees}
                  onChange={(e) => update("packingChargeRupees", Number(e.target.value))}
                />
              </div>
            </Row>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <button type="submit" className="site-btn py-2.5 px-6">
              Save settings
            </button>
            {saved && (
              <p className="text-sm text-[var(--accent)] font-medium">Saved ✓</p>
            )}
          </div>
        </form>
      </div>
    </PartnerShell>
  );
}
