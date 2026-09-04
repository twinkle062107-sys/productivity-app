"use client";

import { signOutAction } from "@/lib/actions/auth";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={`rounded-full bg-white/80 px-5 py-2.5 text-xs font-extrabold text-qd-muted shadow-sm transition hover:bg-rose-50 hover:text-rose-500 active:scale-95 ${className ?? ""}`}
      >
        Sign Out
      </button>
    </form>
  );
}
