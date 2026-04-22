"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/upcoming", label: "Upcoming" },
  { href: "/dashboard/scout", label: "Scout" },
  { href: "/dashboard/schedule", label: "Schedule" },
];

export default function NavTabs() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      role="tablist"
      aria-label="Dashboard sections"
      className="flex border border-line self-start"
    >
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            role="tab"
            aria-selected={active}
            className={`px-4 py-2 text-xs uppercase tracking-widest border-r border-line last:border-r-0 transition-colors ${
              active
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-fg hover:bg-subtle"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
