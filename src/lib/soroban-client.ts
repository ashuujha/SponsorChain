import {
  SorobanRpc,
  Contract,
  TransactionBuilder,
  Account,
  Address,
  nativeToScVal,
  scValToNative,
} from "stellar-sdk";
import {
  REGISTRY_CONTRACT_ID,
  MANAGER_CONTRACT_ID,
  requireProjectRegistryContractId,
  requireSponsorshipManagerContractId,
  ProjectData,
  SponsorshipData,
} from "@/features/projects/contract-data";
import { fetchAccountFromHorizon } from "@/features/wallet/wallet-service";
import { NETWORK_PASSPHRASE, SOROBAN_RPC_URL } from "@/lib/stellar-config";

export const sorobanServer = new SorobanRpc.Server(SOROBAN_RPC_URL);

const READ_ACCOUNT = new Account(
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  "0"
);

async function simulateReadCall(
  operation: ReturnType<Contract["call"]>
): Promise<unknown> {
  const tx = new TransactionBuilder(READ_ACCOUNT, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simResult = await sorobanServer.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
    throw new Error("Soroban RPC sponsorship read simulation failed");
  }

  const val = simResult.result?.retval;
  return val ? scValToNative(val) : null;
}

function parseSponsorship(native: unknown): SponsorshipData | null {
  if (!native || typeof native !== "object") return null;
  const record = native as Record<string, unknown>;
  return {
    id: BigInt(record.id as string | number | bigint),
    projectId: BigInt(record.project_id as string | number | bigint),
    sponsor: (record.sponsor as string) || "",
    amount: (record.amount || 0).toString(),
    timestamp: BigInt(record.timestamp as string | number | bigint),
    txHash: (record.transaction_hash as string) || null,
    sponsorMessage: (record.sponsor_message as string) || null,
    donationNumber: BigInt(record.donation_number as string | number | bigint),
  };
}

/**
 * Checks if a project with the given repo_full_name is already registered on-chain.
 */
export async function checkOnChainRepoExists(
  repoFullName: string
): Promise<{ exists: boolean; existingProjectId?: string }> {
  const allProjects = await fetchOnChainProjects();
  const existing = allProjects.find(
    (p) => p.repoFullName.toLowerCase() === repoFullName.toLowerCase()
  );
  if (existing) {
    return { exists: true, existingProjectId: existing.id.toString() };
  }
  return { exists: false };
}

/**
 * Fetches registered project IDs from ProjectRegistry via list_projects(start, limit) simulation,
 * then fetches full metadata for each project ID via get_project(id). Includes automatic pagination.
 */
export async function fetchOnChainProjects(
  start: number = 0,
  limit: number = 50
): Promise<ProjectData[]> {
  const dummyAccount = new Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0"
  );
  const contract = new Contract(requireProjectRegistryContractId());

  let currentStart = start;
  let allProjectIds: bigint[] = [];
  let hasMore = true;

  while (hasMore) {
    const tx = new TransactionBuilder(dummyAccount, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "list_projects",
          nativeToScVal(currentStart, { type: "u64" }),
          nativeToScVal(limit, { type: "u32" })
        )
      )
      .setTimeout(30)
      .build();

    const simResult = await sorobanServer.simulateTransaction(tx);
    if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
      throw new Error("Soroban RPC list_projects simulation failed");
    }

    const val = simResult.result?.retval;
    if (!val) {
      hasMore = false;
      break;
    }

    const ids = scValToNative(val);
    if (Array.isArray(ids)) {
      const bigIntIds = ids.map((i: unknown) => BigInt(i as number | string | bigint));
      allProjectIds = [...allProjectIds, ...bigIntIds];
      if (ids.length < limit) {
        hasMore = false;
      } else {
        currentStart += limit;
      }
    } else {
      hasMore = false;
    }
  }

  if (allProjectIds.length === 0) {
    return [];
  }

  const projects = await Promise.all(
    allProjectIds.map(async (id) => {
      return await fetchOnChainProject(id);
    })
  );
  return projects.filter((p): p is ProjectData => p !== null && p.active);
}

/**
 * Fetches a single project by ID from on-chain storage via get_project(id) simulation.
 * Throws an explicit error if the RPC query fails.
 */
export async function fetchOnChainProject(
  id: bigint
): Promise<ProjectData | null> {
  const dummyAccount = new Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0"
  );
  const contract = new Contract(requireProjectRegistryContractId());

  const tx = new TransactionBuilder(dummyAccount, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call("get_project", nativeToScVal(id, { type: "u64" }))
    )
    .setTimeout(30)
    .build();

  const simResult = await sorobanServer.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
    throw new Error(`Soroban RPC get_project simulation failed for project ID ${id}`);
  }

  const val = simResult.result?.retval;
  if (!val) return null;

  const native = scValToNative(val);
  if (native) {
    const [legacyRepositoryOwner = "", legacyRepositoryName = ""] = String(
      native.repo_full_name || ""
    ).split("/");
    return {
      id: BigInt(id),
      owner: (native.owner as string) || "",
      repoFullName: (native.repo_full_name as string) || "",
      repositoryOwner:
        (native.repository_owner as string) || legacyRepositoryOwner,
      repositoryName: (native.repository_name as string) || legacyRepositoryName,
      name: (native.name as string) || "",
      description: (native.description as string) || "",
      totalRaised: (native.total_raised || 0).toString(),
      sponsorCount: Number(native.sponsor_count || 0),
      totalDonations: BigInt(native.total_donations || 0),
      createdAt: BigInt(native.created_at || 0),
      lastSponsoredAt: BigInt(native.last_sponsored_at || 0),
      active: typeof native.active === "boolean" ? native.active : true,
    };
  }

  return null;
}

/**
 * Fetches projects registered by a specific maintainer wallet address directly from live chain storage.
 */
export async function fetchOnChainProjectsByOwner(
  owner: string
): Promise<ProjectData[]> {
  const all = await fetchOnChainProjects();
  return all.filter((p) => p.owner.toLowerCase() === owner.toLowerCase());
}

/**
 * Fetches canonical sponsorship records for a specific project from Soroban storage.
 */
export async function fetchOnChainSponsorshipsForProject(
  projectId: bigint,
  start: number = 0,
  limit: number = 50
): Promise<SponsorshipData[]> {
  try {
    const contract = new Contract(requireSponsorshipManagerContractId());
    const native = await simulateReadCall(
      contract.call(
        "get_project_sponsorships",
        nativeToScVal(projectId, { type: "u64" }),
        nativeToScVal(start, { type: "u64" }),
        nativeToScVal(limit, { type: "u32" })
      )
    );
    if (!Array.isArray(native)) return [];
    return native
      .map(parseSponsorship)
      .filter((record): record is SponsorshipData => record !== null);
  } catch (err) {
    console.warn("Error fetching sponsorship records for project:", err);
    throw err;
  }
}

/**
 * Fetches canonical sponsorship history initiated by a sponsor wallet.
 */
export async function fetchOnChainSponsorshipsBySponsor(
  sponsor: string,
  start: number = 0,
  limit: number = 50
): Promise<SponsorshipData[]> {
  try {
    const contract = new Contract(requireSponsorshipManagerContractId());
    const native = await simulateReadCall(
      contract.call(
        "get_sponsor_history",
        new Address(sponsor).toScVal(),
        nativeToScVal(start, { type: "u64" }),
        nativeToScVal(limit, { type: "u32" })
      )
    );
    if (!Array.isArray(native)) return [];
    return native
      .map(parseSponsorship)
      .filter((record): record is SponsorshipData => record !== null);
  } catch (err) {
    console.warn("Error fetching sponsor history:", err);
    throw err;
  }
}

export interface OnChainEvent {
  id: string;
  type: "project_created" | "sponsor_funded" | "project_unlisted";
  contractId: string;
  txHash: string;
  ledger: number;
  ledgerClosedAt: string;
  details: {
    projectId?: string;
    owner?: string;
    repoFullName?: string;
    sponsor?: string;
    amount?: string;
  };
}

/**
 * Queries getEvents endpoint on Soroban RPC for live contract events emitted
 * by ProjectRegistry and SponsorshipManager contracts on Stellar Mainnet.
 */
export async function fetchOnChainActivityEvents(): Promise<OnChainEvent[]> {
  try {
    const startLedger = 0;
    const response = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "events-query",
        method: "getEvents",
        params: {
          startLedger,
          filters: [
            {
              type: "contract",
              contractIds: [REGISTRY_CONTRACT_ID, MANAGER_CONTRACT_ID].filter(Boolean),
            },
          ],
          pagination: { limit: 100 },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Soroban RPC returned HTTP status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || "Soroban RPC getEvents query error");
    }

    const rawEvents = data.result?.events || [];
    return rawEvents.map((evt: Record<string, unknown>) => {
      const isProjectCreated = evt.contractId === REGISTRY_CONTRACT_ID;
      return {
        id: (evt.id as string) || (evt.txHash as string),
        type: isProjectCreated ? "project_created" : "sponsor_funded",
        contractId: evt.contractId as string,
        txHash: evt.txHash as string,
        ledger: evt.ledger as number,
        ledgerClosedAt: (evt.ledgerClosedAt as string) || new Date().toISOString(),
        details: {
          contractId: evt.contractId as string,
        },
      };
    });
  } catch (err) {
    console.warn("Error querying Soroban contract events:", err);
    return [];
  }
}

/**
 * Registers a project on-chain via ProjectRegistry.create_project(owner, repo_full_name, name, description).
 */
export async function createOnChainProject({
  ownerPublicKey,
  repoFullName,
  name,
  description,
  kit,
}: {
  ownerPublicKey: string;
  repoFullName: string;
  name: string;
  description: string;
  kit: { signTransaction: (xdr: string, opts: { networkPassphrase: string; address: string }) => Promise<{ signedTxXdr: string }> };
}): Promise<{ txHash: string; projectId: string }> {
  const contract = new Contract(requireProjectRegistryContractId());
  const accountRes = await fetchAccountFromHorizon(ownerPublicKey);
  if (!accountRes) {
    throw new Error("Your wallet account is not funded on Stellar Mainnet yet.");
  }
  const sequenceNumber = (accountRes as { sequence?: string }).sequence || "0";
  const sourceAccount = new Account(ownerPublicKey, sequenceNumber);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
    timebounds: { minTime: 0, maxTime: Math.floor(Date.now() / 1000) + 600 },
  })
    .addOperation(
      contract.call(
        "create_project",
        new Address(ownerPublicKey).toScVal(),
        nativeToScVal(repoFullName, { type: "string" }),
        nativeToScVal(name, { type: "string" }),
        nativeToScVal(description, { type: "string" })
      )
    )
    .build();

  const preparedTx = await sorobanServer.prepareTransaction(tx);
  const { signedTxXdr } = await kit.signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: ownerPublicKey,
  });

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const sendRes = await sorobanServer.sendTransaction(signedTx);
  if (sendRes.status === "ERROR" || !sendRes.hash) {
    throw new Error("Failed to submit create_project transaction to Stellar Mainnet");
  }

  const finalized = await waitForSorobanTransaction(sendRes.hash);
  const projectId = finalized.returnValue
    ? String(scValToNative(finalized.returnValue))
    : "0";

  return { txHash: sendRes.hash, projectId };
}

function xlmToStroops(amountXlm: string): bigint {
  const normalized = amountXlm.trim();
  if (!/^\d+(\.\d{1,7})?$/.test(normalized)) {
    throw new Error("Sponsorship amount must be a valid XLM decimal amount.");
  }
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, "0"));
}

async function waitForSorobanTransaction(
  hash: string
): Promise<SorobanRpc.Api.GetSuccessfulTransactionResponse> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = await sorobanServer.getTransaction(hash);
    if (result.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      return result;
    }
    if (result.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error("Soroban transaction failed on Stellar Mainnet.");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Soroban transaction did not finalize before timeout.");
}

/**
 * Transfers XLM through the SponsorshipManager and atomically persists the
 * canonical sponsorship record and project statistics on Soroban.
 */
export async function sponsorOnChainProject({
  sponsorPublicKey,
  projectId,
  amountXlm,
  sponsorMessage,
  kit,
}: {
  sponsorPublicKey: string;
  projectId: bigint;
  amountXlm: string;
  sponsorMessage?: string;
  kit: { signTransaction: (xdr: string, opts: { networkPassphrase: string; address: string }) => Promise<{ signedTxXdr: string }> };
}): Promise<{ txHash: string; sponsorshipId: string | null }> {
  const manager = new Contract(requireSponsorshipManagerContractId());
  const accountRes = await fetchAccountFromHorizon(sponsorPublicKey);
  if (!accountRes) {
    throw new Error("Sponsor account is unfunded or not found on Stellar Mainnet.");
  }
  const sequenceNumber = (accountRes as { sequence?: string }).sequence || "0";
  const sourceAccount = new Account(sponsorPublicKey, sequenceNumber);
  const amountStroops = xlmToStroops(amountXlm);
  const message = sponsorMessage?.trim();

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
    timebounds: { minTime: 0, maxTime: Math.floor(Date.now() / 1000) + 600 },
  })
    .addOperation(
      manager.call(
        "sponsor_with_message",
        new Address(sponsorPublicKey).toScVal(),
        nativeToScVal(projectId, { type: "u64" }),
        nativeToScVal(amountStroops, { type: "i128" }),
        message ? nativeToScVal(message, { type: "string" }) : nativeToScVal(undefined)
      )
    )
    .build();

  const preparedTx = await sorobanServer.prepareTransaction(tx);
  const { signedTxXdr } = await kit.signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: sponsorPublicKey,
  });
  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const sendRes = await sorobanServer.sendTransaction(signedTx);
  if (sendRes.status === "ERROR" || !sendRes.hash) {
    throw new Error("Failed to submit sponsorship transaction to Stellar Mainnet.");
  }

  const finalized = await waitForSorobanTransaction(sendRes.hash);
  const sponsorshipId = finalized.returnValue
    ? String(scValToNative(finalized.returnValue))
    : null;
  return { txHash: sendRes.hash, sponsorshipId };
}

/**
 * Unlists a project on-chain via ProjectRegistry.unlist_project(id, caller) with wallet signature auth.
 */
export async function unlistOnChainProject({
  projectId,
  callerPublicKey,
  kit,
}: {
  projectId: bigint;
  callerPublicKey: string;
  kit: { signTransaction: (xdr: string, opts: { networkPassphrase: string; address: string }) => Promise<{ signedTxXdr: string }> };
}): Promise<{ txHash: string }> {
  const contract = new Contract(requireProjectRegistryContractId());
  const accountRes = await fetchAccountFromHorizon(callerPublicKey);
  if (!accountRes) {
    throw new Error("Wallet account is unfunded or not found on Stellar Mainnet.");
  }
  const sequenceNumber = (accountRes as { sequence?: string }).sequence || "0";
  const sourceAccount = new Account(callerPublicKey, sequenceNumber);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
    timebounds: { minTime: 0, maxTime: Math.floor(Date.now() / 1000) + 600 },
  })
    .addOperation(
      contract.call(
        "unlist_project",
        nativeToScVal(projectId, { type: "u64" }),
        new Address(callerPublicKey).toScVal()
      )
    )
    .build();

  const preparedTx = await sorobanServer.prepareTransaction(tx);
  const { signedTxXdr } = await kit.signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: callerPublicKey,
  });

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const sendRes = await sorobanServer.sendTransaction(signedTx);
  if (sendRes.status === "ERROR" || !sendRes.hash) {
    throw new Error("Failed to submit unlist_project transaction to Stellar Mainnet");
  }

  await waitForSorobanTransaction(sendRes.hash);
  return { txHash: sendRes.hash };
}

/** Transfers the on-chain maintainer authority after the current maintainer signs. */
export async function transferMaintainerOnChainProject({
  projectId,
  newMaintainerPublicKey,
  currentMaintainerPublicKey,
  kit,
}: {
  projectId: bigint;
  newMaintainerPublicKey: string;
  currentMaintainerPublicKey: string;
  kit: { signTransaction: (xdr: string, opts: { networkPassphrase: string; address: string }) => Promise<{ signedTxXdr: string }> };
}): Promise<{ txHash: string }> {
  const contract = new Contract(requireProjectRegistryContractId());
  const accountRes = await fetchAccountFromHorizon(currentMaintainerPublicKey);
  if (!accountRes) {
    throw new Error("Current maintainer account is unfunded or not found on Stellar Mainnet.");
  }
  const sequenceNumber = (accountRes as { sequence?: string }).sequence || "0";
  const sourceAccount = new Account(currentMaintainerPublicKey, sequenceNumber);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
    timebounds: { minTime: 0, maxTime: Math.floor(Date.now() / 1000) + 600 },
  })
    .addOperation(
      contract.call(
        "transfer_maintainer",
        nativeToScVal(projectId, { type: "u64" }),
        new Address(newMaintainerPublicKey).toScVal()
      )
    )
    .build();

  const preparedTx = await sorobanServer.prepareTransaction(tx);
  const { signedTxXdr } = await kit.signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: currentMaintainerPublicKey,
  });
  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const sendRes = await sorobanServer.sendTransaction(signedTx);
  if (sendRes.status === "ERROR" || !sendRes.hash) {
    throw new Error("Failed to submit transfer_maintainer transaction to Stellar Mainnet");
  }
  await waitForSorobanTransaction(sendRes.hash);
  return { txHash: sendRes.hash };
}

export { REGISTRY_CONTRACT_ID, MANAGER_CONTRACT_ID };
