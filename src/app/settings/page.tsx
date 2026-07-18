"use client";

// Settings — session key, wallet identity, ledger balance, account status.
import { useEffect, useState } from "react";
import { getSessionAddress, resetSessionKey } from "@/lib/genlayer/client";
import { getLedgerBalance } from "@/lib/genlayer/reads";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase/client";
import { formatReward } from "@/lib/format";
import { ExplorerLink } from "@/components/ExplorerLink";
import { ORDIN_CONTRACT_ADDRESS, GENLAYER_RPC_URL, GENLAYER_CHAIN_ID } from "@/lib/genlayer/config";

export default function SettingsPage() {
  const [addr, setAddr] = useState("");
  const [ledger, setLedger] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const a = getSessionAddress();
    setAddr(a);
    getLedgerBalance(a).then(setLedger).catch(() => setLedger(null));
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
        <h2 className="font-display text-xl">StudioNet session key</h2>
        <p className="text-sm text-ink-soft">
          Your on-chain identity is a locally generated key held in this browser. StudioNet is
          gasless, so it needs no funds. It signs bounties, submissions, appeals and claims.
        </p>
        <p className="font-mono-ev break-all border border-rule bg-card px-4 py-3">{addr || "…"}</p>
        {ledger !== null ? (
          <p className="text-sm">
            Ledger credits recorded to this address:{" "}
            <strong className="font-mono-ev">{formatReward(ledger)}</strong>{" "}
            <span className="text-ink-faint">(on-chain ledger entries, not transferable funds)</span>
          </p>
        ) : null}
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="border border-ink px-4 py-2 text-sm hover:bg-paper-deep">
            Generate a new session key…
          </button>
        ) : (
          <div className="border border-verdict-fail/40 bg-card p-4 text-sm">
            <p>
              Generating a new key permanently disconnects this browser from any bounties,
              submissions and ledger credits owned by the current address. Continue?
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  setAddr(resetSessionKey());
                  setConfirmReset(false);
                }}
                className="border-2 border-verdict-fail px-4 py-1.5 text-verdict-fail hover:bg-verdict-fail hover:text-paper"
              >
                Yes, replace key
              </button>
              <button onClick={() => setConfirmReset(false)} className="border border-ink px-4 py-1.5">
                Keep current key
              </button>
            </div>
          </div>
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
