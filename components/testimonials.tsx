import { StarIcon } from "@/components/icons";

const quotes = [
  {
    name: "Sarah J.",
    role: "Diner, Bandra",
    text: "We sat down and the first plates were already on their way. It felt like the evening had been arranged for us.",
  },
  {
    name: "Mike R.",
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
    <section id="about" className="bg-[#111318] py-16 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <h2 className="text-center text-2xl font-semibold text-white sm:text-3xl">
          Loved by diners, trusted by restaurants
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {quotes.map((quote) => (
            <blockquote key={quote.name} className="rounded-2xl border border-white/10 bg-[#1a1d24] p-6">
              <div className="flex gap-0.5 text-[#d4a574]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-white/75">“{quote.text}”</p>
              <footer className="mt-5 text-sm font-semibold text-white">{quote.name}</footer>
              <p className="text-xs text-white/45">{quote.role}</p>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
