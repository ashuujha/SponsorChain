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
  "CA7LOVDULNNGB5XLFGYMC6PDMFMMLSUQZKO4ZFL7KIKKVRLFNOE5MGXV";
export const MANAGER_CONTRACT_ID =
  process.env.NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS ||
  "CAFJXAO247Y3YGPVKI7PDECOPS7KCZVP3HD33W5FFB2JUWHLT5D56SXL";
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

/* ── Production On-Chain Registry Guard ───────────────────────── */
// NO MOCK/DEMO SEED DATA: All projects on SponsorChain must originate
// exclusively from on-chain ProjectRegistry contract states or explicit
// user transaction submissions. Hardcoded or fallback project objects
// are strictly forbidden in production code paths.
