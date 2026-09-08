"use client";

import { useEffect, useState } from "react";
import type { IndianCity } from "@/lib/cities";
import {
  CITY_EVENT,
  detectCityFromBrowser,
  readCityPreference,
  writeCityPreference,
} from "@/lib/location";

export function useCity(options?: { detect?: boolean }) {
  const detect = options?.detect ?? true;
  const [city, setCity] = useState<IndianCity>("Mumbai");

  useEffect(() => {
    const sync = () => setCity(readCityPreference().city);
    sync();
    window.addEventListener(CITY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CITY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!detect) {
      return;
    }
    const current = readCityPreference();
    if (current.source === "manual") {
      return;
    }
    let cancelled = false;
    detectCityFromBrowser().then((detected) => {
      if (cancelled || !detected) {
        return;
      }
      if (readCityPreference().source === "manual") {
        return;
      }
      writeCityPreference(detected, "auto");
    });
    return () => {
      cancelled = true;
    };
  }, [detect]);

  function chooseCity(next: IndianCity) {
    writeCityPreference(next, "manual");
  }

  return { city, chooseCity };
}