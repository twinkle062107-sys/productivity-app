import { PhoneFrame } from "@/components/layout/phone-frame";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { DemoSignInButton } from "@/components/auth/demo-sign-in-button";
import { BlobMascot } from "@/components/brand/mascots";
import Link from "next/link";

function getErrorMessage(errorCode?: string): string | null {
  if (!errorCode) return null;
  switch (errorCode) {
    case "OAuthSignin":
    case "OAuthCallbackError":
      return "Google sign-in was canceled or encountered an issue. You can try again or use Instant Play.";
    case "AccessDenied":
      return "Access was denied by Google. Please check your account permissions or use Instant Play.";
    case "Configuration":
      return "OAuth configuration issue. You can sign in immediately using Instant Play below.";
    default:
      return "Sign-in failed. Please try again or continue with the Demo Hero account.";
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error: oauthError } = await searchParams;
  const errorMessage = getErrorMessage(oauthError);

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
          {errorMessage && (
            <div className="rounded-xl bg-rose-100 p-3 text-xs font-bold text-rose-700">
              {errorMessage}
            </div>
          )}

          <DemoSignInButton callbackUrl={callbackUrl} />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/80" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-qd-muted">
              or
            </span>
            <div className="h-px flex-1 bg-white/80" />
          </div>

          <GoogleSignInButton callbackUrl={callbackUrl} />

          <p className="text-center text-[11px] font-bold leading-relaxed text-qd-muted">
            Signing in creates your hero account and seeds your daily starter quests automatically.
          </p>
        </div>

        <Link href="/" className="mt-5 text-center text-sm font-bold text-qd-lavender">
          Back to home
        </Link>
      </div>
    </PhoneFrame>
  );
}

