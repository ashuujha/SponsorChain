import { z } from "zod";

export const projectSchema = z.object({
  repoUrl: z
    .string()
    .min(1, "Repository is required")
    .regex(
      /^(https:\/\/github\.com\/)?([^/]+)\/([^/]+)$/,
      "Must be a valid GitHub repository (owner/repo)"
    ),
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be under 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(280, "Description must be at most 280 characters"),
  fundingGoalXLM: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Goal must be a valid positive number")
    .refine((val) => parseFloat(val) > 0, "Goal must be greater than 0"),
  tierAmountXLM: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Tier amount must be a valid positive number")
    .refine((val) => parseFloat(val) > 0, "Tier amount must be greater than 0"),
  tierLabel: z
    .string()
    .min(1, "Tier label is required")
    .max(100, "Tier label must be under 100 characters"),
});

export type ProjectInput = z.infer<typeof projectSchema>;
