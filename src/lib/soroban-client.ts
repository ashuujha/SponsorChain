import {
  SorobanRpc,
  Contract,
  TransactionBuilder,
  Account,
  Address,
  Networks,
  nativeToScVal,
  scValToNative,
} from "stellar-sdk";
import {
  REGISTRY_CONTRACT_ID,
  MANAGER_CONTRACT_ID,
  ProjectData,
  SponsorshipData,
} from "@/features/projects/contract-data";
import { fetchAccountFromHorizon } from "@/features/wallet/wallet-service";

export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";

export const sorobanServer = new SorobanRpc.Server(SOROBAN_RPC_URL);

/**
 * Checks if a project with the given repo_full_name is already registered on-chain.
 */
export async function checkOnChainRepoExists(
  repoFullName: string
): Promise<{ exists: boolean; existingProjectId?: string }> {
  try {
    const allProjects = await fetchOnChainProjects();
    const existing = allProjects.find(
      (p) => p.repoFullName.toLowerCase() === repoFullName.toLowerCase()
    );
    if (existing) {
      return { exists: true, existingProjectId: existing.id.toString() };
    }
  } catch (err) {
    console.warn("On-chain repo check warning:", err);
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
  const contract = new Contract(REGISTRY_CONTRACT_ID);

  let currentStart = start;
  let allProjectIds: bigint[] = [];
  let hasMore = true;

  while (hasMore) {
    const tx = new TransactionBuilder(dummyAccount, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
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
  const contract = new Contract(REGISTRY_CONTRACT_ID);

  const tx = new TransactionBuilder(dummyAccount, {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
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
    return {
      id: BigInt(id),
      owner: (native.owner as string) || "",
      repoFullName: (native.repo_full_name as string) || "",
      name: (native.name as string) || "",
      description: (native.description as string) || "",
      totalRaised: (native.total_raised || 0).toString(),
      sponsorCount: Number(native.sponsor_count || 0),
      createdAt: BigInt(native.created_at || 0),
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
  try {
    const all = await fetchOnChainProjects();
    return all.filter((p) => p.owner.toLowerCase() === owner.toLowerCase());
  } catch (err) {
    console.warn("Error fetching projects by owner:", err);
    return [];
  }
}

/**
 * Fetches sponsorships recorded for a specific project from live contract events.
 */
export async function fetchOnChainSponsorshipsForProject(
  projectId: bigint
): Promise<SponsorshipData[]> {
  try {
    const events = await fetchOnChainActivityEvents();
    const sponsoredEvents = events.filter(
      (e) => e.type === "sponsor_funded" && e.details.projectId === projectId.toString()
    );
    return sponsoredEvents.map((e, idx) => ({
      id: BigInt(idx),
      sponsor: e.details.sponsor || "",
      projectId,
      amount: e.details.amount || "0",
      timestamp: BigInt(Math.floor(new Date(e.ledgerClosedAt).getTime() / 1000)),
      txHash: e.txHash,
    }));
  } catch (err) {
    console.warn("Error fetching sponsorships for project:", err);
    return [];
  }
}

/**
 * Fetches sponsorships initiated by a specific sponsor wallet from live contract events.
 */
export async function fetchOnChainSponsorshipsBySponsor(
  sponsor: string
): Promise<SponsorshipData[]> {
  try {
    const events = await fetchOnChainActivityEvents();
    const sponsorEvents = events.filter(
      (e) => e.type === "sponsor_funded" && e.details.sponsor?.toLowerCase() === sponsor.toLowerCase()
    );
    return sponsorEvents.map((e, idx) => ({
      id: BigInt(idx),
      sponsor: e.details.sponsor || sponsor,
      projectId: BigInt(e.details.projectId || 0),
      amount: e.details.amount || "0",
      timestamp: BigInt(Math.floor(new Date(e.ledgerClosedAt).getTime() / 1000)),
      txHash: e.txHash,
    }));
  } catch (err) {
    console.warn("Error fetching sponsorships by sponsor:", err);
    return [];
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
 * by ProjectRegistry and SponsorshipManager contracts on Stellar Testnet.
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
            { type: "contract", contractIds: [REGISTRY_CONTRACT_ID, MANAGER_CONTRACT_ID] },
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
  const contract = new Contract(REGISTRY_CONTRACT_ID);
  const accountRes = await fetchAccountFromHorizon(ownerPublicKey);
  if (!accountRes) {
    throw new Error("Your wallet account is not funded on Stellar Testnet yet.");
  }
  const sequenceNumber = (accountRes as { sequence?: string }).sequence || "0";
  const sourceAccount = new Account(ownerPublicKey, sequenceNumber);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "1000000",
    networkPassphrase: Networks.TESTNET,
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
    networkPassphrase: Networks.TESTNET,
    address: ownerPublicKey,
  });

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
  const sendRes = await sorobanServer.sendTransaction(signedTx);
  if (sendRes.status === "ERROR" || !sendRes.hash) {
    throw new Error("Failed to submit create_project transaction to Stellar Testnet");
  }

  let projectId = "0";
  try {
    const projects = await fetchOnChainProjects();
    const created = projects.find(
      (p) => p.repoFullName.toLowerCase() === repoFullName.toLowerCase()
    );
    if (created) {
      projectId = created.id.toString();
    }
  } catch (err) {
    console.warn("Could not immediately query created project ID:", err);
  }

  return { txHash: sendRes.hash, projectId };
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
  const contract = new Contract(REGISTRY_CONTRACT_ID);
  const accountRes = await fetchAccountFromHorizon(callerPublicKey);
  if (!accountRes) {
    throw new Error("Wallet account is unfunded or not found on Stellar Testnet.");
  }
  const sequenceNumber = (accountRes as { sequence?: string }).sequence || "0";
  const sourceAccount = new Account(callerPublicKey, sequenceNumber);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "1000000",
    networkPassphrase: Networks.TESTNET,
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
    networkPassphrase: Networks.TESTNET,
    address: callerPublicKey,
  });

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
  const sendRes = await sorobanServer.sendTransaction(signedTx);
  if (sendRes.status === "ERROR" || !sendRes.hash) {
    throw new Error("Failed to submit unlist_project transaction to Stellar Testnet");
  }

  return { txHash: sendRes.hash };
}

export { REGISTRY_CONTRACT_ID, MANAGER_CONTRACT_ID };
