"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { readSession } from "@/lib/session";

const links = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/personal", label: "Personal info" },
  { href: "/account/bookings", label: "Bookings history" },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!readSession()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="site-wrap py-16 text-sm text-muted">Checking your session…</div>;
  }

  return (
    <div className="site-wrap py-12">
      <h1 className="text-[1.75rem] font-semibold tracking-[-0.035em]">Your account</h1>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Account">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`site-chip px-4 py-2 ${active ? "is-on" : "hover:text-foreground"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-10">{children}</div>
    </div>
  );
}
