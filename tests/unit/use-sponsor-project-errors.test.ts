import { describe, it, expect } from "vitest";
import { extractErrorMessage } from "@/features/projects/use-sponsor-project";

describe("Sponsor Project Error Extractor — extractErrorMessage", () => {
  it("Case 1: Insufficient Balance — computes required and available XLM values", () => {
    const error = {
      response: {
        data: {
          extras: {
            result_codes: {
              transaction: "tx_failed",
              operations: ["op_underfunded"],
            },
          },
        },
      },
    };

    const res = extractErrorMessage(error, "100.5", "50.0000000");

    expect(res.errorType).toBe("insufficient_funds");
    expect(res.message).toBe(
      "Insufficient balance. You need at least 100.5000100 XLM (including network fee) but your wallet has 50.0000000 XLM."
    );
  });

  it("Case 2: User Rejected / Cancelled Signing", () => {
    const error = new Error("User declined to sign the transaction");
    const res = extractErrorMessage(error);

    expect(res.errorType).toBe("user_rejected");
    expect(res.message).toBe("Transaction cancelled. You declined the signing request in your wallet.");
  });

  it("Case 3: Wallet Not Connected", () => {
    const error = new Error("Wallet not connected");
    const res = extractErrorMessage(error);

    expect(res.errorType).toBe("not_connected");
    expect(res.message).toBe("Connect a Stellar wallet first to sponsor this project.");
  });

  it("Case 4: Destination Account Doesn't Exist / Unfunded (`op_no_destination`)", () => {
    const error = {
      response: {
        data: {
          extras: {
            result_codes: {
              transaction: "tx_failed",
              operations: ["op_no_destination"],
            },
          },
        },
      },
    };

    const res = extractErrorMessage(error);

    expect(res.errorType).toBe("unfunded_destination");
    expect(res.message).toBe("This project's wallet hasn't been activated on Stellar yet. Contact the maintainer.");
  });

  it("Case 5: Invalid / Malformed Destination Public Key", () => {
    const error = new Error("Invalid destination public key format.");
    const res = extractErrorMessage(error);

    expect(res.errorType).toBe("invalid_destination");
    expect(res.message).toBe("This project's maintainer hasn't connected a valid Stellar wallet.");
  });

  it("Case 6: Transaction Expired (`tx_bad_seq` / `tx_too_late`)", () => {
    const error = {
      response: {
        data: {
          extras: {
            result_codes: {
              transaction: "tx_bad_seq",
            },
          },
        },
      },
    };

    const res = extractErrorMessage(error);

    expect(res.errorType).toBe("expired_tx");
    expect(res.message).toBe("This transaction expired before it was submitted. Please try again.");
  });

  it("Case 7: Amount is Zero or Negative", () => {
    const error = new Error("Enter a valid amount greater than 0.");
    const res = extractErrorMessage(error);

    expect(res.errorType).toBe("invalid_amount");
    expect(res.message).toBe("Enter a valid amount greater than 0.");
  });

  it("Case 8: Network / Horizon Unreachable", () => {
    const error = new Error("Failed to fetch from Horizon RPC (504 Timeout)");
    const res = extractErrorMessage(error);

    expect(res.errorType).toBe("network_error");
    expect(res.message).toBe("Network error — couldn't reach Stellar Mainnet. Check your connection and try again.");
  });

  it("Case 9: Unrecognized / Fallback Error — never returns [object Object]", () => {
    const rawObj = { someRandomProp: 123, status: 400 };
    const res = extractErrorMessage(rawObj);

    expect(res.errorType).toBe("unknown");
    expect(res.message).not.toContain("[object Object]");
    expect(res.message).toBe("Something went wrong submitting your transaction. Please try again, or check the browser console for details.");
  });
});
