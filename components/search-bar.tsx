"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import { parseSearchQuery } from "@/lib/restaurant-data";

function scrollToRestaurants() {
  document.getElementById("restaurants")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SearchBar({ appearance = "light" }: { appearance?: "light" | "hero" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(parseSearchQuery(searchParams.get("q") ?? undefined));
  }, [searchParams]);

  function go(nextQuery: string) {
    const q = nextQuery.trim();
    const onHome = pathname === "/";
    if (onHome) {
      router.push(q ? `/?q=${encodeURIComponent(q)}#restaurants` : "/#restaurants");
      window.setTimeout(scrollToRestaurants, 40);
      return;
    }
    router.push(q ? `/restaurants?q=${encodeURIComponent(q)}` : "/restaurants");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    go(query);
  }

  const hero = appearance === "hero";

  return (
    <form
      onSubmit={handleSubmit}
      className={hero ? "hero-search" : "site-card mt-8 flex w-full max-w-[690px] flex-col gap-2 p-1.5 sm:flex-row sm:items-center sm:gap-0"}
      role="search"
    >
      <label className={hero ? "hero-search-field" : "flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 sm:py-2"} htmlFor="restaurant-search">
        <SearchIcon className="h-5 w-5 shrink-0 text-accent" />
        <span className="sr-only">Search restaurants, cuisines, or dishes</span>
        <input
          id="restaurant-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Restaurant, cuisine, or dish"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted"
        />
      </label>
      <div className={hero ? "hero-search-actions" : "flex items-center gap-1 sm:pl-1"}>
        <button type="button" className={hero ? "hero-search-nearby" : "px-3 py-2.5 text-sm font-semibold text-accent sm:py-2"} onClick={() => go("")}>
          Nearby
        </button>
        <button type="submit" className="site-btn">
          Search
        </button>
      </div>
    </form>
  );
}
