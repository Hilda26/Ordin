"use client";

// GenLayer client management for the browser.
//
// Two account modes:
//  - session key: a locally generated private key kept in localStorage.
//    StudioNet is gasless, so this gives a frictionless flow.
//  - external wallet (MetaMask-compatible) via window.ethereum.
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { GenLayerClient, GenLayerChain, Account } from "genlayer-js/types";

const KEY_STORAGE = "ordin.sessionKey.v1";
const MODE_STORAGE = "ordin.walletMode.v1";

export type WalletMode = "session" | "external";

let cachedRead: GenLayerClient<GenLayerChain> | null = null;
let cachedWrite: GenLayerClient<GenLayerChain> | null = null;
let cachedAccount: Account | null = null;
let cachedExternalAddress: string | null = null;
let currentMode: WalletMode = "session";

function loadMode(): WalletMode {
  try {
    const stored = window.localStorage.getItem(MODE_STORAGE);
    if (stored === "external") return "external";
  } catch {}
  return "session";
}

export function getWalletMode(): WalletMode {
  currentMode = loadMode();
  return currentMode;
}

export function getReadClient(): GenLayerClient<GenLayerChain> {
  if (!cachedRead) {
    cachedRead = createClient({ chain: studionet });
  }
  return cachedRead;
}

export function getSessionAccount(): Account {
  if (cachedAccount) return cachedAccount;
  let pk = null;
  try {
    pk = window.localStorage.getItem(KEY_STORAGE);
  } catch {}
  if (!pk) {
    pk = generatePrivateKey();
    try {
      window.localStorage.setItem(KEY_STORAGE, pk);
    } catch {}
  }
  cachedAccount = createAccount(pk as `0x${string}`);
  return cachedAccount;
}

export function getWriteClient(): {
  client: GenLayerClient<GenLayerChain>;
  account: Account;
} {
  const mode = getWalletMode();
  if (mode === "external" && cachedWrite && cachedAccount) {
    return { client: cachedWrite, account: cachedAccount };
  }
  const account = getSessionAccount();
  if (!cachedWrite) {
    cachedWrite = createClient({ chain: studionet, account });
  }
  return { client: cachedWrite, account };
}

export function getSessionAddress(): string {
  const mode = getWalletMode();
  if (mode === "external" && cachedExternalAddress) {
    return cachedExternalAddress;
  }
  return getSessionAccount().address ?? "";
}

export function resetSessionKey(): string {
  try {
    window.localStorage.removeItem(KEY_STORAGE);
  } catch {}
  cachedAccount = null;
  cachedWrite = null;
  return getSessionAddress();
}

export function hasExternalWallet(): boolean {
  return typeof window !== "undefined" && !!(window as any).ethereum;
}

export async function connectExternalWallet(): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("No wallet detected");

  const accounts: string[] = await ethereum.request({
    method: "eth_requestAccounts",
  });
  if (!accounts.length) throw new Error("No accounts returned");

  const address = accounts[0];
  cachedExternalAddress = address;

  cachedWrite = createClient({
    chain: studionet,
    provider: ethereum,
  });

  try {
    window.localStorage.setItem(MODE_STORAGE, "external");
  } catch {}
  currentMode = "external";

  return address;
}

export function disconnectWallet(): void {
  try {
    window.localStorage.removeItem(MODE_STORAGE);
  } catch {}
  currentMode = "session";
  cachedExternalAddress = null;
  cachedWrite = null;
}
