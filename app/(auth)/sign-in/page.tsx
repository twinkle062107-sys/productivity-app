import { PhoneFrame } from "@/components/layout/phone-frame";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { BlobMascot } from "@/components/brand/mascots";
import Link from "next/link";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error: oauthError } = await searchParams;

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex flex-col items-center">
          <BlobMascot className="h-16 w-16" />
          <h1 className="mt-4 text-3xl font-extrabold text-qd-ink">
            Welcome back
          </h1>
          <p className="mt-2 text-qd-muted">
            Sign in to continue your quests
          </p>
        </div>

        <div className="qd-glass mt-8 space-y-4 rounded-[2rem] p-6">
          {oauthError && (
            <div className="rounded-xl bg-rose-100 p-2.5 text-xs font-bold text-rose-700">
              Sign-in failed. Please try again.
            </div>
          )}
          <GoogleSignInButton callbackUrl={callbackUrl} />
          <p className="text-center text-[11px] font-bold leading-relaxed text-qd-muted">
            New to QuestDaily? Signing in with Google creates your hero account
            and seeds your first quests automatically.
          </p>
        </div>

        <Link href="/" className="mt-5 text-center text-sm font-bold text-qd-lavender">
          Back to home
        </Link>
      </div>
    </PhoneFrame>
  );
}
