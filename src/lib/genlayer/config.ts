// StudioNet configuration — environment-driven, never hardcoded in components.

export const GENLAYER_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? "61999"
);

export const GENLAYER_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api";

export const GENLAYER_EXPLORER_URL =
  process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL ??
  "https://explorer-studio.genlayer.com";

export const ORDIN_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_ORDIN_CONTRACT_ADDRESS ?? "") as `0x${string}`;

export function explorerTxUrl(hash: string): string {
  return `${GENLAYER_EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${GENLAYER_EXPLORER_URL}/address/${address}`;
}

export function isContractConfigured(): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(ORDIN_CONTRACT_ADDRESS);
}
