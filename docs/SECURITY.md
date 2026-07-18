# Security model

## Trust boundaries

```text
UNTRUSTED        contributor notes, appeal arguments, fetched page content
SEMI-TRUSTED     client_ts (used for display/deadline only, never settlement logic)
TRUSTED          contract storage (consensus-written), validator execution results
```

## Contract-level protections

- **Role enforcement**: every write method checks `gl.message.sender_account`
  against the stored role for that record (creator, contributor, resolver).
  Impersonation requires the private key.
- **Idempotency guards**: double review, double payout, double settlement,
  duplicate submission — all revert with `gl.vm.UserError`.
- **URL validation**: `_valid_public_url` blocks non-http(s) schemes, credential
  URLs (`@` in host), and RFC-1918/link-local/loopback addresses. This prevents
  SSRF via the validator's `web.render` call.
- **Prompt injection in fetched content**: the consensus prompt explicitly
  labels fetched text as untrusted data, instructs the LLM to treat it as
  content to evaluate (not instructions to follow), and requires output in a
  fixed JSON schema. Validators cross-check results via
  `prompt_comparative`, so a single manipulated validator cannot change the
  verdict.
- **Partial-approval bounds**: payout basis points are clamped to the bounty's
  `partial_min_bps`/`partial_max_bps` range inside the contract, regardless of
  what the LLM returns.

## Frontend-level protections

- **Session keys**: generated client-side, stored in localStorage. The key
  never leaves the browser except as transaction signatures. No server holds
  contributor private keys.
- **No secrets in the client bundle**: contract address and RPC URL are public
  by design. The Supabase anon key is a public key (RLS-gated). The service
  role key exists only in the indexer and server actions.
- **XSS surface**: fetched evidence content is never rendered as HTML in the
  frontend; it's displayed as pre-formatted text or summarized by the contract.
  User notes render as plain text (no `dangerouslySetInnerHTML`).
- **RLS on all Supabase tables**: every cached table has row-level security
  policies scoped to the owning organisation or public-read where appropriate.
  The indexer uses the service role key and bypasses RLS only to write cache.

## Known limitations (honest disclosure)

- **client_ts is caller-supplied**: a malicious caller could set a past or
  future timestamp. The contract uses it for deadline comparison only — never
  for ordering events (that uses the append-only event sequence). Deadlines are
  belt-and-braces, not security-critical.
- **StudioNet is a testnet**: there are no real funds. SIMULATED mode labels
  are shown in the UI. LEDGER mode credits an on-chain balance field but it
  represents test credit, not transferable tokens.
- **Validator count**: StudioNet runs a small validator set under Genlayer's
  control. In production the consensus security scales with validator diversity.
- **Fetch is point-in-time**: evidence URLs are fetched once at review time.
  If the content changes after review, the verdict is based on what was
  available at the time (the fetch log records this).
- **LLM judgment variance**: different validator LLMs may interpret edge cases
  differently. The comparative equivalence principle accepts results that agree
  on verdict and per-criterion outcome; disagreement forces a re-run.
