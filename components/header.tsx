"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, CloseIcon, LocationPin, MenuIcon } from "@/components/icons";
import { indianCities, type IndianCity } from "@/lib/cities";
import { AUTH_EVENT, clearSession, readSession } from "@/lib/session";

const navItems = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Restaurants", href: "/restaurants" },
  { label: "For Partners", href: "/#for-partners" },
  { label: "FlexiSwitch", href: "/#flexiswitch" },
  { label: "About Us", href: "/#about" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [city, setCity] = useState<IndianCity>("Mumbai");
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setUsername(readSession());
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#14110e]/95 text-white backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1080px] items-center justify-between gap-3 px-5 sm:px-8 lg:px-12">
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium"
            aria-label={`Select city, currently ${city}`}
            aria-expanded={isCityOpen}
            onClick={() => setIsCityOpen((open) => !open)}
          >
            <LocationPin className="h-4 w-4 text-[#d4af7a]" />
            <span>{city}</span>
            <ChevronDown className="h-3.5 w-3.5 text-white/70" />
          </button>
          {isCityOpen && (
            <ul className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-72 w-48 overflow-auto rounded-xl border border-white/10 bg-[#1a1d24] py-2 shadow-xl">
              {indianCities.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 ${option === city ? "text-[#d4af7a]" : "text-white/90"}`}
                    onClick={() => {
                      setCity(option);
                      setIsCityOpen(false);
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-white/75 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {username ? (
            <>
              <span className="max-w-[140px] truncate px-3 py-2 text-sm font-medium text-[#e6c49a]" title={username}>
                {username}
              </span>
              <button
                type="button"
                onClick={() => clearSession()}
                className="text-sm text-white/60 hover:text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-sm font-medium text-white/85 hover:text-white">
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#d4af7a] px-4 py-2 text-sm font-semibold text-[#1a140c] transition-colors hover:bg-[#e0c08c]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="-mr-2 grid h-10 w-10 place-items-center xl:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <div id="mobile-menu" className="border-t border-white/10 bg-[#14110e] px-5 py-5 xl:hidden">
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className="border-b border-white/10 py-4 text-base font-medium"
              >
                {item.label}
              </Link>
            ))}
            {username ? (
              <>
                <p className="border-b border-white/10 py-4 text-base font-medium text-[#e6c49a]">{username}</p>
                <button
                  type="button"
                  onClick={() => {
                    clearSession();
                    closeMenu();
                  }}
                  className="py-4 text-left text-base"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeMenu} className="py-4 text-base">
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="rounded-full bg-[#d4af7a] py-3 text-center text-sm font-semibold text-[#1a140c]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
