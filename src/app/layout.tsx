import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Ordin — independent work verification and settlement",
  description:
    "Publish the standard. Submit the work. Let evidence decide. Ordin reviews bounty submissions through GenLayer consensus over independently fetched public evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">
        <TopNav />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">{children}</main>
        <footer className="border-t border-rule bg-paper-deep">
          <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-4 px-4 py-6 text-sm text-ink-faint">
            <p>
              <span className="font-display text-ink">Ordin</span> · independent work
              verification and settlement · GenLayer StudioNet (chain 61999)
            </p>
            <p className="font-mono-ev">
              rewards on StudioNet are simulated or ledger-recorded — never real funds
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
