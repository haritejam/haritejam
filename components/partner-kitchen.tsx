"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PartnerShell } from "@/components/partner-shell";
import {
  getKitchenOrderRepository,
  type KitchenBoardStatus,
  type KitchenOrder,
} from "@/lib/kitchen-order-repository";
import { KITCHEN_EVENT } from "@/lib/kitchen";
import { BOOKING_EVENT } from "@/lib/bookings";
import { ORDER_EVENT } from "@/lib/orders";
import { PARTNER_EVENT, readKitchenSession, type KitchenAccount } from "@/lib/partner-ops";
import { getDelayStatus, formatRelativeTime } from "@/lib/scheduling";

const DELAY_COLOR = {
  ON_TIME: "",
  DUE_SOON: "border-amber-300",
  LATE: "border-red-400",
};

const TYPE_BADGE: Record<string, string> = {
  PICKUP_ASAP: "PICKUP · ASAP",
  PICKUP_SCHEDULED: "PICKUP · SCHED",
  PREORDER_DINE_IN: "PRE-ORDER",
  DINE_IN: "DINE-IN",
  RESERVATION_ONLY: "RESERVATION",
};

function nextStatus(ticket: KitchenOrder): KitchenBoardStatus | null {
  if (ticket.status === "NEW") return "PREPARING";
  if (ticket.status === "PREPARING") return "READY";
  if (ticket.status === "READY") return "COMPLETED";
  return null;
}

function actionLabel(ticket: KitchenOrder): string | null {
  if (ticket.status === "NEW") return "Start Preparing";
  if (ticket.status === "PREPARING") return "Mark Ready";
  if (ticket.status === "READY") {
    return ticket.fulfillmentType === "PICKUP" ? "Handed Over" : "Served";
  }
  return null;
}

function TicketCard({
  ticket,
  restaurantId,
  onChanged,
}: {
  ticket: KitchenOrder;
  restaurantId: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const delayStatus = getDelayStatus(ticket.estimatedReadyAt, ticket.status);
  const timeTo = formatRelativeTime(ticket.estimatedReadyAt);
  const typeLabel = TYPE_BADGE[ticket.orderType] ?? ticket.orderType.replace(/_/g, " ");
  const label = actionLabel(ticket);
  const target = nextStatus(ticket);

  async function onAdvance() {
    if (!target || busy) return;
    setBusy(true);
    const result = getKitchenOrderRepository().transition(ticket.id, restaurantId, target);
    if (result.ok) {
      onChanged();
    }
    window.setTimeout(() => setBusy(false), 280);
  }

  return (
    <motion.article
      layout
      layoutId={ticket.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
      className={`rounded-[10px] border bg-[var(--surface)] p-4 flex flex-col gap-3 ${DELAY_COLOR[delayStatus] || "border-[var(--line)]"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
              {typeLabel}
            </span>
            {ticket.flexiSwitched && (
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] bg-[var(--accent)]/10 text-[var(--accent)] rounded px-1.5 py-0.5">
                FlexiSwitched
              </span>
            )}
          </div>
          <p className="mt-0.5 font-semibold text-[var(--foreground)]">{ticket.guestName}</p>
          <p className="text-[11px] text-[var(--muted)]">{ticket.orderId}</p>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`text-sm font-semibold tabular-nums ${
              delayStatus === "LATE"
                ? "text-red-600"
                : delayStatus === "DUE_SOON"
                  ? "text-amber-600"
                  : "text-[var(--foreground)]"
            }`}
          >
            {timeTo}
          </p>
          <p className="text-[10px] text-[var(--muted)]">
            {new Date(ticket.estimatedReadyAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {ticket.items.length > 0 && (
        <ul className="space-y-0.5 border-t border-[var(--line)] pt-3">
          {ticket.items.map((item) => (
            <li key={item.menuItemId} className="text-xs text-[var(--muted)]">
              {item.quantity} × {item.name}
            </li>
          ))}
        </ul>
      )}

      {ticket.tableId && (
        <p className="text-xs font-medium text-[var(--foreground)]">Table: {ticket.tableId}</p>
      )}

      {label && (
        <button
          type="button"
          onClick={onAdvance}
          disabled={busy}
          className="site-btn w-full py-2 text-sm mt-1 disabled:opacity-50 disabled:pointer-events-none"
        >
          {busy ? "Updating…" : label}
        </button>
      )}
    </motion.article>
  );
}

function KdsColumn({
  title,
  count,
  color,
  emptyLabel,
  children,
}: {
  title: string;
  count: number;
  color: string;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-w-[220px] flex-1">
      <div className={`flex items-center justify-between px-1 pb-2 mb-3 border-b-2 ${color}`}>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
          {title}
        </h2>
        <span className="text-[11px] font-semibold tabular-nums text-[var(--muted)]">{count}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        <AnimatePresence initial={false} mode="popLayout">
          {count === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-[var(--muted)] px-1 py-3"
            >
              {emptyLabel}
            </motion.p>
          ) : (
            children
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function PartnerKitchen() {
  const [account, setAccount] = useState<KitchenAccount | null>(null);
  const [tickets, setTickets] = useState<KitchenOrder[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    const session = readKitchenSession();
    if (!session) return;
    setAccount(session);
    setTickets(getKitchenOrderRepository().listActive(session.restaurantId));
  }, []);

  useEffect(() => {
    refresh();
    const events = [BOOKING_EVENT, ORDER_EVENT, KITCHEN_EVENT, PARTNER_EVENT];
    events.forEach((event) => window.addEventListener(event, refresh));
    window.addEventListener("storage", refresh);
    intervalRef.current = setInterval(refresh, 15_000);
    return () => {
      events.forEach((event) => window.removeEventListener(event, refresh));
      window.removeEventListener("storage", refresh);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const columns = useMemo(() => {
    const sort = (list: KitchenOrder[]) =>
      [...list].sort(
        (a, b) => new Date(a.estimatedReadyAt).getTime() - new Date(b.estimatedReadyAt).getTime(),
      );
    return {
      upcoming: sort(tickets.filter((ticket) => ticket.status === "UPCOMING")),
      next: sort(tickets.filter((ticket) => ticket.status === "NEW")),
      preparing: sort(tickets.filter((ticket) => ticket.status === "PREPARING")),
      ready: sort(tickets.filter((ticket) => ticket.status === "READY")),
    };
  }, [tickets]);

  if (!account) return null;

  const kds = (
    <div
      className={`${
        fullscreen ? "fixed inset-0 z-50 bg-[var(--background)] overflow-auto" : "flex-1"
      } flex flex-col`}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] bg-[var(--surface)]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Kitchen · {account.restaurantId}
          </p>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{account.restaurantName}</h1>
        </div>
        <button
          type="button"
          onClick={() => setFullscreen((value) => !value)}
          className="site-card p-2 hover:bg-[var(--background)] transition-colors"
          aria-label={fullscreen ? "Exit full screen" : "Full screen"}
        >
          {fullscreen ? (
            <Minimize2 className="h-4 w-4 text-[var(--muted)]" />
          ) : (
            <Maximize2 className="h-4 w-4 text-[var(--muted)]" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-5 min-h-full min-w-[720px]">
          <KdsColumn
            title="Upcoming"
            count={columns.upcoming.length}
            color="border-[var(--muted)]/30"
            emptyLabel="No upcoming scheduled orders."
          >
            {columns.upcoming.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                restaurantId={account.restaurantId}
                onChanged={refresh}
              />
            ))}
          </KdsColumn>
          <KdsColumn
            title="New"
            count={columns.next.length}
            color="border-amber-400"
            emptyLabel="Nothing waiting to start."
          >
            {columns.next.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                restaurantId={account.restaurantId}
                onChanged={refresh}
              />
            ))}
          </KdsColumn>
          <KdsColumn
            title="Preparing"
            count={columns.preparing.length}
            color="border-blue-400"
            emptyLabel="Nothing in preparation."
          >
            {columns.preparing.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                restaurantId={account.restaurantId}
                onChanged={refresh}
              />
            ))}
          </KdsColumn>
          <KdsColumn
            title="Ready"
            count={columns.ready.length}
            color="border-green-500"
            emptyLabel="Nothing ready yet."
          >
            {columns.ready.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                restaurantId={account.restaurantId}
                onChanged={refresh}
              />
            ))}
          </KdsColumn>
        </div>
      </div>
    </div>
  );

  if (fullscreen) return kds;

  return <PartnerShell activeRoute="kitchen">{kds}</PartnerShell>;
}
