// Deploy the Ordin contract to StudioNet and record the address.
import { makeClient, deploy, read } from "./gl.mjs";
import fs from "node:fs";

const { client, account } = makeClient("deployer");
console.log("deployer:", account.address);

const { address } = await deploy(client, account, "contracts/ordin.py", []);

const counts = await read(client, address, "get_counts", []);
console.log("get_counts:", counts);

fs.writeFileSync(
  "deployment.json",
  JSON.stringify(
    {
      network: "studionet",
      chainId: 61999,
      rpc: "https://studio.genlayer.com/api",
      explorer: "https://explorer-studio.genlayer.com",
      contract: address,
      deployedAt: new Date().toISOString(),
      deployer: account.address,
    },
    null,
    2
  )
);
console.log("\nDEPLOYED:", address, "(written to deployment.json)");
console.log("Set NEXT_PUBLIC_ORDIN_CONTRACT_ADDRESS=" + address);
