"use client";

import { BlobMascot } from "@/components/brand/mascots";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="qd-glass flex flex-col items-center rounded-[2rem] p-8">
        <BlobMascot className="h-20 w-20 opacity-60" />
        <h2 className="mt-4 text-lg font-extrabold text-qd-ink">
          Something went wrong
        </h2>
        <p className="mt-2 max-w-xs text-sm text-qd-muted">
          An unexpected error occurred. Don&apos;t worry, your data is safe.
        </p>
        <button
          type="button"
          onClick={reset}
          className="qd-cta mt-5 rounded-full px-6 py-2.5 text-sm font-extrabold text-white shadow-lg transition active:scale-[0.97]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
