import { HeroPoster } from "@/components/hero-poster";
import { HeroStory } from "@/components/hero-story";
import { StarIcon, TableIcon } from "@/components/icons";

export function Hero() {
  return (
    <section className="hero" data-header-skin="dark">
      <div className="hero-image-wrapper">
        <HeroPoster />
      </div>
      <div className="hero-content mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12" data-header-skin="dark">
        <div className="hero-content-grid">
          <div className="hero-block hero-block--story">
            <p className="inline-flex rounded-full border border-[#d4a574]/35 bg-[#14110e]/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4a574]">
              The flexible way to dine
            </p>
            <h1 className="mt-7 text-[clamp(2.15rem,4.6vw,3.75rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-white">
              <span className="block">Reserve</span>
              <span className="block">Pre-order</span>
              <span className="block text-[#e6c49a]">Dine or pickup</span>
            </h1>
            <div className="hero-story-copy">
              <p>
                FlexiDine is one booking for a table, a kitchen ticket, or both. You do not split a reservation app from a takeout app.
              </p>
              <p>
                Skip the wait. Book the seat, send the dishes ahead, then dine in or pick up. If the evening changes, FlexiSwitch converts dine-in to pickup — or pickup to a table — without cancelling the kitchen.
              </p>
              <p>
                Diners finish the meal on time. Restaurants know what is coming, turn tables faster, and fill quieter hours with timed pickup.
              </p>
            </div>
            <ul className="hero-story-points">
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
          <div className="hero-block hero-block--scripts">
            <HeroStory />
          </div>
        </div>
      </div>
    </section>
  );
}
