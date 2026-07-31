import { describe, it, expect } from "vitest";
import { projectSchema } from "@/lib/validations/project";

describe("Project Creation Form Validation Schema", () => {
  it("should validate a correct project payload", () => {
    const validData = {
      repoUrl: "stellar/stellar-sdk",
      name: "Stellar SDK Core",
      description: "A premium toolkit for interacting with Stellar networks.",
      fundingGoalXLM: "5000",
      tierAmountXLM: "100",
      tierLabel: "Coffee Sponsor",
    };

    const parseResult = projectSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it("should validate a repository URL with github.com prefix", () => {
    const validData = {
      repoUrl: "https://github.com/stellar/stellar-sdk",
      name: "Stellar SDK Core",
      description: "A premium toolkit for interacting with Stellar networks.",
      fundingGoalXLM: "5000.50",
      tierAmountXLM: "10.25",
      tierLabel: "Base Tier",
    };

    const parseResult = projectSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it("should fail when repository is empty or invalid format", () => {
    const invalidData = {
      repoUrl: "stellar", // invalid format
      name: "Stellar SDK Core",
      description: "A premium toolkit for interacting with Stellar networks.",
      fundingGoalXLM: "5000",
      tierAmountXLM: "100",
      tierLabel: "Coffee Sponsor",
    };

    const parseResult = projectSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      expect(parseResult.error.format().repoUrl?._errors[0]).toContain(
        "Must be a valid GitHub repository (owner/repo)"
      );
    }
  });

  it("should fail when description is too short", () => {
    const invalidData = {
      repoUrl: "stellar/stellar-sdk",
      name: "Stellar SDK Core",
      description: "Short", // < 10 chars
      fundingGoalXLM: "5000",
      tierAmountXLM: "100",
      tierLabel: "Coffee Sponsor",
    };

    const parseResult = projectSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      expect(parseResult.error.format().description?._errors[0]).toContain(
        "Description must be at least 10 characters"
      );
    }
  });

  it("should fail when description is too long", () => {
    const invalidData = {
      repoUrl: "stellar/stellar-sdk",
      name: "Stellar SDK Core",
      description: "a".repeat(281), // > 280 chars
      fundingGoalXLM: "5000",
      tierAmountXLM: "100",
      tierLabel: "Coffee Sponsor",
    };

    const parseResult = projectSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      expect(parseResult.error.format().description?._errors[0]).toContain(
        "Description must be at most 280 characters"
      );
    }
  });

  it("should fail when funding goal is negative or 0", () => {
    const invalidData = {
      repoUrl: "stellar/stellar-sdk",
      name: "Stellar SDK Core",
      description: "A premium toolkit for interacting with Stellar networks.",
      fundingGoalXLM: "0",
      tierAmountXLM: "100",
      tierLabel: "Coffee Sponsor",
    };

    const parseResult = projectSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      expect(parseResult.error.format().fundingGoalXLM?._errors[0]).toContain(
        "Goal must be greater than 0"
      );
    }
  });
});
