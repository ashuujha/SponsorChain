import { describe, it, expect } from "vitest";
import { handleStreamError, handleStreamOpen, StreamState } from "@/features/payments/use-live-account-payments";

describe("Payments Live Streaming - handleStreamError & handleStreamOpen", () => {
  it("should transition to reconnecting state on single error", () => {
    const initialState: StreamState = {
      status: "disconnected",
      errorCount: 0,
    };

    const nextState = handleStreamError(initialState, 3);
    expect(nextState.status).toBe("reconnecting");
    expect(nextState.errorCount).toBe(1);
  });

  it("should keep reconnecting state and increment count on consecutive errors below maxRetries", () => {
    const state: StreamState = {
      status: "reconnecting",
      errorCount: 1,
    };

    const nextState = handleStreamError(state, 3);
    expect(nextState.status).toBe("reconnecting");
    expect(nextState.errorCount).toBe(2);
  });

  it("should transition to polling state when consecutive errors reach maxRetries limit", () => {
    const state: StreamState = {
      status: "reconnecting",
      errorCount: 2,
    };

    // 3rd error: count goes from 2 to 3, triggering polling fallback
    const nextState = handleStreamError(state, 3);
    expect(nextState.status).toBe("polling");
    expect(nextState.errorCount).toBe(3);
  });

  it("should reset error count and transition to connected status on stream open", () => {
    const nextState = handleStreamOpen();
    expect(nextState.status).toBe("connected");
    expect(nextState.errorCount).toBe(0);
  });
});
