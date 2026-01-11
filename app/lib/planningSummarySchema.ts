import { z } from "zod";

export const planningDocumentSummarySchema = z.object({
  site: z.object({
    name: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    localAuthority: z.string().nullable().optional(),
    clientName: z.string().nullable().optional(),
  }),
  proposal: z.object({
    description: z.string().nullable().optional(),
    route: z.array(z.string()).default([]),
    dwellingsMin: z.number().nullable().optional(),
    dwellingsMax: z.number().nullable().optional(),
    isHousingLed: z.boolean().default(false),
  }),
  process: z.object({
    stage: z.string().nullable().optional(),
    steps: z.array(z.string()).default([]),
  }),
  fees: z.object({
    planningAuthorityFee: z.object({
      amount: z.number().nullable().optional(),
      currency: z.literal("GBP").default("GBP"),
      payer: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
    }),
    agentFee: z.object({
      amount: z.number().nullable().optional(),
      currency: z.literal("GBP").default("GBP"),
      vatExcluded: z.boolean().default(true),
      description: z.string().nullable().optional(),
    }),
  }),
  documentsRequired: z.array(z.string()).default([]),
  meta: z.object({
    documentTitle: z.string().nullable().optional(),
    documentDate: z.string().nullable().optional(),
    sourceFileName: z.string().nullable().optional(),
  }),
});

export type PlanningDocumentSummaryZod = z.infer<typeof planningDocumentSummarySchema>;
