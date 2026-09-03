"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Table2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  addTable,
  removeTable,
  seedDefaultTables,
  TABLE_EVENT,
  tablesForRestaurant,
  updateTable,
  type RestaurantTable,
  type TableStatus,
} from "@/lib/tables";
import { readKitchenSession } from "@/lib/partner-ops";
import { PartnerShell } from "@/components/partner-shell";

const STATUS_STYLES: Record<TableStatus, { chip: string; dot: string }> = {
  AVAILABLE: { chip: "bg-green-100 text-green-800", dot: "bg-green-500" },
  RESERVED: { chip: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  OCCUPIED: { chip: "bg-teal-100 text-teal-800", dot: "bg-[var(--accent)]" },
  CLEANING: { chip: "bg-[var(--muted)]/10 text-[var(--muted)]", dot: "bg-[var(--muted)]" },
  UNAVAILABLE: { chip: "bg-red-100 text-red-800", dot: "bg-red-500" },
};

function TableCard({
  table,
  onAction,
}: {
  table: RestaurantTable;
  onAction: () => void;
}) {
  const { chip, dot } = STATUS_STYLES[table.status];

  function setStatus(status: TableStatus) {
    updateTable(table.id, { status });
    onAction();
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.16 }}
      className="site-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[var(--foreground)]">{table.name}</h3>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
            {table.zone ? ` · ${table.zone}` : ""}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {table.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {table.status !== "AVAILABLE" && (
          <button
            type="button"
            onClick={() => setStatus("AVAILABLE")}
            className="site-card py-1.5 px-3 text-[12px] text-[var(--foreground)] hover:bg-[var(--background)]"
          >
            Mark available
          </button>
        )}
        {table.status !== "CLEANING" && table.status !== "UNAVAILABLE" && (
          <button
            type="button"
            onClick={() => setStatus("CLEANING")}
            className="site-card py-1.5 px-3 text-[12px] text-[var(--muted)] hover:bg-[var(--background)]"
          >
            Cleaning
          </button>
        )}
        {table.status !== "UNAVAILABLE" && (
          <button
            type="button"
            onClick={() => setStatus("UNAVAILABLE")}
            className="site-card py-1.5 px-3 text-[12px] text-[var(--muted)] hover:bg-[var(--background)]"
          >
            Unavailable
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (confirm(`Remove ${table.name}?`)) {
              removeTable(table.id);
              onAction();
            }
          }}
          className="py-1.5 px-3 text-[12px] text-red-500 hover:text-red-700 transition-colors"
        >
          Remove
        </button>
      </div>
    </motion.article>
  );
}

function AddTableForm({
  restaurantId,
  onDone,
}: {
  restaurantId: string;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [zone, setZone] = useState("");

  const inputClass =
    "mt-1 w-full rounded-[6px] border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addTable({
      restaurantId,
      name: name.trim(),
      capacity,
      status: "AVAILABLE",
      zone: zone.trim() || undefined,
    });
    onDone();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="site-card p-5 mb-4"
    >
      <h3 className="font-semibold text-[var(--foreground)] mb-4">Add table</h3>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-medium text-[var(--muted)]">
          Name
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Table 9"
            required
            autoFocus
          />
        </label>
        <label className="block text-xs font-medium text-[var(--muted)]">
          Capacity
          <input
            type="number"
            min={1}
            max={30}
            className={inputClass}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </label>
        <label className="block text-xs font-medium text-[var(--muted)]">
          Zone (optional)
          <input
            className={inputClass}
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="Indoor, Bar…"
          />
        </label>
        <div className="flex gap-2 sm:col-span-3">
          <button type="submit" className="site-btn py-2 px-4 text-sm">
            Add table
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

export function PartnerTables() {
  const [restaurantId, setRestaurantId] = useState("");
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(() => {
    const session = readKitchenSession();
    if (!session) return;
    setRestaurantId(session.restaurantId);
    seedDefaultTables(session.restaurantId);
    setTables(tablesForRestaurant(session.restaurantId));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(TABLE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TABLE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const grouped = {
    AVAILABLE: tables.filter((t) => t.status === "AVAILABLE"),
    RESERVED: tables.filter((t) => t.status === "RESERVED"),
    OCCUPIED: tables.filter((t) => t.status === "OCCUPIED"),
    CLEANING: tables.filter((t) => t.status === "CLEANING"),
    UNAVAILABLE: tables.filter((t) => t.status === "UNAVAILABLE"),
  };

  return (
    <PartnerShell activeRoute="tables">
      <div className="px-5 py-8 sm:px-8 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Floor plan
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              Tables
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="site-btn flex items-center gap-2 py-2 px-4 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add table
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <AddTableForm
              restaurantId={restaurantId}
              onDone={() => {
                setShowForm(false);
                refresh();
              }}
            />
          )}
        </AnimatePresence>

        {tables.length === 0 ? (
          <div className="site-card p-8 text-center">
            <Table2 className="h-8 w-8 text-[var(--muted)]/40 mx-auto mb-2" />
            <p className="text-sm text-[var(--muted)]">No tables yet. Add your first table above.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false}>
              {tables.map((t) => (
                <TableCard key={t.id} table={t} onAction={refresh} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PartnerShell>
  );
}
