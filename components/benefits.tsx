import { CalendarIcon, PackageIcon, UtensilsIcon } from "@/components/icons";

const benefits = [
  {
    icon: CalendarIcon,
    number: "01",
    title: "Prebook with certainty",
    description: "See real availability and settle the details before you leave home.",
  },
  {
    icon: UtensilsIcon,
    number: "02",
    title: "Pre-order the good part",
    description: "Spend less time deciding at the table and more time in the moment.",
  },
  {
    icon: PackageIcon,
    number: "03",
    title: "Pick up, perfectly timed",
    description: "Your order is made around your day, not the other way around.",
  },
];

export function Benefits() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-[#dcddd7] bg-[#f1f2ed]">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="max-w-[610px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#55776e]">One place, every way to dine</p>
          <h2 className="font-display mt-3 text-[clamp(2.4rem,4.2vw,4rem)] leading-[0.98] tracking-[-0.055em] text-[#173b35]">
            More time at the table. Less time around it.
          </h2>
        </div>

        <div className="mt-12 grid border-t border-[#d6d8d1] md:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.number}
                className={`relative py-8 md:px-8 md:py-10 ${index > 0 ? "border-t border-[#d6d8d1] md:border-l md:border-t-0" : ""} ${index === 0 ? "md:pl-0" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-[#51746a]" />
                  <span className="text-[11px] font-semibold tracking-[0.12em] text-[#8a948f]">{benefit.number}</span>
                </div>
                <h3 className="font-display mt-8 text-2xl tracking-[-0.04em] text-[#173b35]">{benefit.title}</h3>
                <p className="mt-3 max-w-[290px] text-sm leading-6 text-[#66736f]">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
