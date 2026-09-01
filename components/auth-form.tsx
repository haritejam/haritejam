"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { writeSession } from "@/lib/session";

interface AuthFormProps {
  mode: "login" | "signup" | "forgot";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim();

    if (mode === "forgot") {
      setSubmitted(true);
      return;
    }

    if (!username) {
      return;
    }

    writeSession(username);
    router.push("/");
  }

  const title = mode === "login" ? "Log in" : mode === "signup" ? "Create an account" : "Reset your password";

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#14110e] px-5 py-16">
      <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#1c1814] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4af7a]">FlexiDine</p>
        <h1 className="mt-3 text-2xl font-semibold text-[#f4efe6]">{title}</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm text-white/60">
            Username
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#14110e] px-3 py-2.5 text-white outline-none focus:border-[#d4af7a]"
            />
          </label>
          {mode !== "forgot" && (
            <label className="block text-sm text-white/60">
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#14110e] px-3 py-2.5 text-white outline-none focus:border-[#d4af7a]"
              />
            </label>
          )}
          {mode === "signup" && (
            <label className="block text-sm text-white/60">
              Confirm password
              <input
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#14110e] px-3 py-2.5 text-white outline-none focus:border-[#d4af7a]"
              />
            </label>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-[#d4af7a] py-3 text-sm font-semibold text-[#1a140c] hover:bg-[#e0c08c]"
          >
            {mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send reset link"}
          </button>
        </form>
        {submitted && mode === "forgot" && (
          <p className="mt-4 text-sm text-[#e8d2b4]">If this account exists, a reset link has been sent.</p>
        )}
        {mode === "login" && (
          <div className="mt-6 flex flex-col gap-2 text-sm">
            <Link href="/signup" className="text-[#d4af7a] hover:text-[#e6c49a]">
              Sign up
            </Link>
            <Link href="/forgot-password" className="text-white/55 hover:text-white">
              Forgot password
            </Link>
          </div>
        )}
        {mode !== "login" && (
          <Link href="/login" className="mt-6 inline-block text-sm text-[#d4af7a] hover:text-[#e6c49a]">
            Back to log in
          </Link>
        )}
      </div>
    </div>
  );
}
