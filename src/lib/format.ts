// Shared formatting helpers.

export function shortAddress(addr: string | undefined | null): string {
  if (!addr) return "—";
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

/** Reward amounts are stored in 6-decimal base units. */
export function formatReward(raw: string | number | bigint, label = ""): string {
  const n = typeof raw === "bigint" ? raw : BigInt(String(raw || "0"));
  const whole = n / 1_000_000n;
  const frac = n % 1_000_000n;
  const fracStr = frac === 0n ? "" : `.${frac.toString().padStart(6, "0").replace(/0+$/, "")}`;
  return `${whole}${fracStr}${label ? " " + label : ""}`;
}

export function toBaseUnits(display: string): bigint {
  const [w, f = ""] = display.trim().split(".");
  const frac = (f + "000000").slice(0, 6);
  return BigInt(w || "0") * 1_000_000n + BigInt(frac || "0");
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}

export function formatTs(ts: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(ts: number): string {
  if (!ts) return "no deadline";
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
