export function FlexAdvantage() {
  return (
    <section id="flexiswitch" className="scroll-mt-24 bg-[#111318] py-16 sm:py-20">
      <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d4a574]">Flex Advantage</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Dine in today. Pickup, if you need to.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
            FlexiSwitch lets you convert a reserved table into a pickup order in seconds. Your pre-order stays with the kitchen. You just change how you receive it.
          </p>
        </div>
        <div className="flex justify-center gap-4 sm:gap-6">
          <div className="w-[min(100%,200px)] rounded-[2rem] border border-white/12 bg-[#1a1d24] p-4 shadow-2xl">
            <p className="text-[10px] uppercase tracking-widest text-white/40">Your order</p>
            <p className="mt-3 font-semibold text-white">Serein House</p>
            <p className="mt-1 text-xs text-white/55">Dine-in · 7:30 PM · 2 guests</p>
            <ul className="mt-4 space-y-2 text-xs text-white/75">
              <li>Charred paneer tikka</li>
              <li>Coastal crab curry</li>
            </ul>
            <p className="mt-6 text-sm font-semibold text-white">₹1,370</p>
          </div>
          <div className="mt-8 w-[min(100%,200px)] rounded-[2rem] border border-[#d4a574]/35 bg-[#1a1d24] p-4 shadow-2xl">
            <p className="text-[10px] uppercase tracking-widest text-[#d4a574]">Updated</p>
            <p className="mt-3 font-semibold text-white">Switched to pickup</p>
            <p className="mt-1 text-xs text-white/55">Ready at 7:20 PM</p>
            <p className="mt-6 text-xs leading-5 text-white/70">Same dishes. Same kitchen. Collect at the counter.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
