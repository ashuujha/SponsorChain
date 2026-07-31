import { describe, it, expect } from "vitest";
import { paymentReducer, initialPaymentState, PaymentState } from "@/features/payments/payment-reducer";

describe("Payment State Machine Reducer", () => {
  it("should transition to review state on START_REVIEW", () => {
    const nextState = paymentReducer(initialPaymentState, { type: "START_REVIEW" });
    expect(nextState.status).toBe("review");
    expect(nextState.txHash).toBeNull();
    expect(nextState.errorType).toBeNull();
  });

  it("should transition to pending status on SUBMIT", () => {
    const state: PaymentState = {
      status: "review",
      txHash: null,
      errorType: null,
      errorMessage: null,
    };
    const nextState = paymentReducer(state, { type: "SUBMIT" });
    expect(nextState.status).toBe("pending");
  });

  it("should set transaction hash on RECEIVE_HASH", () => {
    const state: PaymentState = {
      status: "pending",
      txHash: null,
      errorType: null,
      errorMessage: null,
    };
    const nextState = paymentReducer(state, { type: "RECEIVE_HASH", txHash: "test_hash_123" });
    expect(nextState.txHash).toBe("test_hash_123");
    expect(nextState.status).toBe("pending"); // stays pending until confirmed
  });

  it("should transition to success status on SUCCESS", () => {
    const state: PaymentState = {
      status: "pending",
      txHash: "test_hash_123",
      errorType: null,
      errorMessage: null,
    };
    const nextState = paymentReducer(state, { type: "SUCCESS" });
    expect(nextState.status).toBe("success");
    expect(nextState.txHash).toBe("test_hash_123");
  });

  it("should classify insufficient balance errors", () => {
    const state: PaymentState = {
      status: "pending",
      txHash: null,
      errorType: null,
      errorMessage: null,
    };
    const err = new Error("Transaction failed: op_underfunded");
    const nextState = paymentReducer(state, { type: "FAIL", error: err });
    expect(nextState.status).toBe("failed");
    expect(nextState.errorType).toBe("insufficient_balance");
  });

  it("should classify user rejected errors", () => {
    const state: PaymentState = {
      status: "pending",
      txHash: null,
      errorType: null,
      errorMessage: null,
    };
    const err = new Error("User rejected signing request");
    const nextState = paymentReducer(state, { type: "FAIL", error: err });
    expect(nextState.status).toBe("failed");
    expect(nextState.errorType).toBe("user_rejected");
  });

  it("should classify network timeout errors", () => {
    const state: PaymentState = {
      status: "pending",
      txHash: null,
      errorType: null,
      errorMessage: null,
    };
    const err = new Error("Horizon returned error status 504 Gateway Timeout");
    const nextState = paymentReducer(state, { type: "FAIL", error: err });
    expect(nextState.status).toBe("failed");
    expect(nextState.errorType).toBe("network_error");
  });

  it("should reset state on RESET", () => {
    const state: PaymentState = {
      status: "failed",
      txHash: "some_hash",
      errorType: "insufficient_balance",
      errorMessage: "out of gas",
    };
    const nextState = paymentReducer(state, { type: "RESET" });
    expect(nextState.status).toBe("idle");
    expect(nextState.txHash).toBeNull();
    expect(nextState.errorType).toBeNull();
  });
});
