import { z } from "zod";

export const confidenceSchema = z.enum(["high", "medium", "low"]);

export const discoveredCompetitorSchema = z.object({
  name: z.string(),
  website: z.string().optional(),
  shortReason: z.string(),
  confidence: confidenceSchema,
});

export const discoveryResultSchema = z.object({
  marketSummary: z.string(),
  competitors: z.array(discoveredCompetitorSchema),
});

export const competitorExplanationSchema = z.object({
  whyTheyMatter: z.string(),
  whoTheyServe: z.string(),
  whatMakesThemDifferent: z.string(),
  confidence: confidenceSchema,
});

export type DiscoveryResultSchema = z.infer<typeof discoveryResultSchema>;
export type CompetitorExplanationSchema = z.infer<typeof competitorExplanationSchema>;
