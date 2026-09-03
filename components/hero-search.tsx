import { Suspense } from "react";
import { SearchBar } from "@/components/search-bar";

function SearchFallback() {
  return <div className="hero-search" aria-hidden="true" />;
}

export function HeroSearch() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchBar appearance="hero" />
    </Suspense>
  );
}
