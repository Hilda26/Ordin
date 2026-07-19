"use client";

import { useEffect, useState } from "react";
import { getConnectedAddress } from "@/lib/genlayer/client";
import { getLedgerBalance } from "@/lib/genlayer/reads";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase/client";
import { formatReward } from "@/lib/format";
import { ExplorerLink } from "@/components/ExplorerLink";
import { ORDIN_CONTRACT_ADDRESS, GENLAYER_RPC_URL, GENLAYER_CHAIN_ID } from "@/lib/genlayer/config";

export default function SettingsPage() {
  const [addr, setAddr] = useState<string | null>(null);
  const [ledger, setLedger] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const a = getConnectedAddress();
    setAddr(a);
    if (a) getLedgerBalance(a).then(setLedger).catch(() => setLedger(null));
    const sb = getSupabase();
    if (sb) sb.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="rule-top pt-4">
        <p className="font-mono-ev uppercase tracking-[0.2em] text-ink-faint">Settings</p>
        <h1 className="font-display mt-2 text-3xl">Identity &amp; connection</h1>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Connected wallet</h2>
        {addr ? (
          <>
            <p className="font-mono-ev break-all border border-rule bg-card px-4 py-3">{addr}</p>
            <p className="text-xs text-ink-faint">
              Connected via browser wallet. Manage connection from the button in the navigation bar.
            </p>
            {ledger !== null && (
              <p className="text-sm">
                Ledger credits recorded to this address:{" "}
                <strong className="font-mono-ev">{formatReward(ledger)}</strong>{" "}
                <span className="text-ink-faint">(on-chain ledger entries, not transferable funds)</span>
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-soft">
            No wallet connected. Use the <strong>Connect wallet</strong> button in the
            navigation bar to link your MetaMask or compatible wallet.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Account</h2>
        {!isSupabaseConfigured() ? (
          <p className="text-sm text-ink-soft">
            Account services (profiles, drafts, notifications) are not configured. The
            application runs fully in chain-only mode.
          </p>
        ) : userEmail ? (
          <p className="text-sm">Signed in as <strong>{userEmail}</strong>.</p>
        ) : (
          <p className="text-sm text-ink-soft">Not signed in.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Network</h2>
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-mono-ev uppercase text-ink-faint">Network</dt>
            <dd>GenLayer StudioNet · chain {GENLAYER_CHAIN_ID}</dd>
          </div>
          <div>
            <dt className="font-mono-ev uppercase text-ink-faint">RPC</dt>
            <dd className="font-mono-ev break-all">{GENLAYER_RPC_URL}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-mono-ev uppercase text-ink-faint">Ordin contract</dt>
            <dd>
              {ORDIN_CONTRACT_ADDRESS ? (
                <ExplorerLink kind="address" value={ORDIN_CONTRACT_ADDRESS} label={ORDIN_CONTRACT_ADDRESS} />
              ) : (
                <span className="text-verdict-fail">not configured</span>
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
