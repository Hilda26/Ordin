// Shared GenLayer helpers for deploy/test scripts (StudioNet).
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import fs from "node:fs";
import path from "node:path";

const KEYS_FILE = path.join(process.cwd(), ".genlayer-keys.json");

export function loadOrCreateKey(name = "deployer") {
  let keys = {};
  if (fs.existsSync(KEYS_FILE)) {
    keys = JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));
  }
  if (!keys[name]) {
    keys[name] = generatePrivateKey();
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
    console.log(`generated new ${name} key -> .genlayer-keys.json (gitignored)`);
  }
  return keys[name];
}

export function makeClient(name = "deployer") {
  const account = createAccount(loadOrCreateKey(name));
  const client = createClient({ chain: studionet, account });
  return { client, account };
}

export async function deploy(client, account, file, args = []) {
  const code = fs.readFileSync(file, "utf8");
  const hash = await client.deployContract({ code, args, account });
  console.log("deploy tx:", hash);
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    interval: 3000,
    retries: 60,
  });
  const address =
    receipt?.data?.contract_address ?? receipt?.contract_address ?? null;
  console.log("status:", receipt?.status, "address:", address);
  if (!address) {
    console.error("full receipt:", JSON.stringify(receipt, null, 2).slice(0, 3000));
    throw new Error("no contract address in receipt");
  }
  return { address, receipt };
}

export async function write(client, account, address, functionName, args) {
  const hash = await client.writeContract({ account, address, functionName, args });
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    interval: 3000,
    retries: 100,
  });
  return { hash, receipt };
}

export async function read(client, address, functionName, args) {
  return client.readContract({ address, functionName, args });
}

export { TransactionStatus, studionet };
