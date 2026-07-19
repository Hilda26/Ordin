"use client";

// GenLayer client management for the browser.
// Wallet-first: users connect MetaMask or a compatible wallet.
// No auto-generated keys — all on-chain actions require a connected wallet.
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { GenLayerClient, GenLayerChain } from "genlayer-js/types";

const ADDR_STORAGE = "ordin.walletAddress.v1";

let cachedRead: GenLayerClient<GenLayerChain> | null = null;
let cachedWrite: GenLayerClient<GenLayerChain> | null = null;
let connectedAddress: string | null = null;

export function getReadClient(): GenLayerClient<GenLayerChain> {
  if (!cachedRead) {
    cachedRead = createClient({ chain: studionet });
  }
  return cachedRead;
}

export function getConnectedAddress(): string | null {
  if (connectedAddress) return connectedAddress;
  try {
    return window.localStorage.getItem(ADDR_STORAGE);
  } catch {
    return null;
  }
}

export function isWalletConnected(): boolean {
  return !!getConnectedAddress();
}

export function hasExternalWallet(): boolean {
  return typeof window !== "undefined" && !!(window as any).ethereum;
}

export async function connectWallet(): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("No wallet detected. Install MetaMask to continue.");

  const accounts: string[] = await ethereum.request({
    method: "eth_requestAccounts",
  });
  if (!accounts.length) throw new Error("No accounts returned by wallet");

  const address = accounts[0];
  connectedAddress = address;

  cachedWrite = createClient({
    chain: studionet,
    provider: ethereum,
  });

  try {
    window.localStorage.setItem(ADDR_STORAGE, address);
  } catch {}

  return address;
}

export async function reconnectWallet(): Promise<string | null> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) return null;
  const stored = getConnectedAddress();
  if (!stored) return null;

  try {
    const accounts: string[] = await ethereum.request({
      method: "eth_accounts",
    });
    if (accounts.length && accounts[0].toLowerCase() === stored.toLowerCase()) {
      connectedAddress = accounts[0];
      cachedWrite = createClient({
        chain: studionet,
        provider: ethereum,
      });
      return accounts[0];
    }
  } catch {}

  disconnectWallet();
  return null;
}

export function getWriteClient(): {
  client: GenLayerClient<GenLayerChain>;
} {
  if (!cachedWrite) {
    throw new Error("Wallet not connected. Connect your wallet first.");
  }
  return { client: cachedWrite };
}

export function disconnectWallet(): void {
  try {
    window.localStorage.removeItem(ADDR_STORAGE);
  } catch {}
  connectedAddress = null;
  cachedWrite = null;
}
