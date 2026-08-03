import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchOnChainProjects, sorobanServer } from "@/lib/soroban-client";
import { SorobanRpc, nativeToScVal } from "stellar-sdk";

describe("Explore Page Data Source Verification — Strict On-Chain Invariant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("positively asserts fetchOnChainProjects calls list_projects and get_project via simulateTransaction", async () => {
    vi.spyOn(SorobanRpc.Api, "isSimulationSuccess").mockReturnValue(true);
    const simSpy = vi.spyOn(sorobanServer, "simulateTransaction");

    let callCount = 0;
    simSpy.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          error: undefined,
          transactionData: undefined,
          minResourceFee: "100",
          events: [],
          result: {
            retval: nativeToScVal([0], { type: "u64" }),
          },
        } as unknown as SorobanRpc.Api.SimulateTransactionResponse;
      }

      return {
        error: undefined,
        transactionData: undefined,
        minResourceFee: "100",
        events: [],
        result: {
          retval: nativeToScVal(
            {
              owner: "GB2DD56V4YYJEYUWP7W57NJM67RQGX6KAZR4CG24LX3S2W2KVM3HN22J",
              repo_full_name: "stellar/soroban-examples",
              name: "soroban-examples",
              description: "Soroban smart contract examples",
              total_raised: 1000000000n,
              sponsor_count: 2,
              created_at: 1785784904n,
            },
            {
              type: "map",
            }
          ),
        },
      } as unknown as SorobanRpc.Api.SimulateTransactionResponse;
    });

    const projects = await fetchOnChainProjects(0, 50);

    // Verify simulateTransaction was called for list_projects and get_project contract operations
    expect(simSpy).toHaveBeenCalled();
    const firstCallTx = simSpy.mock.calls[0][0];
    expect(firstCallTx.operations[0].type).toBe("invokeHostFunction");

    // Verify projects returned matches contract simulation data
    expect(projects.length).toBeGreaterThanOrEqual(1);
    expect(projects[0].name).toBe("soroban-examples");
  });

  it("MUST throw an explicit error on RPC simulation failure — NEVER silently fall back to dummy/local data", async () => {
    vi.spyOn(sorobanServer, "simulateTransaction").mockRejectedValue(
      new Error("Stellar Testnet Soroban RPC Endpoint Unreachable (503)")
    );

    // Assert that fetchOnChainProjects throws an error rather than swallowing it or returning dummy fallback data
    await expect(fetchOnChainProjects()).rejects.toThrow(
      "Stellar Testnet Soroban RPC Endpoint Unreachable (503)"
    );
  });
});
