import { describe, it, expect } from "vitest";
import { checkNeedsFunding, getNativeBalance, HorizonAccountResponse } from "@/features/wallet/wallet-service";

describe("Wallet Service - checkNeedsFunding", () => {
  it("should return true when account is null (not found / unregistered)", () => {
    const result = checkNeedsFunding(null);
    expect(result).toBe(true);
  });

  it("should return true when account has no balances list", () => {
    const mockAccount = {
      balances: [],
    } as unknown as HorizonAccountResponse;

    const result = checkNeedsFunding(mockAccount);
    expect(result).toBe(true);
  });

  it("should return true when account has balances but no native balance", () => {
    const mockAccount: HorizonAccountResponse = {
      balances: [
        { asset_type: "credit_alphanum4", balance: "100.0000000" },
      ],
    };

    const result = checkNeedsFunding(mockAccount);
    expect(result).toBe(true);
  });

  it("should return true when account has native balance of 0", () => {
    const mockAccount: HorizonAccountResponse = {
      balances: [
        { asset_type: "native", balance: "0.0000000" },
      ],
    };

    const result = checkNeedsFunding(mockAccount);
    expect(result).toBe(true);
  });

  it("should return false when account has native balance greater than 0", () => {
    const mockAccount: HorizonAccountResponse = {
      balances: [
        { asset_type: "native", balance: "100.0000000" },
      ],
    };

    const result = checkNeedsFunding(mockAccount);
    expect(result).toBe(false);
  });
});

describe("Wallet Service - getNativeBalance", () => {
  it("should return '0.0000000' when account is null", () => {
    const balance = getNativeBalance(null);
    expect(balance).toBe("0.0000000");
  });

  it("should return '0.0000000' when account has no native balance", () => {
    const mockAccount: HorizonAccountResponse = {
      balances: [
        { asset_type: "credit_alphanum4", balance: "10.0" },
      ],
    };
    const balance = getNativeBalance(mockAccount);
    expect(balance).toBe("0.0000000");
  });

  it("should return correct native balance value", () => {
    const mockAccount: HorizonAccountResponse = {
      balances: [
        { asset_type: "native", balance: "152.4500000" },
      ],
    };
    const balance = getNativeBalance(mockAccount);
    expect(balance).toBe("152.4500000");
  });
});
