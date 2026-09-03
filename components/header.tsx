"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark, ChevronDown, CloseIcon, LocationPin, MenuIcon } from "@/components/icons";
import { indianCities, type IndianCity } from "@/lib/cities";
import { readPersonalInfo } from "@/lib/profile";
import { AUTH_EVENT, clearSession, readSession } from "@/lib/session";
import { emitPartnerHome, PARTNER_FLOW_EVENT } from "@/lib/partner-ops";
import { useHeaderSkin } from "@/lib/use-header-skin";

const navItems = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Restaurants", href: "/restaurants" },
  { label: "For Partners", href: "/#for-partners" },
  { label: "FlexiSwitch", href: "/#flexiswitch" },
  { label: "About Us", href: "/#about" },
];

const accountLinks = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/personal", label: "Personal info" },
  { href: "/account/bookings", label: "Bookings history" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "FD";
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [city, setCity] = useState<IndianCity>("Mumbai");
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const cityRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const partnerChrome = pathname.startsWith("/partner");
  const [fillingOnboarding, setFillingOnboarding] = useState(false);
  const [staffHash, setStaffHash] = useState("");
  const { skin, headerRef } = useHeaderSkin();
  const dark = skin === "dark";

  useEffect(() => {
    const sync = () => {
      const session = readSession();
      setUsername(session);
      setDisplayName(session ? readPersonalInfo(session).displayName : "");
    };
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (cityRef.current && !cityRef.current.contains(target)) {
        setIsCityOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    function onFlow(event: Event) {
      const filling = Boolean((event as CustomEvent<{ filling?: boolean }>).detail?.filling);
      setFillingOnboarding(filling);
    }
    window.addEventListener(PARTNER_FLOW_EVENT, onFlow);
    return () => window.removeEventListener(PARTNER_FLOW_EVENT, onFlow);
  }, []);

  useEffect(() => {
    function readHash() {
      setStaffHash(window.location.hash);
    }
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [pathname]);

  const closeMenu = () => setIsMenuOpen(false);
  const partnerWork =
    pathname === "/partner/admin" ||
    pathname === "/partner/kitchen" ||
    fillingOnboarding ||
    staffHash === "#admin-login" ||
    staffHash === "#restaurant-login";
  const logoHref = partnerWork ? "/partner/register" : "/";
  const label = displayName || username || "";
  const barClass = dark
    ? "border-white/10 bg-[#0f0e0c]/95 text-[#f4efe6]"
    : skin === "surface"
      ? "border-line bg-surface/95 text-foreground"
      : "border-line bg-background/95 text-foreground";
  const lineClass = dark ? "border-white/10" : "border-line";
  const chipClass = dark ? "border-white/15 bg-white/5" : "border-line bg-black/[0.03]";
  const mutedClass = dark ? "text-[#f4efe6]/70" : "text-muted";
  const inkClass = dark ? "text-[#f4efe6]" : "text-foreground";
  const markClass = dark ? "text-[#d4a574]" : "text-accent";

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-200 ${barClass}`}
    >
      <div className="site-wrap flex h-[72px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative" ref={cityRef}>
            <button
              type="button"
              suppressHydrationWarning
              className={`flex items-center gap-2 rounded-[6px] border px-3 py-2 text-sm font-medium ${chipClass}`}
              aria-label={`Select city, currently ${city}`}
              aria-expanded={isCityOpen}
              onClick={() => setIsCityOpen((open) => !open)}
            >
              <LocationPin className={`h-4 w-4 ${markClass}`} />
              <span>{city}</span>
              <ChevronDown className={`h-3.5 w-3.5 ${mutedClass}`} />
            </button>
            {isCityOpen && (
              <ul className={`absolute left-0 top-[calc(100%+8px)] z-50 max-h-72 w-48 overflow-auto rounded-[6px] border py-2 shadow-[0_16px_40px_rgba(0,0,0,0.4)] ${dark ? "border-white/10 bg-[#1a140c]" : "border-line bg-surface"}`}>
                {indianCities.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      suppressHydrationWarning
                      className={`w-full px-4 py-2 text-left text-sm ${dark ? "hover:bg-white/10" : "hover:bg-black/5"} ${option === city ? markClass : inkClass}`}
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

          <Link
            href={logoHref}
            className={`flex min-w-0 items-center gap-2 ${inkClass}`}
            aria-label={partnerWork ? "Back to restaurant onboarding" : "FlexiDine home"}
            onClick={() => {
              setIsMenuOpen(false);
              setIsAccountOpen(false);
              setIsCityOpen(false);
              if (partnerWork) {
                emitPartnerHome();
              }
            }}
          >
            <BrandMark className={`h-7 w-8 shrink-0 ${markClass}`} />
            <span className="truncate text-[1.05rem] font-semibold tracking-[-0.03em]">FlexiDine</span>
          </Link>
        </div>

        {!partnerChrome ? (
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-[0.9375rem] font-medium tracking-[-0.015em] transition-colors ${mutedClass} ${dark ? "hover:text-[#f4efe6]" : "hover:text-foreground"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-3">
          {partnerChrome ? (
            <div className="hidden items-center gap-3 sm:flex">
              <a
                href="/partner/register#admin-login"
                className={`px-3 py-2 text-sm font-medium ${mutedClass} ${dark ? "hover:text-[#f4efe6]" : "hover:text-foreground"}`}
              >
                Admin login
              </a>
              <a href="/partner/register#restaurant-login" className="site-btn">
                Restaurant login
              </a>
            </div>
          ) : username ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                suppressHydrationWarning
                className={`flex max-w-[220px] items-center gap-2 rounded-[6px] border py-1 pl-1 pr-3 ${chipClass}`}
                aria-expanded={isAccountOpen}
                aria-haspopup="menu"
                onClick={() => setIsAccountOpen((open) => !open)}
              >
                <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-accent text-xs font-semibold text-ink">
                  {initials(label)}
                </span>
                <span className={`hidden max-w-[120px] truncate text-sm font-medium sm:inline ${markClass}`}>{label}</span>
                <ChevronDown className={`hidden h-3.5 w-3.5 sm:block ${mutedClass}`} />
              </button>
              {isAccountOpen && (
                <ul
                  role="menu"
                  className={`absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-[6px] border py-1 shadow-[0_16px_40px_rgba(0,0,0,0.4)] ${dark ? "border-white/10 bg-[#1a140c]" : "border-line bg-surface"}`}
                >
                  {accountLinks.map((link) => (
                    <li key={link.href} role="none">
                      <Link
                        role="menuitem"
                        href={link.href}
                        className={`block px-4 py-2.5 text-sm ${inkClass} ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                        onClick={() => setIsAccountOpen(false)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  <li role="none" className={`mt-1 border-t ${lineClass}`}>
                    <button
                      type="button"
                      role="menuitem"
                      suppressHydrationWarning
                      className={`w-full px-4 py-2.5 text-left text-sm ${mutedClass} ${dark ? "hover:bg-white/10 hover:text-[#f4efe6]" : "hover:bg-black/5 hover:text-foreground"}`}
                      onClick={() => {
                        clearSession();
                        setIsAccountOpen(false);
                      }}
                    >
                      Log out
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <Link href="/login" className={`px-3 py-2 text-sm font-medium ${mutedClass} ${dark ? "hover:text-[#f4efe6]" : "hover:text-foreground"}`}>
                Log In
              </Link>
              <Link href="/signup" className="site-btn">
                Sign Up
              </Link>
            </div>
          )}

          <button
            type="button"
            suppressHydrationWarning
            className={`-mr-2 grid h-10 w-10 place-items-center ${partnerChrome ? "sm:hidden" : "lg:hidden"}`}
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div id="mobile-menu" className={`border-t px-6 py-5 ${partnerChrome ? "sm:hidden" : "lg:hidden"} ${lineClass} ${dark ? "bg-[#0f0e0c]" : "bg-background"}`}>
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {partnerChrome ? (
              <>
                <a href="/partner/register#admin-login" onClick={closeMenu} className={`border-b py-4 text-base font-medium ${lineClass}`}>
                  Admin login
                </a>
                <a href="/partner/register#restaurant-login" onClick={closeMenu} className="site-btn mt-4 w-full">
                  Restaurant login
                </a>
              </>
            ) : (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeMenu}
                    className={`border-b py-4 text-base font-medium ${lineClass}`}
                  >
                    {item.label}
                  </Link>
                ))}
                {!username ? (
                  <>
                    <Link href="/login" onClick={closeMenu} className="py-4 text-base">
                      Log In
                    </Link>
                    <Link href="/signup" onClick={closeMenu} className="site-btn w-full">
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <>
                    {accountLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMenu}
                        className={`border-b py-4 text-base font-medium ${lineClass}`}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => {
                        clearSession();
                        closeMenu();
                      }}
                      className="py-4 text-left text-base"
                    >
                      Log out
                    </button>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
