/**
 * Contract data access layer for ProjectRegistry and SponsorshipManager.
 *
 * All reads fetch directly from the Soroban contracts — no database, no
 * Horizon queries for project totals. In production these call the RPC's
 * simulateTransaction endpoint; for the checkpoint they use a mock registry.
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
}

export interface SponsorshipData {
  id: bigint;
  sponsor: string;
  projectId: bigint;
  amount: string; // i128 as decimal string
  timestamp: bigint;
  txHash: string | null; // real Horizon tx hash, null for legacy/mock entries
}

/* ── Mock registry (checkpoint — replace with RPC calls) ──────── */

let _nextId = BigInt(0);
const _projects = new Map<string, ProjectData>(); // keyed by id.toString()
const _sponsorships = new Map<string, SponsorshipData[]>();

function _projectKey(id: bigint) {
  return id.toString();
}

export const REGISTRY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS ||
  "CDTINQP4HOUWLLCUCGOVTLPYHVHVP3KIYVVCKWHPIWQEIOGO775FIDN6";
export const MANAGER_CONTRACT_ID =
  process.env.NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS ||
  "CAV2XETV4LWJ5XG7N2MNHRSZZHNJQS3LMWLWK3J5FW5O5U45KPUSROLR";
export const XLM_SAC_ADDRESS =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/* ── Public API ────────────────────────────────────────────────── */

export function createMockProject(
  owner: string,
  repoFullName: string,
  name: string,
  description: string
): bigint {
  const id = _nextId++;
  const project: ProjectData = {
    id,
    owner,
    repoFullName,
    name,
    description,
    totalRaised: "0",
    sponsorCount: 0,
    createdAt: BigInt(Math.floor(Date.now() / 1000)),
  };
  _projects.set(_projectKey(id), project);
  return id;
}

export function mockSponsor(
  sponsor: string,
  projectId: bigint,
  amount: bigint,
  txHash: string | null = null
): bigint {
  const key = _projectKey(projectId);
  const project = _projects.get(key);
  if (!project) throw new Error("Project not found");

  project.totalRaised = (
    BigInt(project.totalRaised) + amount
  ).toString();
  project.sponsorCount += 1;
  _projects.set(key, project);

  const list = _sponsorships.get(key) || [];
  const id = BigInt(list.length);
  list.push({
    id,
    sponsor,
    projectId,
    amount: amount.toString(),
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
    txHash,
  });
  _sponsorships.set(key, list);
  return id;
}

export function getProjects(start: bigint, limit: number): ProjectData[] {
  const result: ProjectData[] = [];
  const maxId = start + BigInt(limit);
  for (let i = start; i < maxId; i++) {
    const p = _projects.get(_projectKey(i));
    if (p) result.push(p);
  }
  return result;
}

export function getProject(id: bigint): ProjectData | null {
  return _projects.get(_projectKey(id)) ?? null;
}

export function getProjectsByOwner(owner: string): ProjectData[] {
  const result: ProjectData[] = [];
  _projects.forEach((p) => {
    if (p.owner === owner) result.push(p);
  });
  return result;
}

export function getSponsorshipsForProject(
  projectId: bigint
): SponsorshipData[] {
  return _sponsorships.get(_projectKey(projectId)) ?? [];
}

export function getSponsorshipsBySponsor(
  sponsor: string
): SponsorshipData[] {
  const result: SponsorshipData[] = [];
  _sponsorships.forEach((list) => {
    for (const s of list) {
      if (s.sponsor === sponsor) result.push(s);
    }
  });
  return result;
}

export function getAllProjects(): ProjectData[] {
  return Array.from(_projects.values());
}

/* ── Seed some demo projects for the checkpoint ────────────────── */

// Seed runs once at import time in non-prod
if (typeof window !== "undefined" && _projects.size === 0) {
  createMockProject(
    "GD6X4ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
    "stellar/js-stellar-sdk",
    "js-stellar-sdk",
    "JavaScript client library for communicating with a Horizon server."
  );
  createMockProject(
    "GD6X4ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
    "stellar/soroban-examples",
    "soroban-examples",
    "Essential example contracts for Soroban smart contract development on Stellar."
  );
  createMockProject(
    "GXYZ9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA98765432",
    "stellar/stellar-core",
    "stellar-core",
    "Stellar Core — the reference implementation of the Stellar Consensus Protocol."
  );
  createMockProject(
    "GXYZ9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA98765432",
    "stellar-freighter/freighter",
    "freighter",
    "Freighter is a Stellar wallet browser extension for Chrome, Firefox, and Brave."
  );
}
