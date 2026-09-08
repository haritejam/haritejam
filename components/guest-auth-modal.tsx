"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLockPageScroll } from "@/lib/use-lock-page-scroll";
import { writePersonalInfo } from "@/lib/profile";
import { writeSession } from "@/lib/session";

interface GuestAuthModalProps {
  onClose: () => void;
  onAuthenticated: (username: string) => void;
}

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function GuestAuthModal({ onClose, onAuthenticated }: GuestAuthModalProps) {
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [issuedOtp, setIssuedOtp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useLockPageScroll(true);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function finish(name: string) {
    writeSession(name);
    onAuthenticated(name);
  }

  function sendOtp() {
    const trimmed = phone.replace(/\D/g, "");
    if (trimmed.length < 10) {
      setError("Enter a 10-digit mobile number.");
      return;
    }
    const next = randomOtp();
    setIssuedOtp(next);
    setError("");
  }

  function handleSignup(event: FormEvent) {
    event.preventDefault();
    if (!issuedOtp) {
      setError("Request an OTP first.");
      return;
    }
    if (otp.trim() !== issuedOtp) {
      setError("That OTP does not match.");
      return;
    }
    const name = username.trim() || `guest-${phone.replace(/\D/g, "").slice(-4)}`;
    writePersonalInfo({
      displayName: name,
      email: "",
      phone: phone.replace(/\D/g, ""),
    });
    finish(name);
  }

  function handleLogin(event: FormEvent) {
    event.preventDefault();
    const name = username.trim();
    if (!name || !password) {
      setError("Enter your username and password.");
      return;
    }
    setError("");
    finish(name);
  }

  return createPortal(
    <div className="booking-gate" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-auth-title"
        className="booking-gate__panel booking-gate__scroll max-h-[min(90vh,40rem)] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="booking-gate__kicker">Account required</p>
        <h2 id="guest-auth-title" className="booking-gate__title">
          Log in to confirm
        </h2>
        <p className="booking-gate__copy">
          Sign up with OTP or log in. We will bring you straight back to this booking.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-[6px] border px-3 py-2 text-sm font-semibold ${
              tab === "signup" ? "border-accent bg-accent/12" : "border-line"
            }`}
            onClick={() => {
              setTab("signup");
              setError("");
            }}
          >
            Sign up with OTP
          </button>
          <button
            type="button"
            className={`rounded-[6px] border px-3 py-2 text-sm font-semibold ${
              tab === "login" ? "border-accent bg-accent/12" : "border-line"
            }`}
            onClick={() => {
              setTab("login");
              setError("");
            }}
          >
            Log in
          </button>
        </div>

        {tab === "signup" ? (
          <form onSubmit={handleSignup} className="mt-5 space-y-3">
            <label className="block text-sm text-muted">
              Mobile number
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1.5 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
                placeholder="10-digit number"
              />
            </label>
            <button type="button" className="booking-gate__stay w-full justify-center" onClick={sendOtp}>
              Send OTP
            </button>
            {issuedOtp ? (
              <p className="rounded-[6px] bg-accent/15 px-3 py-2 text-sm text-foreground">
                Demo OTP: <span className="font-semibold tracking-[0.18em]">{issuedOtp}</span>
              </p>
            ) : null}
            <label className="block text-sm text-muted">
              OTP
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="mt-1.5 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
                placeholder="6-digit code"
              />
            </label>
            <label className="block text-sm text-muted">
              Username <span className="text-muted">(optional)</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1.5 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
              />
            </label>
            {error ? <p className="text-sm text-accent">{error}</p> : null}
            <button type="submit" className="site-btn w-full">
              Verify and continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="mt-5 space-y-3">
            <label className="block text-sm text-muted">
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1.5 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
                autoComplete="username"
              />
            </label>
            <label className="block text-sm text-muted">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
                autoComplete="current-password"
              />
            </label>
            {error ? <p className="text-sm text-accent">{error}</p> : null}
            <button type="submit" className="site-btn w-full">
              Log in and continue
            </button>
          </form>
        )}

        <button type="button" className="booking-gate__stay mt-4 w-full justify-center" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}