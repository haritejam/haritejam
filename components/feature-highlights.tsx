import { BagIcon, SwitchIcon, TableIcon } from "@/components/icons";

const features = [
  {
    icon: TableIcon,
    title: "Dine Ready",
    description: "Reserve your table and walk in to a seat that is already waiting.",
    tint: "text-[#d4a574]",
  },
  {
    icon: BagIcon,
    title: "Pickup Ready",
    description: "Pre-order online and collect at the counter — no queue, no guesswork.",
    tint: "text-[#7dba8d]",
  },
  {
    icon: SwitchIcon,
    title: "Flex Switch",
    description: "Plans change. Switch from dine-in to pickup in a tap, without starting over.",
    tint: "text-[#b39bdb]",
  },
];

export function FeatureHighlights() {
  return (
    <section className="bg-[#111318] px-5 py-12 sm:px-8 sm:py-14 lg:px-12" aria-label="Dining options">
      <div className="mx-auto grid max-w-[1440px] gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-[#1a1d24] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            >
              <Icon className={`h-7 w-7 ${feature.tint}`} />
              <h2 className="mt-5 text-lg font-semibold text-white">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">{feature.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
