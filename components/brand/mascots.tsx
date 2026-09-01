export function BlobMascot({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <defs>
        <linearGradient id="blobFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#8b7cf6" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="72" rx="22" ry="5" fill="#7c6cf6" opacity="0.18" />
      <path
        d="M40 8c16 0 30 14 30 32 0 14-8 24-18 28-4 2-8 4-12 4s-8-2-12-4C18 64 10 54 10 40 10 22 24 8 40 8Z"
        fill="url(#blobFill)"
      />
      <ellipse cx="28" cy="28" rx="10" ry="7" fill="white" opacity="0.35" />
      <circle cx="30" cy="38" r="4.5" fill="#2a2450" />
      <circle cx="50" cy="38" r="4.5" fill="#2a2450" />
      <circle cx="31.5" cy="36.5" r="1.4" fill="white" />
      <circle cx="51.5" cy="36.5" r="1.4" fill="white" />
      <path
        d="M32 50c3 5 13 5 16 0"
        stroke="#2a2450"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="22" cy="46" r="4" fill="#ff8fb3" opacity="0.85" />
      <circle cx="58" cy="46" r="4" fill="#ff8fb3" opacity="0.85" />
    </svg>
  );
}

export function HeroStationary({ className = "h-56 w-56" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 220" className={className} aria-hidden>
      <defs>
        <linearGradient id="cup" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="100%" stopColor="#ddd6fe" />
        </linearGradient>
        <linearGradient id="pen" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c6cf6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="188" rx="70" ry="14" fill="#7c6cf6" opacity="0.12" />
      <rect x="48" y="108" width="124" height="78" rx="28" fill="url(#cup)" />
      <rect x="48" y="108" width="124" height="22" rx="11" fill="white" opacity="0.45" />
      <rect x="92" y="42" width="18" height="90" rx="9" fill="url(#pen)" transform="rotate(-18 101 87)" />
      <rect x="118" y="36" width="16" height="88" rx="8" fill="#ffd56a" transform="rotate(12 126 80)" />
      <rect x="70" y="50" width="14" height="80" rx="7" fill="#ff8fb3" transform="rotate(-8 77 90)" />
      <circle cx="160" cy="78" r="22" fill="#c4b5fd" />
      <circle cx="154" cy="72" r="6" fill="white" opacity="0.5" />
      <circle cx="154" cy="80" r="3" fill="#2a2450" />
      <circle cx="166" cy="80" r="3" fill="#2a2450" />
      <path d="M156 88c4 4 10 4 14 0" stroke="#2a2450" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
