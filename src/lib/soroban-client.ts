import {
  SorobanRpc,
  Contract,
  TransactionBuilder,
  Account,
  Networks,
  nativeToScVal,
  scValToNative,
} from "stellar-sdk";
import {
  REGISTRY_CONTRACT_ID,
  MANAGER_CONTRACT_ID,
  ProjectData,
  SponsorshipData,
  getProjectsByOwner,
  getSponsorshipsForProject,
  getSponsorshipsBySponsor,
} from "@/features/projects/contract-data";

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
  return projects.filter((p): p is ProjectData => p !== null);
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
    };
  }

  return null;
}

/**
 * Fetches projects registered by a specific maintainer wallet address.
 */
export async function fetchOnChainProjectsByOwner(
  owner: string
): Promise<ProjectData[]> {
  try {
    const all = await fetchOnChainProjects();
    return all.filter((p) => p.owner.toLowerCase() === owner.toLowerCase());
  } catch {
    return getProjectsByOwner(owner);
  }
}

/**
 * Fetches sponsorships recorded for a specific project.
 */
export async function fetchOnChainSponsorshipsForProject(
  projectId: bigint
): Promise<SponsorshipData[]> {
  try {
    return getSponsorshipsForProject(projectId);
  } catch {
    return [];
  }
}

/**
 * Fetches sponsorships initiated by a specific sponsor wallet.
 */
export async function fetchOnChainSponsorshipsBySponsor(
  sponsor: string
): Promise<SponsorshipData[]> {
  try {
    return getSponsorshipsBySponsor(sponsor);
  } catch {
    return [];
  }
}

export interface OnChainEvent {
  id: string;
  type: "project_created" | "sponsor_funded";
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
 * Fetches real contract events emitted by ProjectRegistry and SponsorshipManager via getEvents.
 */
export async function fetchOnChainActivityEvents(startLedger: number = 3950000): Promise<OnChainEvent[]> {
  try {
    const response = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getEvents",
        params: {
          startLedger,
          filters: [
            {
              type: "contract",
              contractIds: [REGISTRY_CONTRACT_ID, MANAGER_CONTRACT_ID],
            },
          ],
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

export { REGISTRY_CONTRACT_ID, MANAGER_CONTRACT_ID };
