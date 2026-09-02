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
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (mode === "forgot") {
      setSubmitted(true);
      setError("");
      return;
    }

    if (!username) {
      return;
    }

    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    writeSession(username);
    router.push("/");
  }

  const title = mode === "login" ? "Log in" : mode === "signup" ? "Create an account" : "Reset your password";

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-6 py-20">
      <div className="site-card w-full max-w-[420px] p-8">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.16em] text-accent hover:brightness-110">
          FlexiDine
        </Link>
        <h1 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.035em] leading-tight">{title}</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm text-muted">
            Username
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="mt-1.5 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
            />
          </label>
          {mode !== "forgot" && (
            <label className="block text-sm text-muted">
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="mt-1.5 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
              />
            </label>
          )}
          {mode === "signup" && (
            <label className="block text-sm text-muted">
              Confirm password
              <input
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
              />
            </label>
          )}
          {error ? <p className="text-sm text-accent">{error}</p> : null}
          <button type="submit" className="site-btn w-full">
            {mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send reset link"}
          </button>
        </form>
        {submitted && mode === "forgot" && (
          <p className="mt-4 text-sm text-muted">If this account exists, a reset link has been sent.</p>
        )}
        {mode === "login" && (
          <div className="mt-6 flex flex-col gap-2 text-sm">
            <Link href="/signup" className="text-accent hover:brightness-110">
              Sign up
            </Link>
            <Link href="/forgot-password" className="text-muted hover:text-foreground">
              Forgot password
            </Link>
          </div>
        )}
        {mode !== "login" && (
          <Link href="/login" className="mt-6 inline-block text-sm text-accent hover:brightness-110">
            Back to log in
          </Link>
        )}
      </div>
    </div>
  );
}
