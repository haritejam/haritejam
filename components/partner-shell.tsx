"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Calendar,
  ChefHat,
  ClipboardList,
  Grid3X3,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import { clearKitchenSession, readKitchenSession, type KitchenAccount } from "@/lib/partner-ops";

type NavRoute =
  | "dashboard"
  | "orders"
  | "reservations"
  | "tables"
  | "kitchen"
  | "settings";

const NAV_ITEMS: { id: NavRoute; label: string; href: string; Icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", href: "/partner/dashboard", Icon: LayoutDashboard },
  { id: "orders", label: "Orders", href: "/partner/orders", Icon: ClipboardList },
  { id: "reservations", label: "Reservations", href: "/partner/reservations", Icon: Calendar },
  { id: "tables", label: "Tables", href: "/partner/tables", Icon: Grid3X3 },
  { id: "kitchen", label: "Kitchen", href: "/partner/kitchen", Icon: ChefHat },
  { id: "settings", label: "Settings", href: "/partner/settings", Icon: Settings },
];

interface PartnerShellProps {
  children: React.ReactNode;
  activeRoute?: NavRoute;
}

export function PartnerShell({ children, activeRoute }: PartnerShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [account, setAccount] = useState<KitchenAccount | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const session = readKitchenSession();
    if (!session) {
      router.replace("/partner/register#restaurant-login");
      return;
    }
    setAccount(session);
  }, [router]);

  function handleLogout() {
    clearKitchenSession();
    router.replace("/partner/register");
  }

  const active = activeRoute ?? (NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.id ?? "orders");

  if (!account) return null;

  return (
    <div className="flex min-h-dvh bg-[var(--background)]">
      {/* ── Sidebar (desktop ≥1024px) ─────────────────── */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-[220px] lg:shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40"
        style={{ background: "#0a2e33" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <span className="text-[0.95rem] font-semibold tracking-[-0.02em] text-[#e8f4f5]">
            FlexiDine
          </span>
        </div>

        {/* Restaurant identity */}
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Restaurant
          </p>
          <p className="mt-1 text-[0.875rem] font-medium text-[#e8f4f5] truncate">
            {account.restaurantName}
          </p>
          <p className="text-[0.75rem] text-white/40 truncate">{account.restaurantId}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ id, label, href, Icon }) => {
              const isActive = active === id;
              return (
                <li key={id}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-[0.875rem] font-medium transition-colors ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-white/60 hover:bg-white/8 hover:text-white/90"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-[6px] text-[0.875rem] font-medium text-white/50 hover:bg-white/8 hover:text-white/80 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Tablet top bar (640–1023px) ────────────────── */}
      <div
        className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 border-b border-[var(--line)]"
        style={{ background: "#0a2e33" }}
      >
        <span className="text-[0.9rem] font-semibold text-[#e8f4f5]">
          {account.restaurantName}
        </span>
        <button
          type="button"
          onClick={() => setMobileNavOpen((o) => !o)}
          className="text-white/70 hover:text-white p-1"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileNavOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Tablet dropdown nav */}
      {mobileNavOpen && (
        <div
          className="lg:hidden fixed top-14 inset-x-0 z-30 border-b border-white/10 shadow-lg"
          style={{ background: "#0a2e33" }}
        >
          <nav className="px-3 py-3">
            <ul className="space-y-0.5">
              {NAV_ITEMS.map(({ id, label, href, Icon }) => {
                const isActive = active === id;
                return (
                  <li key={id}>
                    <Link
                      href={href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-[0.875rem] font-medium transition-colors ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "text-white/60 hover:bg-white/8 hover:text-white/90"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-2 border-t border-white/10 mt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-[6px] text-[0.875rem] font-medium text-white/50 hover:bg-white/8 hover:text-white/80"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Log out
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* ── Main content ───────────────────────────────── */}
      <main className="flex-1 lg:ml-[220px] pt-14 lg:pt-0 min-h-dvh">
        {children}
      </main>

      {/* ── Mobile bottom nav (<640px) ─────────────────── */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-[var(--line)] bg-[var(--surface)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map(({ id, href, Icon }) => {
          const isActive = active === id;
          return (
            <Link
              key={id}
              href={href}
              className={`flex flex-col items-center justify-center py-2 px-3 text-[10px] font-medium transition-colors ${
                isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
