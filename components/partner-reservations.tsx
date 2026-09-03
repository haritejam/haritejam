"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addReservation,
  RESERVATION_EVENT,
  reservationsForRestaurant,
  todayReservationsForRestaurant,
  updateReservation,
  type Reservation,
  type ReservationStatus,
} from "@/lib/reservations";
import { tablesForRestaurant, updateTable, type RestaurantTable } from "@/lib/tables";
import { readKitchenSession } from "@/lib/partner-ops";
import { PartnerShell } from "@/components/partner-shell";
import { formatSlotLabel, formatVisitDay, upcomingDays } from "@/lib/visit-slots";

const STATUS_STYLES: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-teal-100 text-teal-800",
  ARRIVING: "bg-blue-100 text-blue-800",
  SEATED: "bg-green-100 text-green-800",
  COMPLETED: "bg-[var(--muted)]/10 text-[var(--muted)]",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-red-100 text-red-800",
};

type Tab = "today" | "upcoming" | "all";

function ReservationCard({
  reservation,
  tables,
  onAction,
}: {
  reservation: Reservation;
  tables: RestaurantTable[];
  onAction: () => void;
}) {
  const table = tables.find((t) => t.id === reservation.tableId);

  function doUpdate(patch: Partial<Reservation>) {
    updateReservation(reservation.id, patch);
    if (patch.status === "SEATED" && reservation.tableId) {
      updateTable(reservation.tableId, { status: "OCCUPIED", currentReservationId: reservation.id });
    }
    onAction();
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="site-card p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {formatVisitDay(reservation.date)} · {formatSlotLabel(reservation.slot)}
            </p>
            {reservation.linkedOrderId && (
              <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]">
                Pre-order
              </span>
            )}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
            {reservation.guestName}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-sm text-[var(--muted)]">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {reservation.guestCount} {reservation.guestCount === 1 ? "guest" : "guests"}
            </span>
            {table && <span>{table.name}</span>}
            {!table && <span className="italic opacity-60">No table</span>}
          </div>
          {reservation.notes && (
            <p className="mt-2 text-xs text-[var(--muted)] italic">{reservation.notes}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${STATUS_STYLES[reservation.status]}`}
          >
            {reservation.status}
          </span>

          <div className="flex flex-wrap gap-2 mt-1">
            {reservation.status === "PENDING" && (
              <>
                <button
                  type="button"
                  onClick={() => doUpdate({ status: "CONFIRMED" })}
                  className="site-btn py-1.5 px-3 text-[12px]"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => doUpdate({ status: "CANCELLED" })}
                  className="site-card py-1.5 px-3 text-[12px] text-[var(--muted)] hover:bg-[var(--background)]"
                >
                  Cancel
                </button>
              </>
            )}
            {reservation.status === "CONFIRMED" && (
              <>
                <button
                  type="button"
                  onClick={() => doUpdate({ status: "ARRIVING" })}
                  className="site-btn py-1.5 px-3 text-[12px]"
                >
                  Mark arriving
                </button>
                <button
                  type="button"
                  onClick={() => doUpdate({ status: "NO_SHOW" })}
                  className="site-card py-1.5 px-3 text-[12px] text-[var(--muted)] hover:bg-[var(--background)]"
                >
                  No-show
                </button>
              </>
            )}
            {reservation.status === "ARRIVING" && (
              <button
                type="button"
                onClick={() => doUpdate({ status: "SEATED" })}
                className="site-btn py-1.5 px-3 text-[12px]"
              >
                Seat guest
              </button>
            )}
            {reservation.status === "SEATED" && (
              <button
                type="button"
                onClick={() => doUpdate({ status: "COMPLETED" })}
                className="site-btn py-1.5 px-3 text-[12px]"
              >
                Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function NewReservationForm({
  restaurantId,
  restaurantName,
  onDone,
}: {
  restaurantId: string;
  restaurantName: string;
  onDone: () => void;
}) {
  const days = useMemo(() => upcomingDays(new Date(), 14), []);
  const [date, setDate] = useState(days[0]?.value ?? "");
  const [slot, setSlot] = useState("18:00");
  const [guestName, setGuestName] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState("");

  const slots = useMemo(() => {
    const out: string[] = [];
    for (let h = 11; h <= 22; h++) {
      out.push(`${String(h).padStart(2, "0")}:00`);
      out.push(`${String(h).padStart(2, "0")}:30`);
    }
    return out;
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim() || !date || !slot) return;
    addReservation({
      restaurantId,
      restaurantName,
      guestName: guestName.trim(),
      guestCount,
      date,
      slot,
      status: "CONFIRMED",
      notes: notes.trim() || undefined,
    });
    onDone();
  }

  const inputClass =
    "mt-1 w-full rounded-[6px] border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="site-card p-5 mb-4"
    >
      <h3 className="font-semibold text-[var(--foreground)] mb-4">New reservation</h3>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-[var(--muted)]">
          Guest name
          <input
            className={inputClass}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="block text-xs font-medium text-[var(--muted)]">
          Guests
          <input
            type="number"
            min={1}
            max={20}
            className={inputClass}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
          />
        </label>
        <label className="block text-xs font-medium text-[var(--muted)]">
          Date
          <select
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          >
            {days.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-[var(--muted)]">
          Time
          <select
            className={inputClass}
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          >
            {slots.map((s) => (
              <option key={s} value={s}>
                {formatSlotLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-[var(--muted)] sm:col-span-2">
          Notes (optional)
          <input
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Dietary requirements, special occasion…"
          />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="site-btn py-2 px-4 text-sm">
            Add reservation
          </button>
          <button
            type="button"
            onClick={onDone}
            className="site-card py-2 px-4 text-sm text-[var(--muted)] hover:bg-[var(--background)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export function PartnerReservations() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tab, setTab] = useState<Tab>("today");
  const [showForm, setShowForm] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    const session = readKitchenSession();
    if (!session) return;
    setRestaurantId(session.restaurantId);
    setRestaurantName(session.restaurantName);
    setReservations(reservationsForRestaurant(session.restaurantId));
    setTables(tablesForRestaurant(session.restaurantId));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(RESERVATION_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(RESERVATION_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    if (tab === "today") return reservations.filter((r) => r.date === today);
    if (tab === "upcoming") return reservations.filter((r) => r.date > today);
    return reservations;
  }, [reservations, tab, today]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => `${a.date}T${a.slot}`.localeCompare(`${b.date}T${b.slot}`)),
    [filtered],
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "upcoming", label: "Upcoming" },
    { id: "all", label: "All" },
  ];

  return (
    <PartnerShell activeRoute="reservations">
      <div className="px-5 py-8 sm:px-8 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Front of house
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              Reservations
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="site-btn flex items-center gap-2 py-2 px-4 text-sm"
          >
            <Plus className="h-4 w-4" />
            New reservation
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <NewReservationForm
              restaurantId={restaurantId}
              restaurantName={restaurantName}
              onDone={() => {
                setShowForm(false);
                refresh();
              }}
            />
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-[var(--line)]">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {sorted.length === 0 ? (
          <div className="site-card p-8 text-center">
            <Calendar className="h-8 w-8 text-[var(--muted)]/40 mx-auto mb-2" />
            <p className="text-sm text-[var(--muted)]">No reservations for this period.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {sorted.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  tables={tables}
                  onAction={() => {
                    refresh();
                    setTick((t) => t + 1);
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PartnerShell>
  );
}
