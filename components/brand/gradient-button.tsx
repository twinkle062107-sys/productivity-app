import Link from "next/link";
import type { ReactNode } from "react";

export function GradientButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="qd-cta flex w-full items-center justify-between rounded-full px-6 py-3.5 text-base font-extrabold text-white"
    >
      <span>{children}</span>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
