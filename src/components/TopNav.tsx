"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getConnectedAddress,
  connectWallet,
  disconnectWallet,
  reconnectWallet,
  hasExternalWallet,
} from "@/lib/genlayer/client";
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
  const [addr, setAddr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reconnectWallet().then((a) => {
      if (a) setAddr(a);
      else setAddr(getConnectedAddress());
    });

    const ethereum = (window as any).ethereum;
    if (!ethereum) return;
    const handleChange = (accounts: string[]) => {
      if (accounts.length) {
        setAddr(accounts[0]);
      } else {
        disconnectWallet();
        setAddr(null);
      }
    };
    ethereum.on?.("accountsChanged", handleChange);
    return () => ethereum.removeListener?.("accountsChanged", handleChange);
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const address = await connectWallet();
      setAddr(address);
    } catch (e: any) {
      setError(e.message ?? "Connection failed");
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    disconnectWallet();
    setAddr(null);
    setShowDropdown(false);
  }

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
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 border border-rule bg-card px-3 py-1.5 font-mono-ev text-xs hover:border-ink transition-colors"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-emerald" />
                {shortAddress(addr)}
              </button>
              {showDropdown && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] border border-rule bg-paper shadow-lg">
                  <p className="border-b border-rule px-3 py-2 font-mono-ev text-[10px] text-ink-faint break-all">
                    {addr}
                  </p>
                  <button
                    onClick={handleDisconnect}
                    className="w-full px-3 py-2 text-left text-sm text-verdict-fail hover:bg-paper-deep"
                  >
                    Disconnect wallet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="hidden items-center gap-2 border border-oxblood bg-oxblood px-3 py-1.5 text-xs text-paper hover:bg-oxblood/90 transition-colors sm:inline-flex disabled:opacity-50"
            >
              {connecting ? (
                "Connecting..."
              ) : !hasExternalWallet() ? (
                "Install wallet"
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                  </svg>
                  Connect wallet
                </>
              )}
            </button>
          )}
          {error && (
            <span className="hidden text-[10px] text-verdict-fail sm:inline">{error}</span>
          )}
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
          <div className="border-t border-rule pt-2 pb-1">
            {addr ? (
              <div className="flex items-center justify-between">
                <span className="font-mono-ev text-xs text-ink-faint">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald mr-1" />
                  {shortAddress(addr)}
                </span>
                <button onClick={handleDisconnect} className="text-xs text-verdict-fail">
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full border border-oxblood bg-oxblood px-3 py-1.5 text-xs text-paper"
              >
                {connecting ? "Connecting..." : "Connect wallet"}
              </button>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
