"use client";

import { useReducer, useCallback, useState, useRef, useEffect } from "react";

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
      // Distinguish by Horizon result codes + wallet rejection messages
      if (
        msg.includes("insufficient") ||
        msg.includes("underfunded") ||
        msg.includes("op_underfunded") ||
        msg.includes("tx_insufficient_balance")
      ) {
        errorType = "insufficient_funds";
      } else if (
        msg.includes("rejected") ||
        msg.includes("declined") ||
        msg.includes("User cancelled") ||
        msg.includes("User declined") ||
        msg.includes("user rejected")
      ) {
        errorType = "user_rejected";
      } else if (
        msg.includes("network") ||
        msg.includes("timeout") ||
        msg.includes("RPC") ||
        msg.includes("fetch") ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError")
      ) {
        errorType = "network_error";
      }
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
        // preparePaymentTransaction fetches the sponsor's current sequence number
        // from Horizon testnet, then builds a TransactionBuilder with a native
        // XLM Payment operation and a 10-minute timeout.
        const { preparePaymentTransaction } = await import(
          "@/features/payments/payment-service"
        );
        const unsignedXdr = await preparePaymentTransaction({
          sponsorPublicKey: sponsorAddress,
          destinationPublicKey: recipientAddress,
          amountXLM: amountXlm,
        });

        // ── 2. Sign via StellarWalletsKit (fires the wallet popup) ────────────
        // getKit() returns the already-configured StellarWalletsKit instance
        // (created in use-wallet.ts) with the user's chosen wallet module set.
        // kit.signTransaction() delegates to Freighter / xBull / Albedo / etc.
        // and returns the signed XDR envelope without submitting it.
        const { getKit } = await import("@/features/wallet/use-wallet");
        const kit = await getKit();

        const { Networks } = await import("stellar-sdk");
        const { signedTxXdr } = await kit.signTransaction(unsignedXdr, {
          networkPassphrase: Networks.TESTNET,
          address: sponsorAddress,
        });

        // ── 3. Reconstruct Transaction from signed XDR ────────────────────────
        // TransactionBuilder.fromXDR parses the signed envelope. We call
        // .hash() to derive the canonical txHash before submission so the UI
        // can display it during the "Confirming on-chain..." phase.
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
        // Horizon wraps result_codes inside err.response.data.extras.
        // Flatten them into a plain Error message so the reducer's pattern
        // matching (insufficient_funds / user_rejected / network_error) works.
        let error = err instanceof Error ? err : new Error(String(err));

        type HorizonErr = {
          response?: {
            data?: {
              extras?: {
                result_codes?: { transaction?: string; operations?: string[] };
              };
            };
          };
        };
        const horizonErr = err as HorizonErr;
        const codes = horizonErr?.response?.data?.extras?.result_codes;
        if (codes) {
          const parts = [
            codes.transaction,
            ...(codes.operations ?? []),
          ].filter(Boolean);
          if (parts.length) error = new Error(parts.join(", "));
        }

        dispatch({ type: "FAIL", error });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    setAmount("");
  }, []);

  return { state, amount, setAmount, startReview, submit, reset };
}
