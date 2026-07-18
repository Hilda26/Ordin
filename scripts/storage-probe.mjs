// Deploy the storage probe to StudioNet and exercise every primitive.
import { makeClient, deploy, write, read } from "./gl.mjs";

const { client, account } = makeClient("deployer");
console.log("deployer:", account.address);

try {
  await client.fundAccount({ address: account.address, amount: 1000 });
  console.log("faucet funding ok (studionet is gasless; this is belt-and-braces)");
} catch (e) {
  console.log("fundAccount skipped:", e.message?.slice(0, 120));
}

const { address } = await deploy(client, account, "contracts/storage_probe.py", []);

console.log("\n-- probe_all --");
const w1 = await write(client, account, address, "probe_all", [
  "k1",
  "hello studio",
  42,
  "123456789012345678901234567890",
  true,
]);
console.log("probe_all status:", w1.receipt?.status);

console.log("\n-- probe_append x2 (same key) --");
const a1 = await write(client, account, address, "probe_append", ["list1", "first"]);
console.log("append1:", a1.receipt?.status);
const a2 = await write(client, account, address, "probe_append", ["list1", "second"]);
console.log("append2:", a2.receipt?.status);

console.log("\n-- read_all --");
const r = await read(client, address, "read_all", ["k1"]);
console.log("read_all(k1):", r);
const r2 = await read(client, address, "read_all", ["list1"]);
console.log("read_all(list1):", r2);

console.log("\nPROBE COMPLETE. address:", address);
