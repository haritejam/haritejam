"use client";

import { useEffect, useState } from "react";
import { PartnerOnboardingModal } from "@/components/partner-onboarding-modal";
import { readPartnerApplication, type PartnerApplicationStatus } from "@/lib/partner-onboarding";

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

  useEffect(() => {
    const stored = readPartnerApplication();
    setStatus(stored?.status ?? null);
  }, []);

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
