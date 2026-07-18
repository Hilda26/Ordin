"use client";

// Minimal administration — contract configuration display and indexer health.
// There is deliberately no admin override for verdicts.
import { useEffect, useState } from "react";
import { getCounts } from "@/lib/genlayer/reads";
import type { Counts } from "@/types/ordin";
import {
  GENLAYER_CHAIN_ID,
  GENLAYER_RPC_URL,
  GENLAYER_EXPLORER_URL,
  ORDIN_CONTRACT_ADDRESS,
} from "@/lib/genlayer/config";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { ExplorerLink } from "@/components/ExplorerLink";

export default function AdminPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [rpcOk, setRpcOk] = useState<boolean | null>(null);

  useEffect(() => {
    getCounts()
      .then((c) => {
        setCounts(c);
        setRpcOk(true);
      })
      .catch(() => setRpcOk(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="rule-top pt-4">
        <p className="font-mono-ev uppercase tracking-[0.2em] text-ink-faint">Administration</p>
        <h1 className="font-display mt-2 text-3xl">System configuration</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Read-only. Ordin has no administrative override for verdicts, rulings or payouts —
          those live exclusively in the contract.
        </p>
      </div>

      <section>
        <h2 className="font-display text-xl">Contract</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-mono-ev uppercase text-ink-faint">Chain</dt>
            <dd>{GENLAYER_CHAIN_ID} (StudioNet)</dd>
          </div>
          <div>
            <dt className="font-mono-ev uppercase text-ink-faint">RPC health</dt>
            <dd className={rpcOk === false ? "text-verdict-fail" : "text-verdict-pass"}>
              {rpcOk === null ? "checking…" : rpcOk ? "reachable" : "unreachable"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-mono-ev uppercase text-ink-faint">Address</dt>
            <dd>
              <ExplorerLink kind="address" value={ORDIN_CONTRACT_ADDRESS} label={ORDIN_CONTRACT_ADDRESS} />
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-mono-ev uppercase text-ink-faint">Explorer</dt>
            <dd className="font-mono-ev break-all">{GENLAYER_EXPLORER_URL}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-mono-ev uppercase text-ink-faint">RPC endpoint</dt>
            <dd className="font-mono-ev break-all">{GENLAYER_RPC_URL}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="font-display text-xl">On-chain record</h2>
        {counts ? (
          <p className="mt-2 font-mono-ev text-sm text-ink-soft">
            {counts.bounties} bounties · {counts.submissions} submissions · {counts.reviews} reviews ·{" "}
            {counts.appeals} appeals · {counts.events} events
          </p>
        ) : (
          <p className="mt-2 font-mono-ev text-sm text-ink-faint">reading…</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl">Indexer</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {isSupabaseConfigured()
            ? "Supabase is configured. Run the indexer with `node scripts/indexer.mjs` to mirror events into the cache tables; checkpoints appear in indexer_checkpoints."
            : "Supabase is not configured — the app reads everything directly from the contract, so no indexer is required. Configure Supabase to enable cached search and notifications."}
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl">Source-domain policy</h2>
        <p className="mt-2 text-sm text-ink-soft">
          The contract blocks non-http(s) schemes, credential-bearing URLs, localhost and
          private-network ranges at submission time. Additional domain flags can be recorded in
          Supabase (`source_domain_flags`) for UI warnings.
        </p>
      </section>
    </div>
  );
}
