"use client";

// GenLayer client management for the browser.
//
// Two account modes:
//  - session key: a locally generated private key kept in localStorage.
//    StudioNet is gasless, so this gives a frictionless flow. Clearly
//    labelled in the UI as a StudioNet session key.
//  - external wallet (MetaMask-compatible) when window.ethereum exists.
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { GenLayerClient, GenLayerChain, Account } from "genlayer-js/types";

const KEY_STORAGE = "ordin.sessionKey.v1";

let cachedRead: GenLayerClient<GenLayerChain> | null = null;
let cachedWrite: GenLayerClient<GenLayerChain> | null = null;
let cachedAccount: Account | null = null;

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
  } catch {
    // storage unavailable (private mode) — fall through to ephemeral key
  }
  if (!pk) {
    pk = generatePrivateKey();
    try {
      window.localStorage.setItem(KEY_STORAGE, pk);
    } catch {
      // ephemeral session only
    }
  }
  cachedAccount = createAccount(pk as `0x${string}`);
  return cachedAccount;
}

export function getWriteClient(): {
  client: GenLayerClient<GenLayerChain>;
  account: Account;
} {
  const account = getSessionAccount();
  if (!cachedWrite) {
    cachedWrite = createClient({ chain: studionet, account });
  }
  return { client: cachedWrite, account };
}

export function getSessionAddress(): string {
  return getSessionAccount().address ?? "";
}

export function resetSessionKey(): string {
  try {
    window.localStorage.removeItem(KEY_STORAGE);
  } catch {
    // ignore
  }
  cachedAccount = null;
  cachedWrite = null;
  return getSessionAddress();
}
