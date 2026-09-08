import { indianCities, type IndianCity } from "@/lib/cities";

export const CITY_KEY = "flexidine-city";
export const CITY_EVENT = "flexidine-city";

export type CityPreference = {
  city: IndianCity;
  source: "auto" | "manual" | "default";
};

const CITY_COORDS: Record<IndianCity, { lat: number; lng: number }> = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
  Indore: { lat: 22.7196, lng: 75.8577 },
  Goa: { lat: 15.2993, lng: 74.124 },
};

const DEFAULT: CityPreference = { city: "Mumbai", source: "default" };

function isIndianCity(value: string): value is IndianCity {
  return (indianCities as readonly string[]).includes(value);
}

export function readCityPreference(): CityPreference {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(CITY_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as CityPreference;
    if (parsed?.city && isIndianCity(parsed.city)) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT;
}

export function writeCityPreference(city: IndianCity, source: CityPreference["source"]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CITY_KEY, JSON.stringify({ city, source }));
  window.dispatchEvent(new Event(CITY_EVENT));
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function nearestCity(lat: number, lng: number): IndianCity {
  let best: IndianCity = "Mumbai";
  let bestKm = Number.POSITIVE_INFINITY;
  for (const city of indianCities) {
    const km = distanceKm({ lat, lng }, CITY_COORDS[city]);
    if (km < bestKm) {
      bestKm = km;
      best = city;
    }
  }
  return best;
}

export function mapsDirectionsUrl(destination: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function detectCityFromBrowser(): Promise<IndianCity | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(nearestCity(position.coords.latitude, position.coords.longitude));
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30 * 60_000 },
    );
  });
}
