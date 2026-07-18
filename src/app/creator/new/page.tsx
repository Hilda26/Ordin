"use client";

// Create bounty — a multi-section document editor, not a generic stepper.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBounty, openBounty, type TxProgress } from "@/lib/genlayer/writes";
import { getCounts } from "@/lib/genlayer/reads";
import { toBaseUnits } from "@/lib/format";
import { TransactionBanner } from "@/components/TransactionBanner";
import { SourceWarning } from "@/components/CaseStates";
import type { EvidenceType, PolicyCriterion } from "@/types/ordin";

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

const DRAFT_KEY = "ordin.bountyDraft.v1";

interface DraftState {
  title: string;
  description: string;
  criteria: PolicyCriterion[];
  disqualifying: string;
  allowedTypes: EvidenceType[];
  evidenceNotes: string;
  minUrls: number;
  rewardDisplay: string;
  rewardLabel: string;
  settlementMode: "SIMULATED" | "LEDGER";
  resolver: string;
  deadline: string;
  partialAllowed: boolean;
  partialMin: number;
  partialMax: number;
  maxRevisions: number;
  maxAppeals: number;
}

const INITIAL: DraftState = {
  title: "",
  description: "",
  criteria: [{ id: "c1", mandatory: true, text: "" }],
  disqualifying: "",
  allowedTypes: ["GITHUB_REPOSITORY", "PUBLIC_ARTICLE"],
  evidenceNotes: "",
  minUrls: 1,
  rewardDisplay: "100",
  rewardLabel: "GEN (simulated)",
  settlementMode: "SIMULATED",
  resolver: "",
  deadline: "",
  partialAllowed: true,
  partialMin: 20,
  partialMax: 90,
  maxRevisions: 2,
  maxAppeals: 1,
};

function SectionHead({ n, title, blurb }: { n: string; title: string; blurb: string }) {
  return (
    <header className="rule-top pt-5">
      <p className="font-mono-ev uppercase tracking-[0.2em] text-brass">Section {n}</p>
      <h2 className="font-display mt-1 text-2xl">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">{blurb}</p>
    </header>
  );
}

export default function CreateBountyPage() {
  const router = useRouter();
  const [d, setD] = useState<DraftState>(INITIAL);
  const [tx, setTx] = useState<TxProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishToo, setPublishToo] = useState(true);
  const [problem, setProblem] = useState("");

  // local draft persistence (Supabase drafts sync can layer on top)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) setD({ ...INITIAL, ...JSON.parse(saved) });
    } catch { /* corrupt draft ignored */ }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch { /* storage full/unavailable */ }
  }, [d]);

  const set = <K extends keyof DraftState>(k: K, v: DraftState[K]) =>
    setD((s) => ({ ...s, [k]: v }));

  const setCriterion = (i: number, patch: Partial<PolicyCriterion>) =>
    set("criteria", d.criteria.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const validate = (): string => {
    if (!d.title.trim()) return "A title is required.";
    if (!d.description.trim()) return "A work brief is required.";
    if (!d.criteria.length || d.criteria.some((c) => !c.text.trim()))
      return "Every acceptance criterion needs text.";
    if (!/^0x[0-9a-fA-F]{40}$/.test(d.resolver.trim()))
      return "A resolver address (0x…) is required — it must differ from your own.";
    if (d.partialAllowed && d.partialMin > d.partialMax)
      return "Partial payout minimum exceeds maximum.";
    try {
      toBaseUnits(d.rewardDisplay);
    } catch {
      return "Reward amount is not a valid number.";
    }
    return "";
  };

  const publish = async () => {
    const v = validate();
    setProblem(v);
    if (v || busy) return;
    setBusy(true);
    try {
      const policy = {
        description: d.description.trim(),
        criteria: d.criteria.map((c, i) => ({ ...c, id: `c${i + 1}`, text: c.text.trim() })),
        disqualifying: d.disqualifying
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        evidence_requirements: {
          allowed_types: d.allowedTypes,
          min_urls: d.minUrls,
          notes: d.evidenceNotes.trim(),
        },
        pass_threshold: "all mandatory criteria PASS",
      };
      const deadlineTs = d.deadline ? Math.floor(new Date(d.deadline).getTime() / 1000) : 0;
      await createBounty(
        {
          title: d.title.trim(),
          policyJson: JSON.stringify(policy),
          reward: toBaseUnits(d.rewardDisplay),
          rewardLabel: d.rewardLabel.trim(),
          settlementMode: d.settlementMode,
          resolver: d.resolver.trim(),
          deadline: deadlineTs,
          partialAllowed: d.partialAllowed,
          partialMinBps: d.partialAllowed ? d.partialMin * 100 : 0,
          partialMaxBps: d.partialAllowed ? d.partialMax * 100 : 0,
          maxRevisions: d.maxRevisions,
          maxAppeals: d.maxAppeals,
        },
        setTx
      );
      const counts = await getCounts();
      const bid = `B${counts.bounties}`;
      if (publishToo) await openBounty(bid, setTx);
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch { /* non-fatal */ }
      router.push(`/bounties/${bid}`);
    } catch {
      // surfaced by banner
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="rule-top pt-4">
        <p className="font-mono-ev uppercase tracking-[0.2em] text-ink-faint">Creator desk</p>
        <h1 className="font-display mt-2 text-3xl md:text-4xl">Draft a bounty standard</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Everything below becomes the immutable policy the review is judged against. Drafts
          save locally as you type.
        </p>
      </div>

      {/* 1 — work brief */}
      <section className="space-y-4">
        <SectionHead n="I" title="Work brief" blurb="What must exist in public when the work is done." />
        <label className="block">
          <span className="font-mono-ev uppercase text-ink-faint">Title</span>
          <input
            value={d.title}
            onChange={(e) => set("title", e.target.value)}
            className="mt-1 w-full border border-rule bg-card px-3 py-2 font-display text-lg outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="font-mono-ev uppercase text-ink-faint">Detailed specification</span>
          <textarea
            value={d.description}
            onChange={(e) => set("description", e.target.value)}
            rows={6}
            className="mt-1 w-full border border-rule bg-card px-3 py-2 text-sm leading-relaxed outline-none focus:border-ink"
          />
        </label>
      </section>

      {/* 2 — acceptance policy */}
      <section className="space-y-4">
        <SectionHead
          n="II"
          title="Acceptance policy"
          blurb="Criterion-by-criterion standards. Mandatory criteria decide approval; optional ones inform partial credit."
        />
        {d.criteria.map((c, i) => (
          <div key={i} className="flex gap-3 border border-rule bg-card p-3">
            <span className="font-mono-ev mt-2 text-ink-faint">c{i + 1}</span>
            <textarea
              value={c.text}
              onChange={(e) => setCriterion(i, { text: e.target.value })}
              rows={2}
              placeholder="e.g. The repository contains automated tests covering the new endpoint."
              className="w-full border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
            />
            <label className="flex items-center gap-1 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={c.mandatory}
                onChange={(e) => setCriterion(i, { mandatory: e.target.checked })}
              />
              mandatory
            </label>
            {d.criteria.length > 1 ? (
              <button
                onClick={() => set("criteria", d.criteria.filter((_, j) => j !== i))}
                aria-label={`remove criterion ${i + 1}`}
                className="text-ink-faint hover:text-verdict-fail"
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}
        <button
          onClick={() =>
            set("criteria", [...d.criteria, { id: `c${d.criteria.length + 1}`, mandatory: false, text: "" }])
          }
          className="border border-ink px-4 py-2 text-sm hover:bg-paper-deep"
        >
          + add criterion
        </button>
        <label className="block">
          <span className="font-mono-ev uppercase text-ink-faint">Disqualifying conditions (one per line)</span>
          <textarea
            value={d.disqualifying}
            onChange={(e) => set("disqualifying", e.target.value)}
            rows={2}
            placeholder="Plagiarised content&#10;Evidence behind a login wall"
            className="mt-1 w-full border border-rule bg-card px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>
      </section>

      {/* 3 — evidence policy */}
      <section className="space-y-4">
        <SectionHead
          n="III"
          title="Evidence policy"
          blurb="What the contract will fetch. Contributor notes are never proof."
        />
        <div className="flex flex-wrap gap-2">
          {EVIDENCE_TYPES.map((t) => (
            <label
              key={t}
              className={`cursor-pointer border px-3 py-1.5 font-mono-ev ${
                d.allowedTypes.includes(t)
                  ? "border-ink bg-ink text-paper"
                  : "border-rule-strong text-ink-soft"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={d.allowedTypes.includes(t)}
                onChange={(e) =>
                  set(
                    "allowedTypes",
                    e.target.checked
                      ? [...d.allowedTypes, t]
                      : d.allowedTypes.filter((x) => x !== t)
                  )
                }
              />
              {t.replaceAll("_", " ").toLowerCase()}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono-ev uppercase text-ink-faint">Minimum evidence URLs</span>
            <input
              type="number"
              min={1}
              max={5}
              value={d.minUrls}
              onChange={(e) => set("minUrls", Number(e.target.value))}
              className="mt-1 w-full border border-rule bg-card px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-mono-ev uppercase text-ink-faint">Source-specific requirements</span>
            <input
              value={d.evidenceNotes}
              onChange={(e) => set("evidenceNotes", e.target.value)}
              placeholder="e.g. Primary evidence must be the public repository URL"
              className="mt-1 w-full border border-rule bg-card px-3 py-2 text-sm"
            />
          </label>
        </div>
        <SourceWarning>
          Private links, login-gated pages, and screenshots will be classified as insufficient
          evidence at review time.
        </SourceWarning>
      </section>

      {/* 4 — review & dispute policy */}
      <section className="space-y-4">
        <SectionHead
          n="IV"
          title="Review & dispute policy"
          blurb="Revision and appeal ceilings. Human arbitration is available only after AI appeal rights are exhausted."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="font-mono-ev uppercase text-ink-faint">Max revision rounds</span>
            <input
              type="number"
              min={0}
              max={5}
              value={d.maxRevisions}
              onChange={(e) => set("maxRevisions", Number(e.target.value))}
              className="mt-1 w-full border border-rule bg-card px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-mono-ev uppercase text-ink-faint">Max AI appeals</span>
            <input
              type="number"
              min={0}
              max={2}
              value={d.maxAppeals}
              onChange={(e) => set("maxAppeals", Number(e.target.value))}
              className="mt-1 w-full border border-rule bg-card px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-mono-ev uppercase text-ink-faint">Resolver address</span>
            <input
              value={d.resolver}
              onChange={(e) => set("resolver", e.target.value)}
              placeholder="0x…"
              className="mt-1 w-full border border-rule bg-card px-3 py-2 font-mono-ev"
            />
          </label>
        </div>
      </section>

      {/* 5 — reward & settlement */}
      <section className="space-y-4">
        <SectionHead
          n="V"
          title="Reward & settlement"
          blurb="Settlement follows this policy mechanically. StudioNet rewards are simulated or ledger-recorded — the interface never claims a real transfer happened."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="font-mono-ev uppercase text-ink-faint">Reward amount</span>
            <input
              value={d.rewardDisplay}
              onChange={(e) => set("rewardDisplay", e.target.value)}
              className="mt-1 w-full border border-rule bg-card px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-mono-ev uppercase text-ink-faint">Asset label</span>
            <input
              value={d.rewardLabel}
              onChange={(e) => set("rewardLabel", e.target.value)}
              className="mt-1 w-full border border-rule bg-card px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-mono-ev uppercase text-ink-faint">Settlement mode</span>
            <select
              value={d.settlementMode}
              onChange={(e) => set("settlementMode", e.target.value as "SIMULATED" | "LEDGER")}
              className="mt-1 w-full border border-rule bg-card px-3 py-2"
            >
              <option value="SIMULATED">SIMULATED — labelled demo balances</option>
              <option value="LEDGER">LEDGER — on-chain credit ledger</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={d.partialAllowed}
              onChange={(e) => set("partialAllowed", e.target.checked)}
            />
            allow partial payout
          </label>
          {d.partialAllowed ? (
            <>
              <label className="block">
                <span className="font-mono-ev uppercase text-ink-faint">Partial min %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={d.partialMin}
                  onChange={(e) => set("partialMin", Number(e.target.value))}
                  className="mt-1 w-full border border-rule bg-card px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="font-mono-ev uppercase text-ink-faint">Partial max %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={d.partialMax}
                  onChange={(e) => set("partialMax", Number(e.target.value))}
                  className="mt-1 w-full border border-rule bg-card px-3 py-2"
                />
              </label>
            </>
          ) : null}
        </div>
        <label className="block">
          <span className="font-mono-ev uppercase text-ink-faint">Submission deadline (optional)</span>
          <input
            type="datetime-local"
            value={d.deadline}
            onChange={(e) => set("deadline", e.target.value)}
            className="mt-1 border border-rule bg-card px-3 py-2"
          />
        </label>
      </section>

      {/* 6 — publish */}
      <section className="rule-top space-y-4 pt-6">
        <SectionHead
          n="VI"
          title="Preview & publish"
          blurb="Publishing records the policy on StudioNet. Once open, criteria cannot be weakened, deadlines cannot be shortened, and the resolver cannot be silently replaced."
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={publishToo} onChange={(e) => setPublishToo(e.target.checked)} />
          open for submissions immediately after creating
        </label>
        {problem ? <p className="text-sm text-verdict-fail" role="alert">{problem}</p> : null}
        <button
          onClick={publish}
          disabled={busy}
          className="border-2 border-ink bg-ink px-8 py-3 text-paper hover:bg-oxblood hover:border-oxblood disabled:opacity-50"
        >
          {busy ? "Recording on StudioNet…" : publishToo ? "Create & open bounty" : "Create as draft"}
        </button>
        <TransactionBanner tx={tx} />
      </section>
    </div>
  );
}
