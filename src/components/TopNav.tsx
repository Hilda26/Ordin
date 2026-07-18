"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSessionAddress } from "@/lib/genlayer/client";
import { shortAddress } from "@/lib/format";

const LINKS = [
  { href: "/bounties", label: "Directory" },
  { href: "/creator", label: "Creator desk" },
  { href: "/contributor", label: "Contributor desk" },
  { href: "/resolver", label: "Resolver" },
  { href: "/settings", label: "Settings" },
];

export function TopNav() {
  const pathname = usePathname();
  const [addr, setAddr] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => setAddr(getSessionAddress()), []);

  return (
    <header className="rule-top border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-6 px-4 py-4">
        <div className="flex items-baseline gap-8">
          <Link href="/" className="font-display text-2xl tracking-tight">
            Ordin<span className="text-oxblood">.</span>
          </Link>
          <nav className="hidden gap-6 md:flex" aria-label="primary">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm tracking-wide ${
                  pathname?.startsWith(l.href)
                    ? "text-oxblood underline underline-offset-8 decoration-2"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {addr ? (
            <span className="hidden font-mono-ev text-ink-faint sm:inline" title="StudioNet session key">
              {shortAddress(addr)}
            </span>
          ) : null}
          <button
            className="md:hidden"
            aria-label="menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-rule px-4 py-2 md:hidden" aria-label="mobile">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
