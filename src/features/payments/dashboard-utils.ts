import { HorizonPaymentEvent } from "./use-live-account-payments";

/**
 * Pure function to aggregate the total XLM raised from Horizon payment events.
 */
export function aggregateLiveTotalRaised(payments: HorizonPaymentEvent[], walletPublicKey: string): number {
  if (!walletPublicKey) return 0;
  
  return payments
    .filter((p) => p.type === "payment" && p.to === walletPublicKey)
    .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
}

export interface GroupedSponsorship {
  projectId: string;
  projectName: string;
  repoUrl: string;
  totalContributedXLM: string;
  mostRecentDate: string;
  transactions: {
    txHash: string;
    amountXLM: string;
    createdAt: string;
  }[];
}

export interface SponsorshipInput {
  projectId: string;
  txHash: string;
  amountXLM: string | number | { toString(): string };
  createdAt: string;
  project: {
    name: string;
    repoUrl: string;
  };
}

/**
 * Pure function to group Postgres sponsorships by project, aggregating amounts and dates.
 */
export function groupSponsorshipsByProject(sponsorships: SponsorshipInput[]): GroupedSponsorship[] {
  const groups: Record<string, GroupedSponsorship> = {};

  for (const s of sponsorships) {
    if (!s.project) continue;
    
    const pid = s.projectId;
    if (!groups[pid]) {
      groups[pid] = {
        projectId: pid,
        projectName: s.project.name,
        repoUrl: s.project.repoUrl,
        totalContributedXLM: "0.0000000",
        mostRecentDate: s.createdAt,
        transactions: [],
      };
    }

    const currentTotal = parseFloat(groups[pid].totalContributedXLM);
    const amount = parseFloat(s.amountXLM?.toString() || "0");
    groups[pid].totalContributedXLM = (currentTotal + amount).toFixed(7);

    if (new Date(s.createdAt) > new Date(groups[pid].mostRecentDate)) {
      groups[pid].mostRecentDate = s.createdAt;
    }

    groups[pid].transactions.push({
      txHash: s.txHash,
      amountXLM: s.amountXLM?.toString() || "0.0000000",
      createdAt: s.createdAt,
    });
  }

  // Sort projects by total contribution size descending
  return Object.values(groups).sort((a, b) => parseFloat(b.totalContributedXLM) - parseFloat(a.totalContributedXLM));
}
