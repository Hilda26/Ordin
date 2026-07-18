# Architecture

```text
User (browser)
  |
  v
Next.js App Router (src/app)
  |-- identity: StudioNet session key (localStorage) + optional Supabase auth
  |-- drafts: localStorage now, Supabase drafts when configured
  |-- all case state: GenLayer contract reads (src/lib/genlayer/reads.ts)
  |-- all mutations: GenLayer contract writes (src/lib/genlayer/writes.ts)
  |
  v
Ordin Intelligent Contract (contracts/ordin.py, StudioNet)
  |-- deterministic: authorization, deadlines, limits, payout math, idempotency
  |-- non-deterministic: evidence fetching + LLM evaluation inside
  |   gl.eq_principle.prompt_comparative closures
  |-- append-only event log (get_events) for indexing
  |
  v
Supabase (optional)
  |-- profiles / organisations / wallet bindings / resolver profiles
  |-- drafts, notifications, supplementary files
  |-- cached_* mirrors + case_search_documents, written only by
  |   scripts/indexer.mjs using the service-role key
```

## Layering rules

1. **The contract is the source of truth.** The frontend renders from contract
   reads; Supabase rows are advisory mirrors stamped with `sync_seq` and
   `synced_at`, and are never marked final without an on-chain confirmation.
2. **No raw SDK calls in components.** All genlayer-js usage lives in
   `src/lib/genlayer/{config,client,reads,writes,errors}.ts`; components call
   typed functions and render `TxProgress` phases
   (`idle → awaiting-wallet → submitting → pending → confirmed | failed`).
3. **Reads return JSON strings.** Every contract view returns JSON for stable
   decoding; the service layer parses into `src/types/ordin.ts` shapes.
4. **Events are storage, not runtime.** The contract records every state
   transition in an append-only `events` map (`get_events(from_seq, limit)`),
   which the indexer tails with a checkpoint. Runtime Event classes were
   avoided because their support on the pinned StudioNet runner is unverified.

## Identity

- On-chain actions sign with a locally generated **session key**
  (`src/lib/genlayer/client.ts`, localStorage). StudioNet is gasless, so the
  key needs no funding. Settings allows regeneration with a destructive-action
  confirmation.
- Supabase email/password auth (when configured) adds profiles, drafts and
  notifications; `wallet_bindings` associates session addresses to accounts.

## Directory map

```text
contracts/          ordin.py (main), storage_probe.py (StudioNet probe)
scripts/            gl.mjs (shared), deploy-contract.mjs, storage-probe.mjs,
                    studionet-tests.mjs, indexer.mjs
src/app/            routes (landing, bounties, cases, receipts, creator,
                    contributor, resolver, auth, settings, admin)
src/components/     case-room component library
src/lib/genlayer/   typed service layer
src/lib/supabase/   browser + server clients (graceful when unconfigured)
supabase/migrations 0001_ordin_core.sql (tables + RLS)
docs/               this documentation set
```
