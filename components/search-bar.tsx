"use client";

import { FormEvent, useState } from "react";
import { ChevronDown, LocationPin, SearchIcon } from "@/components/icons";

export function SearchBar() {
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.getElementById("restaurants")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <form onSubmit={handleSubmit} className="site-card mt-8 flex w-full max-w-[690px] flex-col p-1.5 sm:flex-row sm:items-center">
      <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 sm:py-2" htmlFor="restaurant-search">
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
      <div className="mx-3 h-px bg-line sm:mx-0 sm:h-8 sm:w-px" />
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-muted sm:py-2"
        aria-label="Location: Mumbai"
      >
        <LocationPin className="h-4.5 w-4.5 shrink-0 text-accent" />
        <span className="whitespace-nowrap">Mumbai</span>
        <ChevronDown className="ml-auto h-3.5 w-3.5" />
      </button>
      <button type="submit" className="site-btn mt-1 sm:mt-0">
        Explore
      </button>
    </form>
  );
}
