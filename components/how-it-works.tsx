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
    title: "Order ahead",
    description: "Lock in your meal before you leave, so the kitchen is already moving.",
  },
  {
    icon: ClocheIcon,
    title: "Skip the wait & enjoy",
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
        <div className="relative mt-12">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-7 right-[12.5%] left-[12.5%] hidden h-px bg-line lg:block"
          />
          <Stagger className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <StaggerItem key={step.title}>
                  <article className="text-center">
                    <div className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-[6px] bg-background text-accent">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-[1.125rem] font-semibold tracking-[-0.025em] text-foreground">
                      {step.title}
                    </h3>
                    <p className="mx-auto mt-2 max-w-[17rem] text-[0.9375rem] leading-6 tracking-[-0.015em] text-muted">
                      {step.description}
                    </p>
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
