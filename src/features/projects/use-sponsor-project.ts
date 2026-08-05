"use client";

import { useReducer, useState, useCallback, useRef, useEffect } from "react";

export interface SponsorState {
  status: "idle" | "review" | "pending" | "success" | "failed";
  txHash: string | null;
  errorType:
    | "insufficient_funds"
    | "user_rejected"
    | "not_connected"
    | "unfunded_destination"
    | "invalid_destination"
    | "network_error"
    | "expired_tx"
    | "invalid_amount"
    | "unknown"
    | null;
  errorMessage: string | null;
}

type SponsorAction =
  | { type: "START_REVIEW" }
  | { type: "SUBMIT" }
  | { type: "RECEIVE_HASH"; txHash: string }
  | { type: "SUCCESS" }
  | { type: "FAIL"; error: unknown; amountXlm?: string; walletBalance?: string }
  | { type: "RESET" };

/**
 * Extracts a clean, human-readable error message and classified errorType
 * from any Horizon API error, Stellar SDK error, wallet rejection, or balance check.
 */
export function extractErrorMessage(
  err: unknown,
  amountXlm?: string,
  walletBalance?: string
): {
  message: string;
  errorType: NonNullable<SponsorState["errorType"]>;
} {
  // Always log raw error object to console for full developer visibility
  console.error("[SponsorPayment] Raw transaction failure object:", err);

  if (!err) {
    return {
      message: "Something went wrong submitting your transaction. Please try again, or check the browser console for details.",
      errorType: "unknown",
    };
  }

  let rawMessage = "";
  let txResultCode = "";
  let opResultCodes: string[] = [];

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
    code?: unknown;
  };

  const horizonData = errObj?.response?.data;

  if (horizonData?.extras?.result_codes) {
    const codes = horizonData.extras.result_codes;
    txResultCode = codes.transaction || "";
    opResultCodes = codes.operations || [];
  }

  // 2. Derive rawMessage string safely
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
    rawMessage = "Something went wrong submitting your transaction. Please try again, or check the browser console for details.";
  }

  const allCodes = [txResultCode, ...opResultCodes].join(" ").toLowerCase();
  const lowerText = `${rawMessage} ${allCodes}`.toLowerCase();

  // ── Case 1: Insufficient Balance ──────────────────────────────────────────
  if (
    opResultCodes.includes("op_underfunded") ||
    opResultCodes.includes("op_low_reserve") ||
    txResultCode === "tx_insufficient_balance" ||
    lowerText.includes("insufficient") ||
    lowerText.includes("underfunded") ||
    lowerText.includes("low_reserve") ||
    lowerText.includes("not hold enough xlm")
  ) {
    const attempted = parseFloat(amountXlm || "0");
    const fee = 0.00001; // Base fee (100 stroops = 0.00001 XLM)
    const requiredXlm = attempted > 0 ? (attempted + fee).toFixed(7) : "0.0000000";
    const availableXlm = walletBalance ? parseFloat(walletBalance).toFixed(7) : "0.0000000";

    return {
      message: `Insufficient balance. You need at least ${requiredXlm} XLM (including network fee) but your wallet has ${availableXlm} XLM.`,
      errorType: "insufficient_funds",
    };
  }

  // ── Case 2: User Rejected / Cancelled Signing ────────────────────────────
  if (
    lowerText.includes("user rejected") ||
    lowerText.includes("user declined") ||
    lowerText.includes("user cancelled") ||
    lowerText.includes("declined by user") ||
    lowerText.includes("rejected by user") ||
    lowerText.includes("signature rejected") ||
    lowerText.includes("user denied") ||
    lowerText.includes("popup closed") ||
    lowerText.includes("closed by user")
  ) {
    return {
      message: "Transaction cancelled. You declined the signing request in your wallet.",
      errorType: "user_rejected",
    };
  }

  // ── Case 3: Wallet Not Connected ─────────────────────────────────────────
  if (
    lowerText.includes("connect a stellar wallet") ||
    lowerText.includes("wallet not connected") ||
    lowerText.includes("no wallet connected")
  ) {
    return {
      message: "Connect a Stellar wallet first to sponsor this project.",
      errorType: "not_connected",
    };
  }

  // ── Case 4: Destination Account Doesn't Exist / Unfunded (`op_no_destination`) ──
  if (
    opResultCodes.includes("op_no_destination") ||
    lowerText.includes("op_no_destination") ||
    lowerText.includes("not found or unfunded") ||
    lowerText.includes("destination account does not exist")
  ) {
    return {
      message: "This project's wallet hasn't been activated on Stellar yet. Contact the maintainer.",
      errorType: "unfunded_destination",
    };
  }

  // ── Case 5: Invalid / Malformed Destination Public Key ────────────────────
  if (
    lowerText.includes("invalid destination") ||
    lowerText.includes("destination public key") ||
    lowerText.includes("malformed destination")
  ) {
    return {
      message: "This project's maintainer hasn't connected a valid Stellar wallet.",
      errorType: "invalid_destination",
    };
  }

  // ── Case 6: Sequence Number / Transaction Expired (`tx_bad_seq`, `tx_too_late`, `tx_too_early`) ──
  if (
    txResultCode === "tx_bad_seq" ||
    txResultCode === "tx_too_late" ||
    txResultCode === "tx_too_early" ||
    lowerText.includes("tx_bad_seq") ||
    lowerText.includes("tx_too_late") ||
    lowerText.includes("transaction expired") ||
    lowerText.includes("sequence number")
  ) {
    return {
      message: "This transaction expired before it was submitted. Please try again.",
      errorType: "expired_tx",
    };
  }

  // ── Case 7: Amount is Zero or Negative ───────────────────────────────────
  if (
    lowerText.includes("greater than 0") ||
    lowerText.includes("greater than zero") ||
    lowerText.includes("invalid amount")
  ) {
    return {
      message: "Enter a valid amount greater than 0.",
      errorType: "invalid_amount",
    };
  }

  // ── Case 8: Network / Horizon Unreachable ────────────────────────────────
  if (
    lowerText.includes("network") ||
    lowerText.includes("timeout") ||
    lowerText.includes("failed to fetch") ||
    lowerText.includes("rpc") ||
    lowerText.includes("horizon") ||
    lowerText.includes("504") ||
    lowerText.includes("502")
  ) {
    return {
      message: "Network error — couldn't reach Stellar Testnet. Check your connection and try again.",
      errorType: "network_error",
    };
  }

  // ── Case 9: Unrecognized / Fallback Error ────────────────────────────────
  let fallbackMessage = rawMessage || "Something went wrong submitting your transaction. Please try again, or check the browser console for details.";

  if (fallbackMessage.includes("[object Object]")) {
    fallbackMessage = "Something went wrong submitting your transaction. Please try again, or check the browser console for details.";
  }

  return {
    message: fallbackMessage,
    errorType: "unknown",
  };
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
      const { message, errorType } = extractErrorMessage(a.error, a.amountXlm, a.walletBalance);
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

  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  const startReview = useCallback(() => dispatch({ type: "START_REVIEW" }), []);

  const submit = useCallback(
    async (
      sponsorAddress: string,
      projectId: bigint,
      amountXlm: string,
      walletBalance?: string,
      sponsorMessage?: string
    ) => {
      // 0. Pre-flight Amount Validation
      const parsedAmount = parseFloat(amountXlm);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        dispatch({
          type: "FAIL",
          error: new Error("Enter a valid amount greater than 0."),
          amountXlm,
          walletBalance,
        });
        return;
      }

      // 0. Pre-flight Balance Check (if wallet balance is provided)
      if (walletBalance) {
        const available = parseFloat(walletBalance);
        const required = parsedAmount + 0.00001; // Base fee
        if (available < required) {
          dispatch({
            type: "FAIL",
            error: new Error("op_underfunded"),
            amountXlm,
            walletBalance,
          });
          return;
        }
      }

      dispatch({ type: "SUBMIT" });
      try {
        // Sponsorships are Soroban contract calls. The contract transfers XLM,
        // persists the donation record, and updates project statistics atomically.
        const { getKit } = await import("@/features/wallet/use-wallet");
        const kit = await getKit();
        const { sponsorOnChainProject } = await import("@/lib/soroban-client");
        const { txHash } = await sponsorOnChainProject({
          sponsorPublicKey: sponsorAddress,
          projectId,
          amountXlm,
          sponsorMessage,
          kit,
        });

        dispatch({ type: "RECEIVE_HASH", txHash });

        dispatch({ type: "SUCCESS" });
        onSuccessRef.current?.(txHash);
      } catch (err: unknown) {
        dispatch({ type: "FAIL", error: err, amountXlm, walletBalance });
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
