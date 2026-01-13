import { z } from "zod";

const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "EXTREME"]);
const riskCategorySchema = z.enum([
  "planning",
  "delivery",
  "sales",
  "cost",
  "sponsor",
  "energy",
  "other",
]);

const riskIssueSchema = z.object({
  issue: z.string(),
  category: riskCategorySchema.default("planning"),
  probability: z.preprocess(
    (value) => (value == null ? 3 : value),
    z.number().min(1).max(5)
  ),
  impact: z.preprocess(
    (value) => (value == null ? 3 : value),
    z.number().min(1).max(5)
  ),
  owner: z.string().nullable().optional(),
  mitigation: z.string().nullable().optional(),
});

export const planningStructuredSummarySchema = z.object({
  headline: z.string().nullable().optional(),
  risk_level: riskLevelSchema.nullable().optional(),
  key_issues: z.array(z.string()).default([]),
  recommended_actions: z.array(z.string()).default([]),
  timeline_notes: z.array(z.string()).default([]),
  risk_issues: z.array(riskIssueSchema).default([]),
});

export type PlanningStructuredSummary = z.infer<typeof planningStructuredSummarySchema>;
