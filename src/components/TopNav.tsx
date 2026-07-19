"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSessionAddress, getWalletMode, type WalletMode } from "@/lib/genlayer/client";
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
  const [mode, setMode] = useState<WalletMode>("session");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setAddr(getSessionAddress());
    setMode(getWalletMode());
  }, []);

  const modeLabel = mode === "external" ? "wallet" : "session key";

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
            <Link
              href="/settings"
              className="hidden items-center gap-2 font-mono-ev text-ink-faint hover:text-ink sm:inline-flex"
              title={`StudioNet ${modeLabel}`}
            >
              <span className="text-xs">{shortAddress(addr)}</span>
            </Link>
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
