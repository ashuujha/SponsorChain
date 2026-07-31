"use client";

import { useReducer, useCallback, useState } from "react";

/* ── Reuse the same lifecycle reducer pattern from create-project ── */

export interface SponsorState {
  status: "idle" | "review" | "pending" | "success" | "failed";
  txHash: string | null;
  errorType: "insufficient_funds" | "user_rejected" | "network_error" | "unknown" | null;
  errorMessage: string | null;
}

type SponsorAction =
  | { type: "START_REVIEW" }
  | { type: "SUBMIT" }
  | { type: "RECEIVE_HASH"; txHash: string }
  | { type: "SUCCESS" }
  | { type: "FAIL"; error: Error }
  | { type: "RESET" };

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
      const msg = a.error.message || "";
      let errorType: SponsorState["errorType"] = "unknown";
      if (msg.includes("insufficient") || msg.includes("underfunded"))
        errorType = "insufficient_funds";
      else if (msg.includes("rejected") || msg.includes("declined"))
        errorType = "user_rejected";
      else if (msg.includes("network") || msg.includes("timeout") || msg.includes("RPC"))
        errorType = "network_error";
      return { status: "failed", txHash: s.txHash, errorType, errorMessage: msg };
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

export function useSponsorProject(onSuccess?: () => void) {
  const [state, dispatch] = useReducer(sponsorReducer, initSponsor);
  const [amount, setAmount] = useState("");

  const startReview = useCallback(() => dispatch({ type: "START_REVIEW" }), []);

  const submit = useCallback(
    async (sponsorAddress: string, recipientAddress: string, amountXlm: string) => {
      dispatch({ type: "SUBMIT" });
      try {
        // In production: build Soroban tx → sign → submit → await confirmation
        // For the checkpoint: simulate the RPC round-trip
        await new Promise((r) => setTimeout(r, 800));
        const mockTxHash = `tx_${Date.now().toString(16)}_${Math.random().toString(36).slice(2, 10)}`;
        dispatch({ type: "RECEIVE_HASH", txHash: mockTxHash });
        await new Promise((r) => setTimeout(r, 400));
        dispatch({ type: "SUCCESS" });
        onSuccess?.();
      } catch (err) {
        dispatch({ type: "FAIL", error: err as Error });
      }
    },
    [onSuccess]
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    setAmount("");
  }, []);

  return { state, amount, setAmount, startReview, submit, reset };
}
