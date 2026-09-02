"use client";

import { BagIcon, ClocheIcon, SearchIcon, SwitchIcon } from "@/components/icons";
import { Reveal, Stagger, StaggerItem } from "@/components/motion-reveal";

const steps = [
  {
    icon: SearchIcon,
    title: "Choose",
    description: "Browse nearby restaurants and pick the table, cuisine, or dish you want.",
  },
  {
    icon: BagIcon,
    title: "Pre-order",
    description: "Lock in your meal before you leave, so the kitchen is already moving.",
  },
  {
    icon: ClocheIcon,
    title: "Arrive & enjoy",
    description: "Walk in to a ready table, or collect your order the moment you pull up.",
  },
  {
    icon: SwitchIcon,
    title: "Flex Switch",
    description: "If plans change, switch from dine-in to pickup without cancelling the order.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="site-section scroll-mt-24 bg-surface" data-header-skin="surface">
      <div className="site-wrap">
        <Reveal>
          <h2 className="site-h2 text-center">How FlexiDine works</h2>
          <p className="site-lead mx-auto text-center">
            Four simple steps from craving to table — or to the pickup counter.
          </p>
        </Reveal>
        <Stagger className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <StaggerItem key={step.title}>
                <article className="relative text-center">
                  {index < steps.length - 1 && (
                    <span className="pointer-events-none absolute right-[-12%] top-7 hidden h-px w-[24%] bg-line lg:block" />
                  )}
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-[6px] border border-line bg-background text-accent">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
