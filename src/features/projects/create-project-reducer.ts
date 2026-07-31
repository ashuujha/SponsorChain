export interface CreateProjectState {
  status: "idle" | "review" | "pending" | "success" | "failed";
  projectId: bigint | null;
  txHash: string | null;
  errorType:
    | "insufficient_funds"
    | "user_rejected"
    | "network_error"
    | "unknown"
    | null;
  errorMessage: string | null;
}

export type CreateProjectAction =
  | { type: "START_REVIEW" }
  | { type: "SUBMIT" }
  | { type: "RECEIVE_HASH"; txHash: string }
  | { type: "SUCCESS"; projectId: bigint }
  | { type: "FAIL"; error: Error }
  | { type: "RESET" };

export function createProjectReducer(
  state: CreateProjectState,
  action: CreateProjectAction
): CreateProjectState {
  switch (action.type) {
    case "START_REVIEW":
      return {
        status: "review",
        projectId: null,
        txHash: null,
        errorType: null,
        errorMessage: null,
      };
    case "SUBMIT":
      return { ...state, status: "pending" };
    case "RECEIVE_HASH":
      return { ...state, txHash: action.txHash };
    case "SUCCESS":
      return { ...state, status: "success", projectId: action.projectId };
    case "FAIL": {
      const msg = action.error.message || "";
      let errorType: CreateProjectState["errorType"] = "unknown";
      if (
        msg.includes("underfunded") ||
        msg.includes("op_underfunded") ||
        msg.includes("insufficient balance") ||
        msg.includes("not sufficient")
      ) {
        errorType = "insufficient_funds";
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
        msg.includes("RPC")
      ) {
        errorType = "network_error";
      }
      return {
        status: "failed",
        projectId: state.projectId,
        txHash: state.txHash,
        errorType,
        errorMessage: msg || "Transaction failed.",
      };
    }
    case "RESET":
      return {
        status: "idle",
        projectId: null,
        txHash: null,
        errorType: null,
        errorMessage: null,
      };
  }
}

export const initialCreateProjectState: CreateProjectState = {
  status: "idle",
  projectId: null,
  txHash: null,
  errorType: null,
  errorMessage: null,
};
