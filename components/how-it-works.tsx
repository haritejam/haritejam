import { BagIcon, ClocheIcon, SearchIcon, SwitchIcon } from "@/components/icons";

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
    <section id="how-it-works" className="scroll-mt-24 bg-[#f3eee6] py-16 text-[#1a140c] sm:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">How FlexiDine works</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-[#5c5348]">
          Four simple steps from craving to table — or to the pickup counter.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article key={step.title} className="relative text-center">
                {index < steps.length - 1 && (
                  <span className="pointer-events-none absolute right-[-12%] top-7 hidden h-px w-[24%] bg-[#d4c4b0] lg:block" />
                )}
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#d4c4b0] bg-white text-[#8a6b45]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5c5348]">{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
