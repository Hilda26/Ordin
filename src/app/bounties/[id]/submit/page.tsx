"use client";

// Submission composer — evidence references with pre-transaction validation.
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBounty } from "@/lib/genlayer/reads";
import { submitWork, type TxProgress } from "@/lib/genlayer/writes";
import type { Bounty, EvidenceRef, EvidenceType } from "@/types/ordin";
import { CaseHeader } from "@/components/CaseHeader";
import { TransactionBanner } from "@/components/TransactionBanner";
import { SourceWarning } from "@/components/CaseStates";

const EVIDENCE_TYPES: EvidenceType[] = [
  "GITHUB_REPOSITORY",
  "GITHUB_PULL_REQUEST",
  "GITHUB_ISSUE",
  "PUBLIC_ARTICLE",
  "PUBLIC_DOCUMENT",
  "PUBLIC_DEPLOYMENT",
  "PACKAGE_RELEASE",
  "PUBLIC_DESIGN",
  "PUBLIC_DATASET",
  "OTHER_PUBLIC_URL",
];

function validateUrl(url: string): string | null {
  const u = url.trim().toLowerCase();
  if (!u) return "URL is required";
  if (!u.startsWith("https://") && !u.startsWith("http://"))
    return "Only public http(s) URLs are accepted";
  try {
    const host = new URL(url).hostname;
    if (
      host === "localhost" ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.endsWith(".local")
    )
      return "Private-network URLs will be rejected by the contract";
    if (new URL(url).username) return "Credential-bearing URLs are rejected";
  } catch {
    return "Not a valid URL";
  }
  return null;
}

interface Row extends EvidenceRef {
  error?: string | null;
}

export default function SubmitWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [rows, setRows] = useState<Row[]>([{ url: "", type: "GITHUB_REPOSITORY" }]);
  const [note, setNote] = useState("");
  const [payoutDest, setPayoutDest] = useState("");
  const [tx, setTx] = useState<TxProgress | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getBounty(id).then(setBounty).catch(() => setBounty(null));
  }, [id]);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const validate = (): boolean => {
    let ok = true;
    setRows((rs) =>
      rs.map((r) => {
        const error = validateUrl(r.url);
        if (error) ok = false;
        return { ...r, error };
      })
    );
    return ok;
  };

  const submit = async () => {
    if (!validate() || busy) return;
    setBusy(true);
    try {
      const evidence: EvidenceRef[] = rows.map(({ url, type, label, version_ref }) => ({
        url: url.trim(),
        type,
        ...(label ? { label } : {}),
        ...(version_ref ? { version_ref } : {}),
      }));
      await submitWork(id, evidence, note, payoutDest.trim(), setTx);
      router.push(`/bounties/${id}?submitted=1`);
    } catch {
      // surfaced via banner
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <CaseHeader
        eyebrow="Submission composer"
        id={id}
        title={bounty ? `Submit work — ${bounty.title}` : "Submit work"}
      />

      <SourceWarning>
        Your note is context. The contract will independently fetch and inspect every
        source you reference — private links, login walls, and screenshots cannot prove
        completion.
      </SourceWarning>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Public evidence references</h2>
        {rows.map((r, i) => (
          <div key={i} className="border border-rule bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
              <label className="block">
                <span className="font-mono-ev uppercase text-ink-faint">Source type</span>
                <select
                  value={r.type}
                  onChange={(e) => setRow(i, { type: e.target.value as EvidenceType })}
                  className="mt-1 w-full border border-rule bg-paper px-2 py-2 text-sm"
                >
                  {EVIDENCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll("_", " ").toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-mono-ev uppercase text-ink-faint">Public URL</span>
                <input
                  value={r.url}
                  onChange={(e) => setRow(i, { url: e.target.value, error: null })}
                  onBlur={() => setRow(i, { error: validateUrl(r.url) })}
                  placeholder="https://…"
                  className="mt-1 w-full border border-rule bg-paper px-3 py-2 font-mono-ev outline-none focus:border-ink"
                />
                {r.error ? <span className="text-sm text-verdict-fail">{r.error}</span> : null}
              </label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono-ev uppercase text-ink-faint">Label (optional)</span>
                <input
                  value={r.label ?? ""}
                  onChange={(e) => setRow(i, { label: e.target.value })}
                  className="mt-1 w-full border border-rule bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="font-mono-ev uppercase text-ink-faint">Version / commit ref (optional)</span>
                <input
                  value={r.version_ref ?? ""}
                  onChange={(e) => setRow(i, { version_ref: e.target.value })}
                  className="mt-1 w-full border border-rule bg-paper px-3 py-2 font-mono-ev"
                />
              </label>
            </div>
            {rows.length > 1 ? (
              <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="mt-3 text-sm text-ink-faint underline">
                remove source
              </button>
            ) : null}
          </div>
        ))}
        {rows.length < 5 ? (
          <button
            onClick={() => setRows((rs) => [...rs, { url: "", type: "OTHER_PUBLIC_URL" }])}
            className="border border-ink px-4 py-2 text-sm hover:bg-paper-deep"
          >
            + add another source
          </button>
        ) : null}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="font-display text-lg">Context note</span>
          <p className="text-sm text-ink-faint">Optional. Read as untrusted context — never as proof.</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            className="mt-2 w-full border border-rule bg-card px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="font-display text-lg">Payout destination</span>
          <p className="text-sm text-ink-faint">Leave blank to use your session address.</p>
          <input
            value={payoutDest}
            onChange={(e) => setPayoutDest(e.target.value)}
            placeholder="0x…"
            className="mt-2 w-full border border-rule bg-card px-3 py-2 font-mono-ev outline-none focus:border-ink"
          />
        </label>
      </section>

      <section className="rule-top pt-6">
        <button
          onClick={submit}
          disabled={busy}
          className="border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-oxblood hover:border-oxblood disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit on-chain"}
        </button>
        <TransactionBanner tx={tx} />
      </section>
    </div>
  );
}
