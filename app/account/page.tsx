"use client";

import { useEffect, useState } from "react";
import { readPersonalInfo } from "@/lib/profile";
import { readSession } from "@/lib/session";

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const session = readSession() ?? "";
    setUsername(session);
    setDisplayName(readPersonalInfo(session).displayName);
  }, []);

  const initial = (displayName || username).slice(0, 1).toUpperCase() || "F";

  return (
    <section className="site-card p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-[6px] bg-accent text-xl font-semibold text-ink">
          {initial}
        </span>
        <div>
          <h2 className="text-xl font-semibold">{displayName || username || "Guest"}</h2>
          <p className="mt-1 text-sm text-muted">Signed in as {username || "-"}</p>
        </div>
      </div>
      <p className="mt-6 max-w-xl text-sm leading-6 text-muted">
        This is your diner profile on FlexiDine. Open Personal info to update how we address you. Orders and bookings stay on this device until a live account backend is connected.
      </p>
    </section>
  );
}
