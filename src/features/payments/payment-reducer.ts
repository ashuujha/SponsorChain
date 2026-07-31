export interface PaymentState {
  status: "idle" | "review" | "pending" | "success" | "failed";
  txHash: string | null;
  errorType: "insufficient_balance" | "user_rejected" | "network_error" | "unknown" | null;
  errorMessage: string | null;
}

export type PaymentAction =
  | { type: "START_REVIEW" }
  | { type: "SUBMIT" }
  | { type: "RECEIVE_HASH"; txHash: string }
  | { type: "SUCCESS" }
  | { type: "FAIL"; error: Error }
  | { type: "RESET" };

export function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case "START_REVIEW":
      return { status: "review", txHash: null, errorType: null, errorMessage: null };
    case "SUBMIT":
      return { ...state, status: "pending" };
    case "RECEIVE_HASH":
      return { ...state, txHash: action.txHash };
    case "SUCCESS":
      return { ...state, status: "success" };
    case "FAIL": {
      const msg = action.error.message || "";
      let errorType: PaymentState["errorType"] = "unknown";
      if (
        msg.includes("underfunded") ||
        msg.includes("op_underfunded") ||
        msg.includes("insufficient")
      ) {
        errorType = "insufficient_balance";
      } else if (
        msg.includes("rejected") ||
        msg.includes("user rejected") ||
        msg.includes("Closed") ||
        msg.includes("declined")
      ) {
        errorType = "user_rejected";
      } else if (
        msg.includes("timeout") ||
        msg.includes("network") ||
        msg.includes("fetch") ||
        msg.includes("Horizon returned error status")
      ) {
        errorType = "network_error";
      }
      return {
        status: "failed",
        txHash: state.txHash,
        errorType,
        errorMessage: msg || "Transaction failed.",
      };
    }
    case "RESET":
      return { status: "idle", txHash: null, errorType: null, errorMessage: null };
    default:
      return state;
  }
}
export const initialPaymentState: PaymentState = {
  status: "idle",
  txHash: null,
  errorType: null,
  errorMessage: null,
};
