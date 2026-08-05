/**
 * Contract data types and contract address definitions for ProjectRegistry and SponsorshipManager.
 *
 * All project data on SponsorChain originates directly from the on-chain
 * ProjectRegistry and SponsorshipManager Soroban smart contracts — no
 * off-chain project store and no in-memory project map.
 */

/* ── Types (mirror contract structs) ──────────────────────────── */

export interface ProjectData {
  id: bigint;
  owner: string;
  repoFullName: string;
  repositoryOwner: string;
  repositoryName: string;
  name: string;
  description: string;
  totalRaised: string; // i128 as decimal string
  sponsorCount: number; // distinct sponsor addresses
  totalDonations: bigint;
  createdAt: bigint;
  lastSponsoredAt: bigint;
  active: boolean;
}

export interface SponsorshipData {
  id: bigint;
  projectId: bigint;
  sponsor: string;
  amount: string; // i128 as decimal string
  timestamp: bigint;
  txHash: string | null;
  sponsorMessage: string | null;
  donationNumber: bigint;
}

/* ── Contract Addresses ───────────────────────────────────────── */

export const REGISTRY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS || "";
export const MANAGER_CONTRACT_ID =
  process.env.NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS || "";
export const XLM_SAC_ADDRESS =
  process.env.NEXT_PUBLIC_XLM_SAC_ADDRESS || "";

export function requireProjectRegistryContractId(): string {
  if (!REGISTRY_CONTRACT_ID) {
    throw new Error(
      "NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS is required for the Stellar Testnet ProjectRegistry."
    );
  }
  return REGISTRY_CONTRACT_ID;
}

export function requireSponsorshipManagerContractId(): string {
  if (!MANAGER_CONTRACT_ID) {
    throw new Error(
      "NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS is required for Testnet sponsorships."
    );
  }
  return MANAGER_CONTRACT_ID;
}
