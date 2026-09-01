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
    <form
      onSubmit={handleSubmit}
      className="mt-8 flex w-full max-w-[690px] flex-col border border-[#cfd3cd] bg-white p-1.5 shadow-[0_10px_25px_rgba(22,57,50,0.05)] sm:flex-row sm:items-center"
    >
      <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 sm:py-2" htmlFor="restaurant-search">
        <SearchIcon className="h-5 w-5 shrink-0 text-[#52756c]" />
        <span className="sr-only">Search restaurants, cuisines, or dishes</span>
        <input
          id="restaurant-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Restaurant, cuisine, or dish"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-[#173b35] outline-none placeholder:text-[#87918e]"
        />
      </label>
      <div className="mx-3 h-px bg-[#e0e2dd] sm:mx-0 sm:h-8 sm:w-px" />
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-[#40524e] sm:py-2"
        aria-label="Location: Mumbai"
      >
        <LocationPin className="h-4.5 w-4.5 shrink-0 text-[#52756c]" />
        <span className="whitespace-nowrap">Mumbai</span>
        <ChevronDown className="ml-auto h-3.5 w-3.5" />
      </button>
      <button
        type="submit"
        className="mt-1 bg-[#173b35] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#28564d] sm:mt-0 sm:py-2.5"
      >
        Explore
      </button>
    </form>
  );
}
