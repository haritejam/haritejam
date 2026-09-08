"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/icons";
import {
  hasKitchenClientSession,
  isRestaurantDeskPath,
  leaveKitchenClient,
  PartnerLeaveDialog,
} from "@/components/partner-leave-dialog";
import { emitPartnerHome } from "@/lib/partner-ops";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Restaurants", href: "/restaurants" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "FlexiSwitch", href: "/#flexiswitch" },
    ],
  },
  {
    title: "For diners",
    links: [
      { label: "Reserve a table", href: "/restaurants?intent=reserve" },
      { label: "Order for pickup", href: "/restaurants?intent=pickup" },
      { label: "Delivery", href: "/restaurants?intent=delivery" },
      { label: "Log In", href: "/login" },
    ],
  },
  {
    title: "For partners",
    links: [
      { label: "Onboard restaurants", href: "/partner/register" },
      { label: "Learn more", href: "/#for-partners" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/#about" },
      { label: "Help center", href: "#sign-in" },
      { label: "Privacy", href: "#sign-in" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const partnerChrome = pathname.startsWith("/partner");
  const onOnboarding = pathname.startsWith("/partner/register");
  const onDesk = isRestaurantDeskPath(pathname);
  const [leaveOpen, setLeaveOpen] = useState(false);

  return (
    <footer className="border-t border-line bg-background text-foreground" data-header-skin="canvas">
      <PartnerLeaveDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => {
          leaveKitchenClient();
          setLeaveOpen(false);
          router.replace("/partner/register");
        }}
      />
      <div className="site-wrap site-section">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.4fr_0.9fr]">
          <div>
            <Link
              href={partnerChrome ? "/partner/register" : "/"}
              className="inline-flex items-center gap-2.5"
              aria-label={partnerChrome ? "Restaurant onboarding" : "FlexiDine home"}
              onClick={(event) => {
                if (!partnerChrome) {
                  return;
                }
                event.preventDefault();
                if (onDesk && hasKitchenClientSession()) {
                  setLeaveOpen(true);
                  return;
                }
                emitPartnerHome();
                if (!onOnboarding) {
                  router.replace("/partner/register");
                }
              }}
            >
              <BrandMark className="h-8 w-9 text-accent" />
              <span className="text-[1.05rem] font-semibold tracking-[-0.03em]">FlexiDine</span>
            </Link>
            <p className="mt-4 max-w-[260px] text-[1.05rem] leading-7 text-muted">
              Reserve. Pre-order. Dine or pickup, on your clock.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{column.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-muted hover:text-foreground">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <form id="sign-in" className="site-card p-5" onSubmit={(event) => event.preventDefault()}>
            <p className="text-sm font-semibold">Stay in the loop</p>
            <p className="mt-1 text-xs text-muted">New restaurants and offers, once a week.</p>
            <label className="mt-4 flex overflow-hidden rounded-[6px] border border-line">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted"
              />
              <button type="submit" className="bg-accent px-4 text-sm font-semibold text-ink">
                Join
              </button>
            </label>
          </form>
        </div>
        <p className="mt-12 text-[11px] text-muted">© 2026 FlexiDine. All rights reserved.</p>
      </div>
    </footer>
  );
}
