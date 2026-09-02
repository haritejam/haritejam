import { Reveal } from "@/components/motion-reveal";

export function FlexAdvantage() {
  return (
    <section id="flexiswitch" className="site-section scroll-mt-24 bg-background" data-header-skin="canvas">
      <Reveal className="site-wrap grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="site-h2">Dine in today. Pickup, if you need to.</h2>
          <p className="site-lead">
            FlexiSwitch lets you convert a reserved table into a pickup order in seconds. Your pre-order stays with the kitchen. You just change how you receive it.
          </p>
        </div>
        <div className="flex justify-center gap-4 sm:gap-6">
          <div className="site-card w-[min(100%,200px)] p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted">Your order</p>
            <p className="mt-3 font-semibold">Serein House</p>
            <p className="mt-1 text-xs text-muted">Dine-in · 7:30 PM · 2 guests</p>
            <ul className="mt-4 space-y-2 text-xs text-muted">
              <li>Charred paneer tikka</li>
              <li>Coastal crab curry</li>
            </ul>
            <p className="mt-6 text-sm font-semibold">₹1,370</p>
          </div>
          <div className="site-card mt-8 w-[min(100%,200px)] border-accent/40 p-4">
            <p className="text-[10px] uppercase tracking-widest text-accent">Updated</p>
            <p className="mt-3 font-semibold">Switched to pickup</p>
            <p className="mt-1 text-xs text-muted">Ready at 7:20 PM</p>
            <p className="mt-6 text-xs leading-5 text-muted">Same dishes. Same kitchen. Collect at the counter.</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
