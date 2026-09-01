import Link from "next/link";

const tabs = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/quests", label: "Quests", icon: ListIcon },
  { href: "/achievements", label: "Stats", icon: ChartIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function BottomNav({ active }: { active: (typeof tabs)[number]["href"] }) {
  return (
    <nav className="qd-glass sticky bottom-4 z-20 mx-auto mt-auto flex w-full items-center justify-around rounded-full px-2 py-2.5">
      {tabs.map((tab) => {
        const isActive = tab.href === active;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
              isActive ? "bg-qd-lavender text-white shadow-md" : "text-qd-muted"
            }`}
            aria-label={tab.label}
          >
            <Icon />
          </Link>
        );
      })}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3.2 3.5 10.2v10.3h5.5v-6.2h6v6.2h5.5V10.2L12 3.2Z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M8 7h12M8 12h12M8 17h12" strokeLinecap="round" />
      <circle cx="4" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="17" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="4" y="12" width="4" height="8" rx="1.2" />
      <rect x="10" y="7" width="4" height="13" rx="1.2" />
      <rect x="16" y="4" width="4" height="16" rx="1.2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.4-3.4 3.8-5 7-5s5.6 1.6 7 5" />
    </svg>
  );
}
