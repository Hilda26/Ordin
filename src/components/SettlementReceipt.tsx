import type { SettlementReceipt as TReceipt } from "@/types/ordin";
import { formatBps, formatReward, formatTs, shortAddress } from "@/lib/format";
import { ORDIN_CONTRACT_ADDRESS } from "@/lib/genlayer/config";
import { ExplorerLink } from "./ExplorerLink";

// Permanent settlement proof — always honest about the settlement mode.
export function SettlementReceipt({ receipt }: { receipt: TReceipt }) {
  return (
    <article className="border-2 border-ink bg-card" aria-label="settlement receipt">
      <header className="border-b-2 border-ink px-5 py-4">
        <p className="font-mono-ev uppercase tracking-[0.25em] text-ink-faint">Settlement receipt</p>
        <p className="font-display mt-1 text-2xl">
          {formatReward(receipt.amount, receipt.reward_label)}
        </p>
        <p className="font-mono-ev mt-1 text-brass">
          MODE: {receipt.mode} — {receipt.note}
        </p>
      </header>
      <dl className="grid gap-x-8 gap-y-2 px-5 py-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-mono-ev uppercase text-ink-faint">Case</dt>
          <dd>{receipt.submission} · bounty {receipt.bounty}</dd>
        </div>
        <div>
          <dt className="font-mono-ev uppercase text-ink-faint">Payout share</dt>
          <dd>{formatBps(receipt.payout_bps)} of the reward</dd>
        </div>
        <div>
          <dt className="font-mono-ev uppercase text-ink-faint">Recipient</dt>
          <dd title={receipt.destination}>{shortAddress(receipt.destination)}</dd>
        </div>
        <div>
          <dt className="font-mono-ev uppercase text-ink-faint">Recorded</dt>
          <dd>{formatTs(receipt.ts)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-mono-ev uppercase text-ink-faint">Contract</dt>
          <dd>
            <ExplorerLink kind="address" value={ORDIN_CONTRACT_ADDRESS} label={ORDIN_CONTRACT_ADDRESS} />
          </dd>
        </div>
      </dl>
    </article>
  );
}
