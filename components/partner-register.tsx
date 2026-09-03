"use client";

import { useEffect, useState } from "react";
import { PartnerOnboardingModal } from "@/components/partner-onboarding-modal";
import { hashToStaffGate, PartnerStaffLogin, type StaffGate } from "@/components/partner-staff-login";
import { clearPendingLocalApplication, readPartnerApplication, type PartnerApplicationStatus } from "@/lib/partner-onboarding";
import { emitPartnerFlow, PARTNER_HOME_EVENT } from "@/lib/partner-ops";

const benefits = [
  {
    title: "Zero Lost Sales",
    detail: "When plans change, FlexiSwitch converts the ticket instead of a cancellation. The kitchen keeps the work.",
  },
  {
    title: "Pre-Paid Bookings",
    detail: "Tables and pickup tickets arrive with the order already paid, so the pass is not guessing covers.",
  },
  {
    title: "No Last-Mile Fees",
    detail: "BOPIS and dine-in pre-order skip rider commissions. Guests collect, or they sit.",
  },
  {
    title: "Staged Kitchen Alerts",
    detail: "Fire times follow your prep rules, so food lands when the guest is at the door or the table.",
  },
];

export function PartnerRegister() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<PartnerApplicationStatus | null>(null);
  const [gate, setGate] = useState<StaffGate | null>(null);

  useEffect(() => {
    clearPendingLocalApplication();
    const stored = readPartnerApplication();
    setStatus(stored?.status ?? null);
  }, []);

  useEffect(() => {
    emitPartnerFlow(open);
    return () => emitPartnerFlow(false);
  }, [open]);

  useEffect(() => {
    function goHome() {
      setOpen(false);
      setGate(null);
      window.history.replaceState(null, "", "/partner/register");
    }
    window.addEventListener(PARTNER_HOME_EVENT, goHome);
    return () => window.removeEventListener(PARTNER_HOME_EVENT, goHome);
  }, []);

  useEffect(() => {
    function readHash() {
      setGate(hashToStaffGate(window.location.hash));
    }
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  function closeGate() {
    setGate(null);
    window.history.replaceState(null, "", "/partner/register");
  }

  function startOnboarding() {
    setStep(0);
    setOpen(true);
  }

  return (
    <main className="bg-background text-foreground" data-header-skin="canvas">
      <section className="site-section">
        <div className="site-wrap">
          <p className="text-sm font-medium text-accent">For restaurant partners</p>
          <h1 className="site-h1 mt-3 max-w-[18ch]">Turn Wait Times into Revenue. Partner with FlexiDine.</h1>
          <p className="site-lead">
            FlexiDine is one booking for a table, a kitchen ticket, or both. Flexible pre-order and BOPIS turn covers faster, drop rider fees to zero, and convert walk-outs with FlexiSwitch instead of cancellations.
          </p>
          <button type="button" className="site-btn mt-8" onClick={startOnboarding}>
            Start Restaurant Onboarding
          </button>

          {status === "PENDING_APPROVAL" ? (
            <div className="site-card mt-10 max-w-[40rem] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">PENDING_APPROVAL</p>
              <p className="mt-3 text-[1.15rem] font-semibold leading-7">Thanks for choosing FlexiDine! Your application is under review. Expected approval within 12 to 24 hours.</p>
            </div>
          ) : null}
          {status === "APPROVED" ? (
            <div className="site-card mt-10 max-w-[40rem] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">APPROVED</p>
              <p className="mt-3 text-[1.15rem] font-semibold leading-7">
                Your restaurant is live on FlexiDine. Check the owner email for the kitchen username and password, then use Restaurant login.
              </p>
            </div>
          ) : null}
          {status === "REJECTED" ? (
            <div className="site-card mt-10 max-w-[40rem] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">REJECTED</p>
              <p className="mt-3 text-[1.15rem] font-semibold leading-7">This application was not approved. You can update the form and submit again.</p>
            </div>
          ) : null}

          <PartnerStaffLogin gate={gate} onClose={closeGate} />

          <div className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="site-card p-5">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{benefit.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{benefit.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PartnerOnboardingModal
        open={open}
        step={step}
        onStepChange={setStep}
        onClose={() => setOpen(false)}
        onSubmitted={() => {
          setStatus("PENDING_APPROVAL");
          setOpen(false);
        }}
      />
    </main>
  );
}
