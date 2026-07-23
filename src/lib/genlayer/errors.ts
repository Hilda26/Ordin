// Human-readable mapping of GenLayer/RPC failures.

export class OrdinChainError extends Error {
  readonly kind: "rpc" | "contract" | "wallet" | "config" | "unknown";
  constructor(kind: OrdinChainError["kind"], message: string) {
    super(message);
    this.kind = kind;
  }
}

function chainErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : typeof e === "string" ? e : String(e);
}

export function isTransientRpcSubmitError(e: unknown): boolean {
  const raw = chainErrorMessage(e).toLowerCase();
  return (
    raw.includes("0x107d") ||
    raw.includes("not currently accepting transactions") ||
    raw.includes("pipeline backpressure") ||
    raw.includes("l1_sender_commit")
  );
}

export function humanizeChainError(e: unknown): OrdinChainError {
  const raw = chainErrorMessage(e);

  // contract-level rejections carry our deterministic prefixes
  const expected = raw.match(/EXPECTED:\s*([^"\n]+)/);
  if (expected) return new OrdinChainError("contract", expected[1].trim());
  if (raw.includes("LLM_ERROR"))
    return new OrdinChainError(
      "contract",
      "The consensus review could not produce a valid result. The case state is unchanged — you can retry the review."
    );
  if (raw.includes("Contract") && raw.includes("not found"))
    return new OrdinChainError(
      "config",
      "The Ordin contract address is not recognised on StudioNet. Check NEXT_PUBLIC_ORDIN_CONTRACT_ADDRESS."
    );
  if (isTransientRpcSubmitError(raw))
    return new OrdinChainError(
      "rpc",
      "StudioNet is temporarily busy and rejected the transaction before it entered the queue. Wait a few seconds and retry."
    );
  if (raw.includes("Failed to fetch") || raw.includes("fetch failed") || raw.includes("NetworkError"))
    return new OrdinChainError(
      "rpc",
      "Could not reach the StudioNet RPC endpoint. Check your connection and retry."
    );
  if (raw.includes("User rejected") || raw.includes("user rejected"))
    return new OrdinChainError("wallet", "The wallet request was rejected.");
  if (raw.includes("timeout") || raw.includes("Timed out") || raw.includes("retries"))
    return new OrdinChainError(
      "rpc",
      "StudioNet did not confirm the transaction in time. It may still land — reconcile against on-chain state before retrying."
    );
  return new OrdinChainError("unknown", raw.slice(0, 300));
}
