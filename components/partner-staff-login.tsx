"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CATALOG_KITCHEN_PASSWORD,
  loginAdmin,
  loginKitchen,
} from "@/lib/partner-ops";
import { useLockPageScroll } from "@/lib/use-lock-page-scroll";

const fieldClass =
  "mt-1.5 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent";

export type StaffGate = "admin" | "kitchen";

export function hashToStaffGate(hash: string): StaffGate | null {
  if (hash === "#admin-login") {
    return "admin";
  }
  if (hash === "#restaurant-login") {
    return "kitchen";
  }
  return null;
}

interface PartnerStaffLoginProps {
  gate: StaffGate | null;
  onClose: () => void;
}

export function PartnerStaffLogin({ gate, onClose }: PartnerStaffLoginProps) {
  const [error, setError] = useState("");
  useLockPageScroll(Boolean(gate));

  useEffect(() => {
    setError("");
  }, [gate]);

  useEffect(() => {
    if (!gate) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gate, onClose]);

  if (!gate || typeof document === "undefined") {
    return null;
  }

  const admin = gate === "admin";

  function onAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = loginAdmin(String(form.get("name") ?? ""), String(form.get("password") ?? ""));
    if (!ok) {
      setError("Admin name or password is not correct.");
      return;
    }
    window.location.assign("/partner/admin");
  }

  function onKitchen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const account = loginKitchen(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
    if (!account) {
      setError("Kitchen username or password is not correct.");
      return;
    }
    window.location.assign("/partner/dashboard");
  }

  return createPortal(
    <div className="booking-gate" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-login-title"
        className="site-card w-[min(26rem,100%)] p-6 shadow-[0_18px_48px_rgba(20,28,30,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="booking-gate__kicker">{admin ? "FlexiDine admin" : "Restaurant desk"}</p>
        <h2 id="staff-login-title" className="booking-gate__title">
          {admin ? "Admin login" : "Restaurant login"}
        </h2>
        <p className="booking-gate__copy">
          {admin
            ? "Sign in to review onboarding, approve a kitchen, and put it on the diner app."
            : `Existing kitchens use the restaurant id as username and password ${CATALOG_KITCHEN_PASSWORD}. Newly approved kitchens use the emailed login.`}
        </p>
        {admin ? (
          <form className="mt-6 space-y-4" onSubmit={onAdmin}>
            <label className="block text-sm text-muted">
              Name
              <input className={fieldClass} name="name" autoComplete="username" required />
            </label>
            <label className="block text-sm text-muted">
              Password
              <input className={fieldClass} name="password" type="password" autoComplete="current-password" required />
            </label>
            {error ? <p className="text-sm text-accent">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="site-btn">
                Admin login
              </button>
              <button type="button" className="booking-gate__stay" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onKitchen}>
            <label className="block text-sm text-muted">
              Username
              <input className={fieldClass} name="username" autoComplete="username" required />
            </label>
            <label className="block text-sm text-muted">
              Password
              <input className={fieldClass} name="password" type="password" autoComplete="current-password" required />
            </label>
            {error ? <p className="text-sm text-accent">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="site-btn">
                Restaurant login
              </button>
              <button type="button" className="booking-gate__stay" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
