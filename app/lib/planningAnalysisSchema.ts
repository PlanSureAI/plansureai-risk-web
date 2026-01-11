import { z } from "zod";

const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "EXTREME"]);

export const planningDocumentAnalysisSchema = z.object({
  headlineRisk: z.string().nullable().optional(),
  riskLevel: riskLevelSchema.nullable().optional(),
  keyIssues: z.array(z.string()).default([]),
  policyRefs: z.array(z.string()).default([]),
  recommendedActions: z.array(z.string()).default([]),
  timelineNotes: z.string().nullable().optional(),
});

export type PlanningDocumentAnalysis = z.infer<typeof planningDocumentAnalysisSchema>;
