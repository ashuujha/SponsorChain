import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.env.PROJECT_ROOT ?? process.cwd());
const [registry, manager, xlmSac, registryHash, managerHash, registryInit, managerInit, link] =
  process.argv.slice(2);

const required = { registry, manager, xlmSac, registryHash, managerHash, registryInit, managerInit, link };
for (const [name, value] of Object.entries(required)) {
  if (!value) throw new Error(`Missing deployment artifact argument: ${name}`);
}

const network = process.env.STELLAR_NETWORK ?? "testnet";
const rpc = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const horizon = process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const explorer = process.env.EXPLORER_BASE ?? "https://stellar.expert/explorer/testnet";
const passphrase = "Test SDF Network ; September 2015";
const commit = process.env.GITHUB_SHA ?? "local";
const timestamp = new Date().toISOString();

const deployment = {
  schemaVersion: 1,
  network: network.toLowerCase(),
  networkPassphrase: passphrase,
  rpcEndpoint: rpc,
  horizonEndpoint: horizon,
  explorerBase: explorer,
  deployedAt: timestamp,
  gitCommit: commit,
  initialization: {
    projectRegistry: registryInit,
    sponsorshipManager: managerInit,
    sponsorshipManagerLinked: link,
    complete: true,
  },
  contracts: {
    projectRegistry: { id: registry, wasmHash: registryHash },
    sponsorshipManager: { id: manager, wasmHash: managerHash },
    nativeXlmSac: { id: xlmSac },
  },
};

await writeFile(resolve(root, "deployment.json"), `${JSON.stringify(deployment, null, 2)}\n`);

const env = [
  `NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS=${registry}`,
  `NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS=${manager}`,
  `NEXT_PUBLIC_XLM_SAC_ADDRESS=${xlmSac}`,
  `NEXT_PUBLIC_STELLAR_NETWORK=${network.toUpperCase()}`,
  `NEXT_PUBLIC_SOROBAN_RPC_URL=${rpc}`,
  `NEXT_PUBLIC_HORIZON_URL=${horizon}`,
  `NEXT_PUBLIC_EXPLORER_BASE=${explorer}`,
].join("\n") + "\n";
await writeFile(resolve(root, "deployment.env"), env);

const githubEnv = process.env.GITHUB_ENV;
if (githubEnv) await writeFile(githubEnv, env, { flag: "a" });
const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
  await writeFile(
    githubOutput,
    `deployment_file=${resolve(root, "deployment.json")}\n` +
      `registry_contract_id=${registry}\n` +
      `manager_contract_id=${manager}\n`,
    { flag: "a" },
  );
}

console.log(`Generated deployment.json and deployment.env for ${network} at ${timestamp}`);
