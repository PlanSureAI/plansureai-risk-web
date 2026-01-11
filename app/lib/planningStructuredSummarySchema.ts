import { z } from "zod";

const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "EXTREME"]);

export const planningStructuredSummarySchema = z.object({
  headline: z.string().nullable().optional(),
  risk_level: riskLevelSchema.nullable().optional(),
  key_issues: z.array(z.string()).default([]),
  recommended_actions: z.array(z.string()).default([]),
  timeline_notes: z.array(z.string()).default([]),
});

export type PlanningStructuredSummary = z.infer<typeof planningStructuredSummarySchema>;
