// StudioNet write-path tests for the Ordin contract.
// Covers the happy path (create -> open -> submit -> real consensus review ->
// settlement) plus deterministic guard checks (authorization, duplicates,
// idempotency). Run: node scripts/studionet-tests.mjs
import { makeClient, write, read } from "./gl.mjs";
import fs from "node:fs";

const { contract } = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
const creator = makeClient("creator");
const contributor = makeClient("contributor");
const resolverAcct = makeClient("resolver");
const now = () => Math.floor(Date.now() / 1000);

let pass = 0;
let fail = 0;
const ok = (name) => { pass++; console.log("  PASS", name); };
const bad = (name, e) => { fail++; console.log("  FAIL", name, "--", (e?.message ?? e)?.slice?.(0, 200) ?? e); };

async function expectRevert(name, fn) {
  try {
    const { receipt } = await fn();
    // StudioNet: failed executions surface as tx with error result; a
    // successful ACCEPTED receipt with SUCCESS leader result means no revert.
    const lr = receipt?.consensus_data?.leader_receipt;
    const first = Array.isArray(lr) ? lr[0] : lr;
    const res = first?.execution_result ?? first?.result;
    if (res === "SUCCESS") bad(name, "expected revert but tx succeeded");
    else ok(name + " (reverted as expected: " + res + ")");
  } catch (e) {
    ok(name + " (rejected: " + (e.message?.slice(0, 60) ?? "error") + ")");
  }
}

function execResult(receipt) {
  const lr = receipt?.consensus_data?.leader_receipt;
  const first = Array.isArray(lr) ? lr[0] : lr;
  return first?.execution_result ?? first?.result;
}

const policy = {
  description:
    "Document the GenLayer project boilerplate. The public repository must present a working GenLayer starter project.",
  criteria: [
    {
      id: "c1",
      mandatory: true,
      text: "The repository README (or landing content) clearly describes a GenLayer project boilerplate or starter template.",
    },
    {
      id: "c2",
      mandatory: true,
      text: "The repository is public and its content is accessible without login.",
    },
    {
      id: "c3",
      mandatory: false,
      text: "The repository mentions how to run or deploy the project (any setup/usage instructions).",
    },
  ],
  evidence_requirements: {
    allowed_types: ["GITHUB_REPOSITORY", "PUBLIC_ARTICLE", "OTHER_PUBLIC_URL"],
    min_urls: 1,
    notes: "Primary evidence must be the public repository URL.",
  },
  pass_threshold: "all mandatory criteria PASS",
};

console.log("contract:", contract);
console.log("creator:", creator.account.address);
console.log("contributor:", contributor.account.address);
console.log("resolver:", resolverAcct.account.address);

// ---------------------------------------------------------------- T1: happy path
console.log("\n== T1: bounty lifecycle with real consensus review ==");
let bountyId, submissionId;

try {
  const { receipt } = await write(creator.client, creator.account, contract, "create_bounty", [
    "Document the GenLayer boilerplate",
    JSON.stringify(policy),
    1000000n, // 1.0 units at 6 decimals
    "GEN (simulated)",
    "SIMULATED",
    resolverAcct.account.address,
    0, // no deadline
    true, // partial allowed
    2000,
    9000,
    2, // max revisions
    1, // max appeals
    now(),
  ]);
  if (execResult(receipt) !== "SUCCESS") throw new Error("create_bounty exec: " + execResult(receipt));
  const counts = JSON.parse(await read(creator.client, contract, "get_counts", []));
  bountyId = "B" + counts.bounties;
  ok("create_bounty -> " + bountyId);
} catch (e) { bad("create_bounty", e); }

try {
  const { receipt } = await write(creator.client, creator.account, contract, "open_bounty", [bountyId, now()]);
  if (execResult(receipt) !== "SUCCESS") throw new Error(execResult(receipt));
  ok("open_bounty");
} catch (e) { bad("open_bounty", e); }

await expectRevert("open_bounty is idempotent-guarded (second open reverts)", () =>
  write(creator.client, creator.account, contract, "open_bounty", [bountyId, now()])
);

await expectRevert("creator cannot submit to own bounty", () =>
  write(creator.client, creator.account, contract, "submit_work", [
    bountyId,
    JSON.stringify([{ url: "https://github.com/genlayerlabs/genlayer-project-boilerplate", type: "GITHUB_REPOSITORY" }]),
    "",
    "",
    now(),
  ])
);

await expectRevert("private-network evidence URL rejected", () =>
  write(contributor.client, contributor.account, contract, "submit_work", [
    bountyId,
    JSON.stringify([{ url: "http://localhost:8080/x", type: "OTHER_PUBLIC_URL" }]),
    "",
    "",
    now(),
  ])
);

try {
  const { receipt } = await write(contributor.client, contributor.account, contract, "submit_work", [
    bountyId,
    JSON.stringify([
      { url: "https://github.com/genlayerlabs/genlayer-project-boilerplate", type: "GITHUB_REPOSITORY", label: "boilerplate repo" },
    ]),
    "The repository is the official GenLayer project boilerplate.",
    "",
    now(),
  ]);
  if (execResult(receipt) !== "SUCCESS") throw new Error(execResult(receipt));
  const counts = JSON.parse(await read(creator.client, contract, "get_counts", []));
  submissionId = "S" + counts.submissions;
  ok("submit_work -> " + submissionId);
} catch (e) { bad("submit_work", e); }

await expectRevert("duplicate active submission rejected", () =>
  write(contributor.client, contributor.account, contract, "submit_work", [
    bountyId,
    JSON.stringify([{ url: "https://github.com/genlayerlabs/genlayer-project-boilerplate", type: "GITHUB_REPOSITORY" }]),
    "",
    "",
    now(),
  ])
);

await expectRevert("settlement cannot be finalized before a verdict", () =>
  write(contributor.client, contributor.account, contract, "finalize_settlement", [submissionId, now()])
);

console.log("\n-- requesting initial review (real web fetch + LLM consensus; may take minutes) --");
let verdict = null;
try {
  const { receipt } = await write(contributor.client, contributor.account, contract, "request_initial_review", [submissionId, now()]);
  if (execResult(receipt) !== "SUCCESS") throw new Error("review exec: " + execResult(receipt));
  const sub = JSON.parse(await read(creator.client, contract, "get_submission", [submissionId]));
  verdict = sub.status;
  const reviewId = sub.reviews[sub.reviews.length - 1];
  const review = JSON.parse(await read(creator.client, contract, "get_review", [reviewId]));
  ok("request_initial_review -> verdict " + review.verdict + " (case status " + sub.status + ")");
  console.log("  review summary:", review.result.summary?.slice(0, 200));
  console.log("  criteria:", review.result.criteria?.map((c) => c.id + ":" + c.status).join(" "));
  console.log("  fetch log:", JSON.stringify(review.result.fetch_log));
} catch (e) { bad("request_initial_review", e); }

await expectRevert("initial review cannot run twice", () =>
  write(contributor.client, contributor.account, contract, "request_initial_review", [submissionId, now()])
);

if (verdict === "APPROVED" || verdict === "PARTIAL_APPROVAL") {
  try {
    const { receipt } = await write(contributor.client, contributor.account, contract, "finalize_settlement", [submissionId, now()]);
    if (execResult(receipt) !== "SUCCESS") throw new Error(execResult(receipt));
    ok("finalize_settlement -> PAYOUT_READY");
  } catch (e) { bad("finalize_settlement", e); }

  await expectRevert("creator cannot claim contributor payout", () =>
    write(creator.client, creator.account, contract, "claim_payout", [submissionId, now()])
  );

  try {
    const { receipt } = await write(contributor.client, contributor.account, contract, "claim_payout", [submissionId, now()]);
    if (execResult(receipt) !== "SUCCESS") throw new Error(execResult(receipt));
    const sub = JSON.parse(await read(creator.client, contract, "get_submission", [submissionId]));
    ok("claim_payout -> " + sub.settlement + " receipt: " + sub.receipt.slice(0, 120));
  } catch (e) { bad("claim_payout", e); }

  await expectRevert("double payout impossible", () =>
    write(contributor.client, contributor.account, contract, "claim_payout", [submissionId, now()])
  );
} else {
  console.log("  (verdict " + verdict + " — settlement branch skipped this run)");
}

// ------------------------------------------------- T2: deterministic guards
console.log("\n== T2: deterministic guards on a second bounty ==");
let b2;
try {
  await write(creator.client, creator.account, contract, "create_bounty", [
    "Guard-check bounty",
    JSON.stringify(policy),
    500000n,
    "GEN (simulated)",
    "LEDGER",
    resolverAcct.account.address,
    0,
    false, // partial NOT allowed
    0,
    0,
    1,
    1,
    now(),
  ]);
  const counts = JSON.parse(await read(creator.client, contract, "get_counts", []));
  b2 = "B" + counts.bounties;
  ok("create_bounty (LEDGER, no partial) -> " + b2);
} catch (e) { bad("create_bounty b2", e); }

await expectRevert("non-creator cannot open bounty", () =>
  write(contributor.client, contributor.account, contract, "open_bounty", [b2, now()])
);

await expectRevert("cannot submit to DRAFT bounty", () =>
  write(contributor.client, contributor.account, contract, "submit_work", [
    b2,
    JSON.stringify([{ url: "https://example.com", type: "OTHER_PUBLIC_URL" }]),
    "", "", now(),
  ])
);

await expectRevert("resolver cannot rule a case that is not pending", () =>
  write(resolverAcct.client, resolverAcct.account, contract, "submit_resolver_ruling", [
    submissionId ?? "S1", "APPROVE_FULL", 10000, "no case", now(),
  ])
);

try {
  await write(creator.client, creator.account, contract, "cancel_bounty", [b2, now()]);
  const b = JSON.parse(await read(creator.client, contract, "get_bounty", [b2]));
  if (b.status !== "CANCELLED") throw new Error("status " + b.status);
  ok("cancel_bounty (draft) -> CANCELLED");
} catch (e) { bad("cancel_bounty b2", e); }

// timeline + events
try {
  const ev = JSON.parse(await read(creator.client, contract, "get_events", [1, 50]));
  const tl = JSON.parse(await read(creator.client, contract, "get_case_timeline", [submissionId ?? "S1"]));
  ok("event log has " + ev.items.length + " events; case timeline has " + tl.length + " entries");
} catch (e) { bad("events/timeline reads", e); }

console.log("\n==============================");
console.log("RESULT:", pass, "passed,", fail, "failed");
process.exit(fail > 0 ? 1 : 0);
