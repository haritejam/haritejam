import { FlexAdvantage } from "@/components/flex-advantage";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Partners } from "@/components/partners";
import { RestaurantDiscovery } from "@/components/restaurant-discovery";
import { Testimonials } from "@/components/testimonials";

export default function Home() {
  return (
    <main>
      <Hero />
      <RestaurantDiscovery />
      <HowItWorks />
      <FlexAdvantage />
      <Partners />
      <Testimonials />
    </main>
  );
}
