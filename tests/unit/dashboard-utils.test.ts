import { describe, it, expect } from "vitest";
import {
  aggregateLiveTotalRaised,
  groupSponsorshipsByProject,
} from "@/features/payments/dashboard-utils";
import { HorizonPaymentEvent } from "@/features/payments/use-live-account-payments";

describe("Dashboard Utilities - aggregateLiveTotalRaised", () => {
  const walletPublicKey = "GD6X4A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z";

  it("should return 0 when payments list is empty", () => {
    const total = aggregateLiveTotalRaised([], walletPublicKey);
    expect(total).toBe(0);
  });

  it("should sum only payment operations directed to the target wallet", () => {
    const mockPayments: HorizonPaymentEvent[] = [
      {
        id: "1",
        type: "payment",
        source_account: "SENDER1",
        to: walletPublicKey,
        from: "SENDER1",
        amount: "150.0000000",
        transaction_hash: "H1",
        created_at: "2026-07-31T06:00:00Z",
      },
      {
        id: "2",
        type: "payment",
        source_account: "SENDER2",
        to: "OTHER_WALLET",
        from: "SENDER2",
        amount: "500.0000000", // to other account (should ignore)
        transaction_hash: "H2",
        created_at: "2026-07-31T06:05:00Z",
      },
      {
        id: "3",
        type: "create_account", // other type (should ignore)
        source_account: "SENDER1",
        to: walletPublicKey,
        from: "SENDER1",
        amount: "10.0000000",
        transaction_hash: "H3",
        created_at: "2026-07-31T06:10:00Z",
      } as unknown as HorizonPaymentEvent,
      {
        id: "4",
        type: "payment",
        source_account: "SENDER3",
        to: walletPublicKey,
        from: "SENDER3",
        amount: "25.5000000",
        transaction_hash: "H4",
        created_at: "2026-07-31T06:15:00Z",
      },
    ];

    const total = aggregateLiveTotalRaised(mockPayments, walletPublicKey);
    expect(total).toBe(175.5);
  });
});

describe("Dashboard Utilities - groupSponsorshipsByProject", () => {
  it("should group, aggregate amounts, and sort sponsorships by contribution size", () => {
    const mockSponsorships = [
      {
        projectId: "p1",
        txHash: "TX1",
        amountXLM: "100.0000000",
        createdAt: "2026-07-30T12:00:00Z",
        project: { name: "Project One", repoUrl: "org/p1" },
      },
      {
        projectId: "p2",
        txHash: "TX2",
        amountXLM: "250.0000000",
        createdAt: "2026-07-31T08:00:00Z",
        project: { name: "Project Two", repoUrl: "org/p2" },
      },
      {
        projectId: "p1",
        txHash: "TX3",
        amountXLM: "50.0000000",
        createdAt: "2026-07-31T10:00:00Z", // more recent date for p1
        project: { name: "Project One", repoUrl: "org/p1" },
      },
    ];

    const result = groupSponsorshipsByProject(mockSponsorships);

    // Group should be sorted by total size: Project Two (250) then Project One (150)
    expect(result.length).toBe(2);

    expect(result[0].projectId).toBe("p2");
    expect(parseFloat(result[0].totalContributedXLM)).toBe(250);
    expect(result[0].mostRecentDate).toBe("2026-07-31T08:00:00Z");

    expect(result[1].projectId).toBe("p1");
    expect(parseFloat(result[1].totalContributedXLM)).toBe(150);
    expect(result[1].mostRecentDate).toBe("2026-07-31T10:00:00Z"); // checks updated recent date
    expect(result[1].transactions.length).toBe(2);
  });
});
