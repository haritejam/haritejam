import Image from "next/image";

export function Partners() {
  return (
    <section id="for-partners" className="scroll-mt-24 bg-[#f3eee6] py-16 text-[#1a140c] sm:py-20">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
        <div className="relative aspect-[1.35] overflow-hidden rounded-2xl bg-[#d8d2c8]">
          <Image
            src="/images/honey-and-smoke.jpg"
            alt="Restaurant kitchen and dining service"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            More orders. Happier guests. Smarter operations.
          </h2>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-[#5c5348]">
            <li>Turn tables faster with guests who have already ordered.</li>
            <li>Fill quieter hours with timed pickup without crowding the floor.</li>
            <li>Give diners a way to switch plans without cancelling.</li>
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="mailto:partners@flexidine.com"
              className="rounded-full bg-[#d4a574] px-5 py-2.5 text-sm font-semibold text-[#1a140c] hover:bg-[#c49662]"
            >
              Partner with Us
            </a>
            <a href="#about" className="text-sm font-medium text-[#8a6b45] hover:text-[#1a140c]">
              Learn more
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
