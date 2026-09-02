import { BagIcon, SwitchIcon, TableIcon } from "@/components/icons";

const features = [
  {
    icon: TableIcon,
    title: "Dine Ready",
    description: "Reserve your table and walk in to a seat that is already waiting.",
  },
  {
    icon: BagIcon,
    title: "Pickup Ready",
    description: "Pre-order online and collect at the counter. No queue, no guesswork.",
  },
  {
    icon: SwitchIcon,
    title: "Flex Switch",
    description: "Plans change. Switch from dine-in to pickup in a tap, without starting over.",
  },
];

export function FeatureHighlights() {
  return (
    <section className="site-section bg-background" aria-label="Dining options">
      <div className="site-wrap grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article key={feature.title} className="site-card p-6">
              <Icon className="h-7 w-7 text-accent" />
              <h2 className="mt-5 text-lg font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
