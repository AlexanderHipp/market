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

export const interpretationKindSchema = z.enum([
  "product",
  "company",
  "feature",
  "market",
  "idea",
  "campaign",
  "other",
]);

export const marketFrameDraftSchema = z.object({
  subject: z.string(),
  interpretationKind: z.union([interpretationKindSchema, z.string()]),
  marketLens: z.string(),
  directAlternatives: z.array(z.string()),
  adjacentAlternatives: z.array(z.string()),
  rationale: z.string(),
  confidence: confidenceSchema.optional(),
  partial: z.boolean().optional(),
});

export type MarketFrameDraft = z.infer<typeof marketFrameDraftSchema>;

export const refinementHintSchema = z.enum([
  "too_broad",
  "wrong_market",
  "focus_smb",
  "focus_enterprise",
  "feature_not_product",
]);

export type RefinementHint = z.infer<typeof refinementHintSchema>;
