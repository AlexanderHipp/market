import type { InputClassification } from "./types";

// Known company patterns - simple heuristics
const COMPANY_INDICATORS = [
  /^[A-Z][a-z]+$/,  // Single capitalized word like "Intercom", "Slack"
  /^[A-Z][a-z]+ [A-Z][a-z]+$/,  // Two capitalized words like "Help Scout"
  /\.com|\.io|\.ai|\.co$/i,  // Domain-like
  /Inc\.|Corp\.|LLC|Ltd/i,  // Legal suffixes
];

// Market/category indicators
const MARKET_INDICATORS = [
  /software|platform|tool|app|service|solution|system/i,
  /for\s+(small|medium|large|enterprise|startup)/i,
  /\s+for\s+/i,  // "X for Y" pattern
];

// Broad/abstract idea indicators that need scope
const BROAD_INDICATORS = [
  /^(AI|ML|machine learning|artificial intelligence)\s/i,
  /^(the|a|an)\s/i,
  /\?$/,  // Questions
  /idea|concept|thinking about|exploring/i,
];

export function classifyInput(input: string): InputClassification {
  const trimmed = input.trim();
  const wordCount = trimmed.split(/\s+/).length;

  // Very short inputs (1-2 words) that look like company names
  if (wordCount <= 2) {
    const looksLikeCompany = COMPANY_INDICATORS.some(pattern => pattern.test(trimmed));
    if (looksLikeCompany) {
      return {
        type: "company",
        needsScope: false,
      };
    }
  }

  // Check for market/product category descriptions
  const isMarketDescription = MARKET_INDICATORS.some(pattern => pattern.test(trimmed));
  if (isMarketDescription) {
    return {
      type: "market",
      needsScope: false,
    };
  }

  // Check for broad/abstract inputs that need clarification
  const isBroad = BROAD_INDICATORS.some(pattern => pattern.test(trimmed));
  if (isBroad || wordCount > 15) {
    return {
      type: "idea",
      needsScope: true,
      suggestedScopePrompt: "What specific aspect or market should we focus on?",
    };
  }

  // Default: treat as product/market, no scope needed
  return {
    type: "product",
    needsScope: false,
  };
}
