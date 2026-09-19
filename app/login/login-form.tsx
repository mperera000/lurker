"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { PillButton } from "@/components/be-nosy/pill-button";

export function LoginForm({
  configured,
  errorMessage,
  callbackUrl,
  mode,
}: {
  configured: boolean;
  errorMessage: string | null;
  callbackUrl: string;
  mode: "signin" | "signup";
}) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(errorMessage);

  async function signInWithEmail() {
    setLocalError(null);
    setBusy(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setBusy(false);
    if (result?.error) {
      setLocalError(
        "Email or password is wrong. Try again, or create an account.",
      );
      return;
    }
    window.location.href = result?.url || callbackUrl;
  }

  async function createAccount() {
    setLocalError(null);
    setBusy(true);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!response.ok) {
      setBusy(false);
      setLocalError(data.error ?? "Could not create the account. Try again.");
      return;
    }
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setBusy(false);
    if (result?.error) {
      setLocalError("Account created. Sign in with the same email and password.");
      return;
    }
    window.location.href = result?.url || callbackUrl;
  }

  return (
    <div className="relative h-svh overflow-hidden bg-white text-black">
      <Link
        href="/"
        className="absolute left-6 top-6 z-20 font-be-display text-xl tracking-[-0.02em] text-black"
      >
        Lurk
      </Link>
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/be-nosy/signin-mascot.jpeg"
          alt=""
          className="absolute left-1/2 top-1/2 h-svh w-auto max-w-none"
          style={{ transform: "translate(-65.36%, -50%)" }}
        />
        <div
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-black"
        />
      </div>
      <div className="flex h-svh flex-col items-center justify-center px-6 lg:absolute lg:inset-y-0 lg:left-1/2 lg:right-0 lg:px-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/be-nosy/signin-mascot.jpeg"
          alt=""
          className="mb-8 h-auto w-40 lg:hidden"
        />
        <div className="flex w-full max-w-[26rem] flex-col items-stretch">
          <h1 className="text-center font-be-mono text-[clamp(2.5rem,5vw,3.875rem)] tracking-[-0.02em]">
            {isSignup ? "Sign Up" : "Sign In"}
          </h1>
          {localError ? (
            <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {localError}
            </p>
          ) : null}
          {configured ? (
            <form
              className="mt-10 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void (isSignup ? createAccount() : signInWithEmail());
              }}
            >
              <label
                htmlFor="email"
                className="text-left font-be-mono text-[clamp(1.1rem,2vw,1.5rem)] tracking-[-0.02em]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-[54px] w-full rounded-[23px] bg-[#d9d9d9] px-4 font-be-mono text-lg text-black outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-black"
              />
              <label
                htmlFor="password"
                className="text-left font-be-mono text-[clamp(1.1rem,2vw,1.5rem)] tracking-[-0.02em]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="h-[54px] w-full rounded-[23px] bg-[#d9d9d9] px-4 font-be-mono text-lg text-black outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-black"
              />
              <div className="col-span-2 flex flex-col items-center gap-4 pt-6">
                {isSignup ? (
                  <PillButton type="submit" disabled={busy}>
                    {busy ? "Creating…" : "Sign Up"}
                  </PillButton>
                ) : (
                  <button type="submit" className="sr-only" disabled={busy}>
                    Sign In
                  </button>
                )}
                {busy && !isSignup ? (
                  <p className="font-be-mono text-sm text-black/70">Signing in…</p>
                ) : null}
                <Link
                  href={isSignup ? "/login" : "/login?mode=signup"}
                  className="font-be-mono text-sm text-black/70 underline-offset-4 hover:underline"
                >
                  {isSignup
                    ? "Already have an account? Sign in"
                    : "Need an account? Sign up"}
                </Link>
              </div>
            </form>
          ) : (
            <p className="mt-10 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              Login is not set up yet. Add <code>AUTH_SECRET</code> to{" "}
              <code>.env.local</code>, then restart the app.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
