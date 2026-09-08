"use client";

import { usePathname } from "next/navigation";
import { DinerBottomLiveBar } from "@/components/diner-bottom-live-bar";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { isRestaurantDeskPath } from "@/components/partner-leave-dialog";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const desk =
    isRestaurantDeskPath(pathname) || pathname.startsWith("/partner/admin");

  if (desk) {
    return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
  }

  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <DinerBottomLiveBar />
    </>
  );
}
