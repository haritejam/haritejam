"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  approveApplication,
  clearAdminSession,
  readAdminSession,
  readPartnerMail,
  readPartnerQueue,
  rejectApplication,
  resendApprovalEmail,
  type QueuedApplication,
} from "@/lib/partner-ops";

function formatWhen(iso?: string) {
  if (!iso) {
    return "";
  }
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function PartnerAdminBoard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [queue, setQueue] = useState<QueuedApplication[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!readAdminSession()) {
      router.replace("/partner/register#admin-login");
      return;
    }
    setQueue(readPartnerQueue());
    setReady(true);
  }, [router]);

  const pending = useMemo(() => queue.filter((item) => item.status === "PENDING_APPROVAL"), [queue]);
  const reviewed = useMemo(
    () => queue.filter((item) => item.status !== "PENDING_APPROVAL"),
    [queue],
  );

  if (!ready) {
    return null;
  }

  function refresh() {
    setQueue(readPartnerQueue());
  }

  function onApprove(id: string) {
    const approved = approveApplication(id);
    refresh();
    if (approved?.credentials) {
      setNote(
        `${approved.values.restaurantName} is live. Username ${approved.credentials.username} was emailed to ${approved.values.ownerEmail}.`,
      );
    }
  }

  function onReject(id: string) {
    rejectApplication(id, "Not ready for the diner app yet.");
    refresh();
    setNote("Application rejected.");
  }

  return (
    <main className="bg-background text-foreground" data-header-skin="canvas">
      <section className="site-section">
        <div className="site-wrap">
          <p className="text-sm font-medium text-accent">Admin</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="site-h1">Restaurant approval</h1>
            <div className="flex flex-wrap gap-3">
              <Link href="/partner/register" className="text-sm font-medium text-accent">
                Onboarding page
              </Link>
              <button
                type="button"
                className="text-sm font-medium text-muted"
                onClick={() => {
                  clearAdminSession();
                  router.replace("/partner/register");
                }}
              >
                Log out
              </button>
            </div>
          </div>
          <p className="site-lead">
            Approve a kitchen to generate a username and password, email the owner, and list the restaurant on FlexiDine.
          </p>
          {note ? <p className="mt-6 text-sm text-accent">{note}</p> : null}

          <h2 className="mt-12 text-lg font-semibold">Waiting for approval</h2>
          {pending.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No applications in the queue yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {pending.map((item) => (
                <li key={item.id} className="site-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">PENDING_APPROVAL</p>
                  <h3 className="mt-2 text-xl font-semibold">{item.values.restaurantName}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {item.values.cuisine} · {item.values.city} · {item.values.seatingCapacity} seats
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {item.values.ownerName} · {item.values.ownerPhone} · {item.values.ownerEmail}
                  </p>
                  <p className="mt-1 text-xs text-muted">Submitted {formatWhen(item.submittedAt)}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" className="site-btn" onClick={() => onApprove(item.id)}>
                      Approve and go live
                    </button>
                    <button type="button" className="booking-gate__stay" onClick={() => onReject(item.id)}>
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-12 text-lg font-semibold">Reviewed</h2>
          {reviewed.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Approved and rejected applications will list here.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviewed.map((item) => {
                const mail = readPartnerMail().find((entry) => entry.id === item.mailId);
                return (
                  <li key={item.id} className="site-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{item.status}</p>
                    <h3 className="mt-2 text-lg font-semibold">{item.values.restaurantName}</h3>
                    {item.status === "APPROVED" && item.credentials ? (
                      <div className="mt-3 space-y-1 text-sm text-muted">
                        <p>
                          Live as <span className="text-foreground">{item.restaurantId}</span> on the diner app.
                        </p>
                        <p>
                          Username <span className="text-foreground">{item.credentials.username}</span>
                        </p>
                        <p>
                          Password <span className="text-foreground">{item.credentials.password}</span>
                        </p>
                        <p>Emailed to {item.values.ownerEmail}{mail?.openedMailClient ? " (mail client opened)." : "."}</p>
                        <button type="button" className="mt-3 site-btn" onClick={() => resendApprovalEmail(item.id)}>
                          Resend email
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted">{item.rejectNote}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
