import { CalendarIcon, PackageIcon, UtensilsIcon } from "@/components/icons";

const benefits = [
  {
    icon: CalendarIcon,
    title: "Prebook with certainty",
    description: "See real availability and settle the details before you leave home.",
  },
  {
    icon: UtensilsIcon,
    title: "Pre-order the good part",
    description: "Spend less time deciding at the table and more time in the moment.",
  },
  {
    icon: PackageIcon,
    title: "Pick up, perfectly timed",
    description: "Your order is made around your day, not the other way around.",
  },
];

export function Benefits() {
  return (
    <section className="site-section border-y border-line bg-surface">
      <div className="site-wrap">
        <h2 className="site-h2 max-w-[610px]">More time at the table. Less time around it.</h2>
        <div className="mt-12 grid border-t border-line md:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className={`relative py-8 md:px-8 md:py-10 ${index > 0 ? "border-t border-line md:border-l md:border-t-0" : ""} ${index === 0 ? "md:pl-0" : ""}`}
              >
                <Icon className="h-6 w-6 text-accent" />
                <h3 className="mt-8 text-2xl tracking-[-0.02em]">{benefit.title}</h3>
                <p className="mt-3 max-w-[290px] text-sm leading-6 text-muted">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
