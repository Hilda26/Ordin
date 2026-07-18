// Ordin indexer — mirrors on-chain state into Supabase cache tables.
// The contract remains the source of truth; this only accelerates search and
// dashboards. Requires SUPABASE_SERVICE_ROLE_KEY (server-side only).
// Run once: node scripts/indexer.mjs   Loop: node scripts/indexer.mjs --watch
import { createClient as createSupabase } from "@supabase/supabase-js";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import fs from "node:fs";

const env = Object.fromEntries(
  fs.existsSync(".env.local")
    ? fs
        .readFileSync(".env.local", "utf8")
        .split("\n")
        .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
        .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
    : []
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
const CONTRACT = process.env.NEXT_PUBLIC_ORDIN_CONTRACT_ADDRESS ?? env.NEXT_PUBLIC_ORDIN_CONTRACT_ADDRESS;
const CHAIN_ID = 61999;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Supabase URL / service-role key not configured; indexer cannot run.");
  process.exit(1);
}
if (!CONTRACT) {
  console.error("NEXT_PUBLIC_ORDIN_CONTRACT_ADDRESS not configured.");
  process.exit(1);
}

const supabase = createSupabase(SUPABASE_URL, SERVICE_KEY);
const gl = createClient({ chain: studionet });
const read = async (functionName, args) =>
  JSON.parse(String(await gl.readContract({ address: CONTRACT, functionName, args })));

const key = { chain_id: CHAIN_ID, contract_address: CONTRACT.toLowerCase() };

async function checkpoint() {
  const { data } = await supabase
    .from("indexer_checkpoints")
    .select("last_event_seq")
    .eq("chain_id", CHAIN_ID)
    .eq("contract_address", key.contract_address)
    .maybeSingle();
  return data?.last_event_seq ?? 0;
}

async function syncBounty(id, seq) {
  const data = await read("get_bounty", [id]);
  if (!data) return;
  const policy = await read("get_bounty_policy", [id]);
  await supabase.from("cached_bounties").upsert({
    ...key,
    onchain_id: id,
    data,
    policy,
    status: data.status,
    creator_address: data.creator,
    sync_seq: seq,
    synced_at: new Date().toISOString(),
  });
  await supabase.from("case_search_documents").upsert({
    ...key,
    onchain_id: id,
    kind: "bounty",
    title: data.title,
    body: policy?.description ?? "",
    synced_at: new Date().toISOString(),
  });
}

async function syncSubmission(id, seq) {
  const data = await read("get_submission", [id]);
  if (!data) return;
  await supabase.from("cached_submissions").upsert({
    ...key,
    onchain_id: id,
    bounty_onchain_id: data.bounty,
    contributor_address: data.contributor,
    status: data.status,
    data,
    sync_seq: seq,
    synced_at: new Date().toISOString(),
  });
  await supabase.from("cached_settlements").upsert({
    ...key,
    onchain_id: id,
    state: data.settlement,
    receipt: data.receipt ? JSON.parse(data.receipt) : null,
    sync_seq: seq,
    synced_at: new Date().toISOString(),
  });
  if (data.status === "RESOLVER_PENDING" || data.ruling) {
    await supabase.from("cached_resolver_cases").upsert({
      ...key,
      onchain_id: id,
      status: data.status,
      data: data.ruling ? JSON.parse(data.ruling) : {},
      sync_seq: seq,
      synced_at: new Date().toISOString(),
    });
  }
}

async function syncReview(id, seq) {
  const data = await read("get_review", [id]);
  if (!data) return;
  await supabase.from("cached_reviews").upsert({
    ...key,
    onchain_id: id,
    submission_onchain_id: data.submission,
    kind: data.kind,
    verdict: data.verdict,
    data,
    sync_seq: seq,
    synced_at: new Date().toISOString(),
  });
}

async function syncAppeal(id, seq) {
  const data = await read("get_appeal", [id]);
  if (!data) return;
  await supabase.from("cached_appeals").upsert({
    ...key,
    onchain_id: id,
    submission_onchain_id: data.submission,
    status: data.status,
    outcome: data.outcome,
    data,
    sync_seq: seq,
    synced_at: new Date().toISOString(),
  });
}

async function runOnce() {
  const from = (await checkpoint()) + 1;
  const { latest, items } = await read("get_events", [from, 100]);
  for (const ev of items) {
    const { kind, ref, seq, data } = ev;
    try {
      if (kind.startsWith("Bounty") || kind === "RefundCompleted") await syncBounty(ref, seq);
      else if (kind === "SubmissionCreated" || kind === "RevisionSubmitted" || kind === "ResolverAssigned" || kind === "ResolverRulingSubmitted" || kind === "SettlementReady" || kind === "PayoutCompleted")
        await syncSubmission(ref, seq);
      else if (kind === "ReviewCompleted") {
        await syncReview(ref, seq);
        if (data?.submission) await syncSubmission(data.submission, seq);
      } else if (kind.startsWith("Appeal")) {
        await syncAppeal(ref, seq);
        if (data?.submission) await syncSubmission(data.submission, seq);
      }
      await supabase.from("indexer_checkpoints").upsert({
        ...key,
        last_event_seq: seq,
        updated_at: new Date().toISOString(),
      });
      console.log("indexed", seq, kind, ref);
    } catch (e) {
      console.error("failed at event", seq, kind, e.message);
      throw e; // stop; resume from checkpoint next run
    }
  }
  return { processed: items.length, latest };
}

if (process.argv.includes("--watch")) {
  console.log("indexer watching (15s poll)…");
  for (;;) {
    try {
      await runOnce();
    } catch (e) {
      console.error("cycle failed:", e.message);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
} else {
  const r = await runOnce();
  console.log(`done — processed ${r.processed}, latest on-chain seq ${r.latest}`);
}
