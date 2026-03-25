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

export interface AnalysisRequest {
  input: string;
  scope?: string;
}

export interface InputClassification {
  type: "company" | "product" | "market" | "idea";
  needsScope: boolean;
  suggestedScopePrompt?: string;
}
