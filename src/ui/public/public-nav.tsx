"use client";

import { Bookmark, CalendarDays, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Agenda", Icon: CalendarDays },
  { href: "/salvos", label: "Salvos", Icon: Bookmark },
  { href: "/privacidade", label: "Privacidade", Icon: ShieldCheck },
] as const;

/** Top links on large screens, bottom tab bar on phones (same items, two placements). */
export function PublicNav({ placement }: { placement: "top" | "bottom" }) {
  const pathname = usePathname();
  return (
    <nav
      className={`public-nav public-nav--${placement}`}
      aria-label={placement === "top" ? "Principal" : "Atalhos"}
    >
      <ul>
        {ITEMS.map(({ href, label, Icon }) => {
          const current =
            href === "/" ? pathname === "/" || pathname.startsWith("/eventos") : pathname === href;
          return (
            <li key={href}>
              <Link href={href} aria-current={current ? "page" : undefined}>
                <Icon size={placement === "bottom" ? 22 : 18} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
