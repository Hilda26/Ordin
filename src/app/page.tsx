import Link from "next/link";
import { ActivityStrip } from "@/components/ActivityStrip";

const EVIDENCE_SOURCES = [
  "GitHub repository",
  "Pull request",
  "Public issue",
  "Published article",
  "Public document",
  "Live deployment",
  "Package release",
  "Public design",
  "Public dataset",
];

const LIFECYCLE = [
  ["01", "Publish the standard", "The creator fixes acceptance criteria, evidence rules, and settlement policy before any work is submitted. The policy is immutable once open."],
  ["02", "Submit the work", "The contributor references public evidence — repositories, articles, deployments. Notes are context; they are never proof."],
  ["03", "Evidence is fetched", "The GenLayer Intelligent Contract independently fetches every referenced source. No screenshots, no self-reported claims."],
  ["04", "Validators reach consensus", "Independent AI validators evaluate the fetched evidence against each criterion and agree on a canonical verdict."],
  ["05", "Revision, appeal, arbitration", "Failed criteria come back as correctable findings. Re-reviews and appeals run fresh consensus. Humans arbitrate only the exceptional cases."],
  ["06", "Settlement follows policy", "Approval and payment are separate states. Payouts follow the pre-configured rules — full, partial, or refund — with a permanent public receipt."],
] as const;

export default function LandingPage() {
  return (
    <div>
      {/* editorial hero */}
      <section className="rule-top pt-10">
        <p className="font-mono-ev uppercase tracking-[0.3em] text-brass">
          Independent work verification &amp; settlement
        </p>
        <h1 className="font-display mt-4 max-w-4xl text-4xl leading-[1.1] md:text-6xl">
          Publish the standard. Submit the work.{" "}
          <span className="text-oxblood">Let evidence decide.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Ordin is a work-acceptance protocol. Organisations publish bounties with fixed
          acceptance criteria; contributors submit references to public work; a GenLayer
          Intelligent Contract independently fetches the evidence and a panel of AI
          validators reaches a consensus verdict. Payment follows policy — not opinion.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/creator/new"
            className="border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-oxblood hover:border-oxblood"
          >
            Publish a bounty
          </Link>
          <Link
            href="/bounties"
            className="border-2 border-ink px-6 py-3 hover:bg-paper-deep"
          >
            Browse open work
          </Link>
        </div>
      </section>

      {/* live activity strip */}
      <ActivityStrip />

      {/* problem statement */}
      <section className="rule-top mt-14 grid gap-10 pt-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">The last step is where bounties fail</h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Boards can publish tasks and hold funds, but the decision to pay still rests on
            one administrator reading the work. Standards drift, reviews stall, disputes
            fester. Central AI review does not fix this: a server can change prompts,
            fabricate decisions, or grade only what the contributor claims.
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl">Evidence over claims</h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Ordin never treats a written claim or screenshot as proof when a public source
            exists. The contract fetches the repository, the article, the deployment —
            itself — and evaluates it criterion by criterion under validator consensus.
            Every verdict is replayable and publicly filed.
          </p>
        </div>
      </section>

      {/* lifecycle */}
      <section className="rule-top mt-14 pt-8">
        <h2 className="font-display text-2xl">How a case moves through Ordin</h2>
        <ol className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {LIFECYCLE.map(([n, title, body]) => (
            <li key={n} className="flex gap-5">
              <span className="font-display text-3xl text-rule-strong">{n}</span>
              <div>
                <h3 className="font-display text-lg">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* evidence sources */}
      <section className="rule-top mt-14 pt-8">
        <h2 className="font-display text-2xl">Supported evidence sources</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Any publicly accessible source the contract can fetch. Private links, login walls,
          and pasted claims are classified as insufficient — by design.
        </p>
        <ul className="mt-5 flex flex-wrap gap-x-2 gap-y-2">
          {EVIDENCE_SOURCES.map((s) => (
            <li key={s} className="border border-rule-strong px-3 py-1.5 font-mono-ev">
              {s}
            </li>
          ))}
        </ul>
      </section>

      {/* closing CTA */}
      <section className="rule-top mt-14 pt-10 pb-4 text-center">
        <p className="font-display mx-auto max-w-2xl text-3xl leading-snug">
          Every final decision, publicly explained.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/creator/new" className="border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-oxblood hover:border-oxblood">
            Create your first bounty
          </Link>
        </div>
      </section>
    </div>
  );
}
