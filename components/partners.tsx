import Image from "next/image";

export function Partners() {
  return (
    <section id="for-partners" className="site-section scroll-mt-24 bg-surface" data-header-skin="surface">
      <div className="site-wrap grid items-center gap-10 lg:grid-cols-2">
        <div className="relative aspect-[1.35] overflow-hidden rounded-[6px] bg-background">
          <Image
            src="/images/restaurant-onboarding.jpg"
            alt="Restaurant team at the pass with tickets and a dining room in service"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </div>
        <div>
          <h2 className="site-h2">Onboard your restaurant. One booking for the floor and the kitchen.</h2>
          <ul className="mt-6 space-y-3 text-[1.05rem] leading-7 text-muted">
            <li>Turn tables faster with guests who have already ordered.</li>
            <li>Fill quieter hours with timed pickup without crowding the floor.</li>
            <li>Give diners a way to switch plans without cancelling.</li>
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="mailto:partners@flexidine.com" className="site-btn">
              Partner with Us
            </a>
            <a href="#about" className="text-sm font-medium text-accent hover:text-foreground">
              Learn more
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
