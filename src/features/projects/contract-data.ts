/**
 * Contract data types and contract address definitions for ProjectRegistry and SponsorshipManager.
 *
 * All project data on SponsorChain originates directly from the on-chain
 * ProjectRegistry and SponsorshipManager Soroban smart contracts — no database,
 * no in-memory seed maps.
 */

/* ── Types (mirror contract structs) ──────────────────────────── */

export interface ProjectData {
  id: bigint;
  owner: string;
  repoFullName: string;
  name: string;
  description: string;
  totalRaised: string; // i128 as decimal string
  sponsorCount: number;
  createdAt: bigint;
  active: boolean;
}

export interface SponsorshipData {
  id: bigint;
  sponsor: string;
  projectId: bigint;
  amount: string; // i128 as decimal string
  timestamp: bigint;
  txHash: string | null;
}

/* ── Contract Addresses ───────────────────────────────────────── */

export const REGISTRY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS ||
  "CATJVEHP2UCMX3MMI2JOIY5TFXODM33ZKUXGGG5AE5QTBGEMXW4EUOQ3";
export const MANAGER_CONTRACT_ID =
  process.env.NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS ||
  "CDADO5ZDVBTTCLXPMDUGN4J4NMG7XMDNTNQDNEELRNIDE7SABASUMZTW";
export const XLM_SAC_ADDRESS =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
