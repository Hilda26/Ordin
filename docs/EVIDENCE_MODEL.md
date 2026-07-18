# Evidence model

**Human-entered text is never proof.** Notes, appeal arguments and resolver
explanations are context; completion is proven only by sources the contract
fetches itself.

## Accepted evidence

Public http(s) URLs of these declared types:

```text
GITHUB_REPOSITORY, GITHUB_PULL_REQUEST, GITHUB_ISSUE, PUBLIC_ARTICLE,
PUBLIC_DOCUMENT, PUBLIC_DEPLOYMENT, PACKAGE_RELEASE, PUBLIC_DESIGN,
PUBLIC_DATASET, OTHER_PUBLIC_URL
```

Limits: max 5 URLs per submission (3 extra on appeal), no duplicates, each
fetch truncated to 4000 characters for the prompt.

## Rejected at submission time (deterministic)

- non-http(s) schemes
- credential-bearing URLs (`user@host`)
- localhost / 127.* / 10.* / 192.168.* / 172.16.* / 169.254.* / `.local` / `.internal`
- empty evidence lists, > 5 URLs, duplicate URLs

## Classified at review time (consensus)

- unreachable or login-gated sources → recorded `FETCH_FAILED` in the fetch
  log; if **no** source fetches, the verdict is forced to
  `INSUFFICIENT_EVIDENCE` deterministically inside the closure
- content that ignores the policy → criterion FAILs
- instructions embedded in fetched pages → explicitly ignored per the prompt's
  security rules (fetched content is data, not instruction)

## Snapshots

Each review stores a compact fetch log (`url`, `status`) inside the canonical
result JSON rather than full page bodies (StudioNet storage economy). Evidence
versions are preserved: `s_evidence` holds the current set,
`s_evidence_history` every prior set, and re-reviews receive the previous
version for comparison and regression detection.

## UI obligations

- The submission composer validates URLs client-side and warns that the
  contract's own fetch may still differ.
- Every surface that shows a contributor note labels it
  "context, not proof".
- Fetch outcomes render per-source (`FETCHED` / `FETCH_FAILED` /
  `BLOCKED_URL`) in the case file.
