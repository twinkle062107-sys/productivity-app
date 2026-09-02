"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: "/sign-in" })}
      className={`rounded-full bg-white/80 px-5 py-2.5 text-xs font-extrabold text-qd-muted shadow-sm transition hover:bg-rose-50 hover:text-rose-500 active:scale-95 ${className ?? ""}`}
    >
      Sign Out
    </button>
  );
}
