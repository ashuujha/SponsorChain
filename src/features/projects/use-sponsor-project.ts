"use client";

import { useReducer, useCallback, useState, useRef, useEffect } from "react";

/* ── Reuse the same lifecycle reducer pattern from create-project ── */

export interface SponsorState {
  status: "idle" | "review" | "pending" | "success" | "failed";
  txHash: string | null;
  errorType:
    | "insufficient_funds"
    | "user_rejected"
    | "invalid_destination"
    | "network_error"
    | "unknown"
    | null;
  errorMessage: string | null;
}

type SponsorAction =
  | { type: "START_REVIEW" }
  | { type: "SUBMIT" }
  | { type: "RECEIVE_HASH"; txHash: string }
  | { type: "SUCCESS" }
  | { type: "FAIL"; error: unknown }
  | { type: "RESET" };

/**
 * Extracts a clean, human-readable error message and classified errorType
 * from any Horizon API error, Stellar SDK error, or wallet rejection object.
 */
function extractErrorMessage(err: unknown): {
  message: string;
  errorType: SponsorState["errorType"];
} {
  // Always log raw error object to console for full developer visibility
  console.error("[SponsorPayment] Raw transaction failure object:", err);

  if (!err) {
    return { message: "An unknown transaction error occurred.", errorType: "unknown" };
  }

  let rawMessage = "";
  let resultCodesStr = "";

  // 1. Inspect Horizon API error structure (Stellar SDK nests Horizon responses under err.response.data)
  type HorizonData = {
    title?: string;
    detail?: string;
    extras?: {
      result_codes?: {
        transaction?: string;
        operations?: string[];
      };
    };
  };

  const errObj = err as {
    message?: unknown;
    response?: { data?: HorizonData };
    error?: unknown;
    details?: unknown;
  };

  const horizonData = errObj?.response?.data;

  if (horizonData?.extras?.result_codes) {
    const codes = horizonData.extras.result_codes;
    const parts = [
      codes.transaction,
      ...(codes.operations ?? []),
    ].filter(Boolean);
    if (parts.length > 0) {
      resultCodesStr = parts.join(", ");
    }
  }

  // 2. Derive rawMessage string
  if (typeof errObj.message === "string" && errObj.message && errObj.message !== "[object Object]") {
    rawMessage = errObj.message;
  } else if (typeof horizonData?.detail === "string" && horizonData.detail) {
    rawMessage = horizonData.detail;
  } else if (typeof horizonData?.title === "string" && horizonData.title) {
    rawMessage = horizonData.title;
  } else if (typeof errObj.error === "string" && errObj.error) {
    rawMessage = errObj.error;
  } else if (typeof errObj.details === "string" && errObj.details) {
    rawMessage = errObj.details;
  } else if (typeof err === "string" && err) {
    rawMessage = err;
  } else {
    try {
      const str = JSON.stringify(err);
      rawMessage = str !== "{}" ? str : "Transaction failed on Stellar network";
    } catch {
      rawMessage = "Transaction failed on Stellar network";
    }
  }

  // Append result_codes if available and not already present
  let fullText = rawMessage;
  if (resultCodesStr && !fullText.includes(resultCodesStr)) {
    fullText = `${fullText} (${resultCodesStr})`;
  }

  // Safety check: ensure string never contains raw "[object Object]"
  if (fullText.includes("[object Object]")) {
    fullText = resultCodesStr
      ? `Stellar error: ${resultCodesStr}`
      : "Transaction failed on Stellar network.";
  }

  // 3. Classify into specific error types
  const lower = fullText.toLowerCase();

  let errorType: SponsorState["errorType"] = "unknown";

  if (
    lower.includes("op_underfunded") ||
    lower.includes("tx_insufficient_balance") ||
    lower.includes("insufficient_balance") ||
    lower.includes("insufficient funds") ||
    lower.includes("underfunded") ||
    lower.includes("op_low_reserve") ||
    lower.includes("unfunded")
  ) {
    errorType = "insufficient_funds";
    fullText = "Your wallet does not have enough XLM balance (or reserve) to complete this transaction.";
  } else if (
    lower.includes("user rejected") ||
    lower.includes("user declined") ||
    lower.includes("user cancelled") ||
    lower.includes("declined by user") ||
    lower.includes("rejected by user") ||
    lower.includes("signature rejected") ||
    lower.includes("user denied")
  ) {
    errorType = "user_rejected";
    fullText = "You declined the signature request in your wallet.";
  } else if (
    lower.includes("op_no_destination") ||
    lower.includes("invalid destination") ||
    lower.includes("destination public key") ||
    lower.includes("no destination") ||
    lower.includes("not found or unfunded")
  ) {
    errorType = "invalid_destination";
    fullText = "The recipient maintainer account is invalid or unfunded on Testnet.";
  } else if (
    lower.includes("network") ||
    lower.includes("timeout") ||
    lower.includes("failed to fetch") ||
    lower.includes("rpc") ||
    lower.includes("horizon") ||
    lower.includes("504") ||
    lower.includes("502")
  ) {
    errorType = "network_error";
    fullText = "Network error connecting to Horizon testnet. Please try again.";
  }

  return { message: fullText, errorType };
}

function sponsorReducer(s: SponsorState, a: SponsorAction): SponsorState {
  switch (a.type) {
    case "START_REVIEW":
      return { status: "review", txHash: null, errorType: null, errorMessage: null };
    case "SUBMIT":
      return { ...s, status: "pending" };
    case "RECEIVE_HASH":
      return { ...s, txHash: a.txHash };
    case "SUCCESS":
      return { ...s, status: "success" };
    case "FAIL": {
      const { message, errorType } = extractErrorMessage(a.error);
      return { status: "failed", txHash: s.txHash, errorType, errorMessage: message };
    }
    case "RESET":
      return { status: "idle", txHash: null, errorType: null, errorMessage: null };
  }
}

const initSponsor: SponsorState = {
  status: "idle",
  txHash: null,
  errorType: null,
  errorMessage: null,
};

export function useSponsorProject(onSuccess?: (txHash: string) => void) {
  const [state, dispatch] = useReducer(sponsorReducer, initSponsor);
  const [amount, setAmount] = useState("");

  // Keep onSuccess in a ref so submit's identity never changes across renders.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  const startReview = useCallback(() => dispatch({ type: "START_REVIEW" }), []);

  const submit = useCallback(
    async (sponsorAddress: string, recipientAddress: string, amountXlm: string) => {
      dispatch({ type: "SUBMIT" });
      try {
        // ── 1. Build unsigned XDR ─────────────────────────────────────────────
        const { preparePaymentTransaction } = await import(
          "@/features/payments/payment-service"
        );
        const unsignedXdr = await preparePaymentTransaction({
          sponsorPublicKey: sponsorAddress,
          destinationPublicKey: recipientAddress,
          amountXLM: amountXlm,
        });

        // ── 2. Sign via StellarWalletsKit (fires the wallet popup) ────────────
        const { getKit } = await import("@/features/wallet/use-wallet");
        const kit = await getKit();

        const { Networks } = await import("stellar-sdk");
        const { signedTxXdr } = await kit.signTransaction(unsignedXdr, {
          networkPassphrase: Networks.TESTNET,
          address: sponsorAddress,
        });

        // ── 3. Reconstruct Transaction from signed XDR ────────────────────────
        const { TransactionBuilder } = await import("stellar-sdk");
        const signedTx = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
        const txHash = (signedTx.hash() as Buffer).toString("hex");

        dispatch({ type: "RECEIVE_HASH", txHash });

        // ── 4. Submit to Horizon testnet ──────────────────────────────────────
        const { Horizon } = await import("stellar-sdk");
        const server = new Horizon.Server("https://horizon-testnet.stellar.org");
        await server.submitTransaction(signedTx);

        dispatch({ type: "SUCCESS" });
        onSuccessRef.current?.(txHash);
      } catch (err: unknown) {
        dispatch({ type: "FAIL", error: err });
      }
    },
    []
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    setAmount("");
  }, []);

  return { state, amount, setAmount, startReview, submit, reset };
}
