"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  approveBookingForKitchen,
  BOOKING_EVENT,
  type Booking,
} from "@/lib/bookings";
import {
  bookingsForRestaurant,
  clearKitchenSession,
  PARTNER_EVENT,
  readKitchenSession,
  type KitchenAccount,
} from "@/lib/partner-ops";
import { formatSlotLabel, formatVisitDay } from "@/lib/visit-slots";

type SectionKey = "reserve" | "reserve-preorder" | "pickup";

const SECTIONS: { key: SectionKey; title: string; copy: string }[] = [
  {
    key: "reserve",
    title: "Reservation / dine",
    copy: "Table holds. Approve when the pass should see the cover.",
  },
  {
    key: "reserve-preorder",
    title: "Pre-order",
    copy: "Reserved tables with food already chosen.",
  },
  {
    key: "pickup",
    title: "Pickup",
    copy: "Parcel tickets. Approve when packing should start.",
  },
];

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function TicketCard({
  ticket,
  onApprove,
}: {
  ticket: Booking;
  onApprove: (id: string) => void;
}) {
  const approved = ticket.kitchenStatus === "approved";

  return (
    <article className="site-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{formatWhen(ticket.createdAt)}</p>
          <h3 className="mt-1 text-lg font-semibold">{ticket.dinerName || "Guest diner"}</h3>
          {ticket.visitDate && ticket.slot ? (
            <p className="mt-1 text-sm text-accent">
              {formatVisitDay(ticket.visitDate)} · {formatSlotLabel(ticket.slot)}
              {ticket.guests ? ` · ${ticket.guests} guests` : ""}
            </p>
          ) : null}
          {ticket.items.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {ticket.items.map((item) => (
                <li key={item.name}>
                  {item.quantity} × {item.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="text-right">
          {ticket.totalRupees > 0 ? (
            <p className="text-sm font-medium text-accent">₹{ticket.totalRupees.toLocaleString("en-IN")}</p>
          ) : null}
          {approved ? (
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-muted">In kitchen</p>
          ) : (
            <button
              type="button"
              onClick={() => onApprove(ticket.id)}
              className="mt-3 rounded-[6px] bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Approve for kitchen
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function PartnerOrders() {
  const router = useRouter();
  const [account, setAccount] = useState<KitchenAccount | null>(null);
  const [tickets, setTickets] = useState<Booking[]>([]);

  const refresh = useCallback(() => {
    const session = readKitchenSession();
    if (!session) {
      router.replace("/partner/register#restaurant-login");
      return;
    }
    setAccount(session);
    setTickets(bookingsForRestaurant(session.restaurantId));
  }, [router]);

  useEffect(() => {
    refresh();
    window.addEventListener(BOOKING_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(PARTNER_EVENT, refresh);
    return () => {
      window.removeEventListener(BOOKING_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(PARTNER_EVENT, refresh);
    };
  }, [refresh]);

  const grouped = useMemo(
    () => ({
      reserve: tickets.filter((ticket) => ticket.kind === "reserve"),
      "reserve-preorder": tickets.filter((ticket) => ticket.kind === "reserve-preorder"),
      pickup: tickets.filter((ticket) => ticket.kind === "pickup"),
    }),
    [tickets],
  );

  const pendingCount = tickets.filter((ticket) => ticket.kitchenStatus !== "approved").length;

  if (!account) {
    return null;
  }

  return (
    <main className="bg-background text-foreground" data-header-skin="canvas">
      <section className="site-section">
        <div className="site-wrap">
          <p className="text-sm font-medium text-accent">Order management · {account.restaurantId}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="site-h1">{account.restaurantName}</h1>
            <div className="flex flex-wrap gap-3">
              <Link href="/partner/kitchen" className="text-sm font-medium text-accent">
                Kitchen
              </Link>
              <Link href={`/restaurants/${account.restaurantId}`} className="text-sm font-medium text-accent">
                Diner page
              </Link>
              <button
                type="button"
                className="text-sm font-medium text-muted"
                onClick={() => {
                  clearKitchenSession();
                  router.replace("/partner/register");
                }}
              >
                Log out
              </button>
            </div>
          </div>
          <p className="site-lead">
            New diner tickets stay here until you approve them. Kitchen stays empty until then.
            {pendingCount ? ` ${pendingCount} waiting.` : ""}
          </p>

          <div className="mt-12 grid gap-10">
            {SECTIONS.map((section) => {
              const list = grouped[section.key];
              return (
                <section key={section.key}>
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold">{section.title}</h2>
                      <p className="mt-1 text-sm text-muted">{section.copy}</p>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                      {list.length} {list.length === 1 ? "ticket" : "tickets"}
                    </p>
                  </div>
                  {list.length === 0 ? (
                    <p className="mt-3 text-sm text-muted">No {section.title.toLowerCase()} tickets yet.</p>
                  ) : (
                    <div className="mt-4 grid gap-4">
                      {list.map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} onApprove={approveBookingForKitchen} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
