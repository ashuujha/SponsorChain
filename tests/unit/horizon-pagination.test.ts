import { describe, it, expect } from "vitest";
import { aggregateLiveTotalRaised } from "@/features/payments/dashboard-utils";
import { HorizonPaymentEvent } from "@/features/payments/use-live-account-payments";

describe("Horizon Pagination Summation Correctness", () => {
  const walletPublicKey = "GA774A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z";

  it("should aggregate live total correctly across multiple paginated pages of payments", () => {
    // Page 1 of payments returned by Horizon paginated query
    const page1Payments: HorizonPaymentEvent[] = [
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
        to: walletPublicKey,
        from: "SENDER2",
        amount: "50.0000000",
        transaction_hash: "H2",
        created_at: "2026-07-31T06:05:00Z",
      },
    ];

    // Page 2 of payments returned after following the pagination next cursor
    const page2Payments: HorizonPaymentEvent[] = [
      {
        id: "3",
        type: "payment",
        source_account: "SENDER3",
        to: walletPublicKey,
        from: "SENDER3",
        amount: "100.2500000",
        transaction_hash: "H3",
        created_at: "2026-07-31T06:10:00Z",
      },
      {
        id: "4",
        type: "payment",
        source_account: "SENDER4",
        to: walletPublicKey,
        from: "SENDER4",
        amount: "250.7500000",
        transaction_hash: "H4",
        created_at: "2026-07-31T06:15:00Z",
      },
    ];

    // Simulate paging pagination result concatenation
    const allCombinedPayments = [...page1Payments, ...page2Payments];

    const totalSum = aggregateLiveTotalRaised(allCombinedPayments, walletPublicKey);
    
    // Assert 150 + 50 + 100.25 + 250.75 = 551.0
    expect(totalSum).toBe(551.0);
  });
});
