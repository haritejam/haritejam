import Link from "next/link";
import { StarIcon, TableIcon } from "@/components/icons";

const actions = [
  {
    href: "/restaurants",
    label: "Reserve a table",
    style: "bg-[#d4a574] text-[#1a140c] hover:bg-[#e0b686]",
  },
  {
    href: "/restaurants",
    label: "Reserve a table and pre-order the food",
    style: "border border-[#d4a574]/70 text-white hover:bg-white/10",
  },
  {
    href: "/restaurants",
    label: "Pre-order food for pickup",
    style: "border border-white/25 text-white hover:bg-white/10",
  },
];

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-image-wrapper">
        <img
          src="/images/flexidine-bg.jpg"
          alt="FlexiDine: plate, clock, and pickup — reserve, pre-order, dine or pickup"
          width={1536}
          height={1024}
        />
      </div>
      <div className="hero-content mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <p className="inline-flex rounded-full border border-[#d4a574]/35 bg-[#14110e]/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4a574]">
          The flexible way to dine
        </p>
        <h1 className="mt-7 text-[clamp(2.15rem,4.6vw,3.75rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-white">
          <span className="block">Reserve</span>
          <span className="block">Pre-order</span>
          <span className="block text-[#e6c49a]">Dine or pickup</span>
        </h1>
        <p className="mt-6 max-w-[480px] text-[15px] leading-7 text-white/78">
          Skip the wait. Book your table, order ahead, and collect when you are ready — or switch with Flex Switch if plans change.
        </p>
        <div className="mt-8 flex max-w-[440px] flex-col gap-3">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-center text-sm font-semibold transition-colors ${action.style}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium uppercase tracking-[0.12em] text-white/70">
          <li className="inline-flex items-center gap-2">
            <StarIcon className="h-4 w-4 text-[#d4a574]" />
            Best restaurants
          </li>
          <li className="inline-flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-[#d4a574]" />
            No waiting
          </li>
          <li>Total flexibility</li>
        </ul>
      </div>
    </section>
  );
}
