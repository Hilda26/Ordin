import { explorerAddressUrl, explorerTxUrl } from "@/lib/genlayer/config";
import { shortAddress } from "@/lib/format";

export function ExplorerLink({
  kind,
  value,
  label,
}: {
  kind: "tx" | "address";
  value: string;
  label?: string;
}) {
  const href = kind === "tx" ? explorerTxUrl(value) : explorerAddressUrl(value);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-mono-ev underline decoration-rule-strong underline-offset-4 hover:text-oxblood"
      title={value}
    >
      {label ?? shortAddress(value)} ↗
    </a>
  );
}
