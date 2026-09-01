import { GradientButton } from "@/components/brand/gradient-button";
import { HeroStationary } from "@/components/brand/mascots";
import { PhoneFrame } from "@/components/layout/phone-frame";
import Link from "next/link";

export default function LandingPage() {
  return (
    <PhoneFrame>
      <header className="text-center">
        <p className="text-3xl font-extrabold tracking-tight text-qd-ink">
          Quest<span className="text-qd-lavender">Daily</span>
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center">
        <HeroStationary className="h-64 w-64" />
        <h1 className="mt-2 max-w-xs text-center text-[1.65rem] font-extrabold leading-snug text-qd-ink">
          Focus. Plan. Achieve.
          <span className="mt-1 block text-lg font-semibold text-qd-muted">
            The best version of you.
          </span>
        </h1>
      </div>

      <div className="space-y-4">
        <GradientButton href="/dashboard">Get Started</GradientButton>
        <p className="text-center text-sm text-qd-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-bold text-qd-lavender">
            Login
          </Link>
        </p>
      </div>
    </PhoneFrame>
  );
}
