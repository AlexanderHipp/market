export interface Competitor {
  name: string;
  website?: string;
  whyTheyMatter: string;
  whoTheyServe: string;
  whatMakesThemDifferent: string;
  confidence: "high" | "medium" | "low";
}

export interface DiscoveredCompetitor {
  name: string;
  website?: string;
  shortReason: string;
  confidence: "high" | "medium" | "low";
}

export interface DiscoveryResult {
  marketSummary: string;
  competitors: DiscoveredCompetitor[];
}

export interface AnalysisResult {
  marketSummary: string;
  competitors: Competitor[];
}

export interface TraceStep {
  id: string;
  name: string;
  status: "running" | "done" | "error";
  prompt?: string;
  response?: unknown;
  error?: string;
}

export type InterpretationKind =
  | "company"
  | "product"
  | "feature"
  | "market"
  | "idea";

export interface Interpretation {
  kind: InterpretationKind;
  subject: string;
  context?: string;
  marketLens: string;
  isAmbiguous: boolean;
  clarificationPrompt?: string;
  displayLine: string;
}

export interface AnalysisRequest {
  input: string;
  refinement?: string;
}
