import { PhoneFrame } from "@/components/layout/phone-frame";
import { GradientButton } from "@/components/brand/gradient-button";
import Link from "next/link";

export default function SignInPage() {
  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-3xl font-extrabold text-qd-ink">Welcome back</h1>
        <p className="mt-2 text-qd-muted">Auth ships in the next slice. This is a visual stub.</p>
        <div className="qd-glass mt-8 space-y-4 rounded-[2rem] p-6">
          <div className="h-12 rounded-full bg-white/80" />
          <div className="h-12 rounded-full bg-white/80" />
        </div>
        <div className="mt-6">
          <GradientButton href="/dashboard">Continue (preview)</GradientButton>
        </div>
        <Link href="/" className="mt-5 text-center text-sm font-bold text-qd-lavender">
          Back to home
        </Link>
      </div>
    </PhoneFrame>
  );
}
