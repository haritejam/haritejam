import { StarIcon } from "@/components/icons";

const quotes = [
  {
    name: "Ananya M.",
    role: "Diner, Bandra",
    text: "We sat down and the first plates were already on their way. It felt like the evening had been arranged for us.",
  },
  {
    name: "Rohan D.",
    role: "Restaurant partner",
    text: "Pre-orders take the guesswork out of the pass. We know what is coming, and guests are happier for it.",
  },
  {
    name: "Priya K.",
    role: "Diner, Worli",
    text: "A late meeting meant we could not sit. FlexiSwitch turned the reservation into pickup in under a minute.",
  },
];

export function Testimonials() {
  return (
    <section id="about" className="site-section bg-background" data-header-skin="canvas">
      <div className="site-wrap">
        <h2 className="site-h2 text-center">Loved by diners, trusted by restaurants</h2>
        <p className="site-lead mx-auto text-center">Sample comments for the demo product. Not live reviews.</p>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {quotes.map((quote) => (
            <blockquote key={quote.name} className="grid gap-4 py-8 md:grid-cols-[8rem_1fr_10rem] md:items-start">
              <div className="flex gap-0.5 text-accent" aria-label="5 stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-[1.05rem] leading-7 text-muted">“{quote.text}”</p>
              <footer>
                <p className="text-sm font-semibold">{quote.name}</p>
                <p className="text-xs text-muted">{quote.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
