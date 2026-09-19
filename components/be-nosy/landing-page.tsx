import Link from "next/link";
import { pillClassName } from "@/components/be-nosy/pill-button";

export function LandingPage() {
  return (
    <div className="flex h-svh flex-col overflow-hidden bg-white text-black">
      <header className="flex shrink-0 justify-end gap-5 px-6 pt-8 sm:px-16">
        <Link href="/login" className={pillClassName}>
          Log In
        </Link>
        <Link href="/login?mode=signup" className={pillClassName}>
          Sign Up
        </Link>
      </header>
      <main className="flex min-h-0 flex-1 flex-col items-center px-6 pt-16 text-center sm:pt-20">
        <h1 className="relative z-10 shrink-0 font-be-display text-[clamp(5.5rem,14vw,11rem)] leading-none tracking-[-0.02em]">
          Lurk
        </h1>
        <p className="relative z-10 mt-4 max-w-full shrink-0 px-1 font-be-display text-[clamp(1.15rem,2.3vw,1.85rem)] leading-[1.25]">
          <span className="block whitespace-nowrap">
            Track what launches and features your
          </span>
          <span className="block whitespace-nowrap">
            competition is putting out on&nbsp;X
          </span>
        </p>
        <div className="relative -mt-10 min-h-0 w-full flex-1 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/be-nosy/landing-mascot.png"
            alt=""
            className="absolute bottom-0 left-1/2 h-[calc(100%+2.5rem)] w-auto max-w-none -translate-x-1/2"
          />
        </div>
      </main>
    </div>
  );
}
