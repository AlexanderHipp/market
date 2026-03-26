import OpenAI from "openai";
import {
  discoveryResultSchema,
  competitorExplanationSchema,
  marketFrameDraftSchema,
} from "./schemas";
import type { MarketFrameDraft } from "./schemas";
import type { DiscoveryResult, Competitor } from "./types";
import { getCompanyResearchContext } from "./known-companies";
import { refinementHintsToPromptLines } from "./framing-prompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DISCOVERY_PROMPT = `You are a market research analyst. Given the following input, identify the competitive landscape.

Input: {input}
{scopeSection}

Return a JSON object with:
1. marketSummary: A one-sentence description of the market (e.g., "Customer support platforms for SMB and mid-market teams")
2. competitors: An array of 5-8 relevant competitors, each with:
   - name: Company/product name
   - website: Main URL (optional, only if you're confident)
   - shortReason: Why they're included (1 sentence)
   - confidence: "high", "medium", or "low"

Guidelines:
- Focus on direct competitors
- Be specific about the market segment
- Do not include the input company itself if it's a known company
- Only include competitors you're confident about
- Prefer well-known, established players over obscure ones

Return ONLY valid JSON, no other text.`;

const EXPLANATION_PROMPT = `You are explaining a competitor in the following market: {market}

Competitor: {name}

Provide a JSON object with:
- whyTheyMatter: Why this competitor is relevant (1 sentence, max 20 words)
- whoTheyServe: Their target customer (1 sentence, max 15 words)
- whatMakesThemDifferent: Their key differentiator (1 sentence, max 20 words)
- confidence: "high", "medium", or "low"

Guidelines:
- Be concise and specific
- No marketing speak or fluff
- Focus on facts, not opinions
- If uncertain, say so with lower confidence

Return ONLY valid JSON, no other text.`;

const MARKET_FRAME_PROMPT = `You are a product strategist. Turn the user's vague input into a clear, decision-ready market frame.

User input: {input}
{classifierSection}
{scopeSection}
{refinementSection}

Return a single JSON object with these keys:
- subject: string — what we are evaluating in one clear phrase
- interpretationKind: one of: "product", "company", "feature", "market", "idea", "campaign", "other"
- marketLens: string — the market or category lens (one or two sentences, specific)
- directAlternatives: string[] — 4-8 named competitors or close substitutes (names only or very short phrases)
- adjacentAlternatives: string[] — 2-6 adjacent options (different category but relevant tradeoffs)
- rationale: string — 2-4 sentences explaining why this frame fits; no fluff
- confidence: "high", "medium", or "low"
- partial: boolean — true if you had to guess on any major field

Guidelines:
- Be specific about segment (e.g. geography, motion, ICP) when it matters
- If the input is ambiguous, state assumptions briefly in rationale and set partial to true
- Do not include markdown or code fences
- Return ONLY valid JSON`;

export interface DiscoveryCallResult {
  result: DiscoveryResult;
  prompt: string;
  rawResponse: string;
}

export interface ExplanationCallResult {
  result: {
    whyTheyMatter: string;
    whoTheyServe: string;
    whatMakesThemDifferent: string;
    confidence: "high" | "medium" | "low";
  };
  prompt: string;
  rawResponse: string;
}

export interface GenerateMarketFrameParams {
  effectiveInput: string;
  scope?: string;
  classifierSummary?: string;
  refinementHints?: string[];
}

export async function generateMarketFrame(
  params: GenerateMarketFrameParams,
): Promise<{ result: MarketFrameDraft; prompt: string; rawResponse: string }> {
  const { effectiveInput, scope, classifierSummary, refinementHints } = params;
  const scopeSection =
    scope?.trim() ? `\nScope/Focus (user-provided): ${scope.trim()}` : "";
  const classifierSection = classifierSummary
    ? `\nClassifier hint (heuristic): ${classifierSummary}`
    : "";
  const hintLines = refinementHintsToPromptLines(refinementHints ?? []);
  const refinementSection =
    hintLines.length > 0
      ? `\nRefinement requests (apply strictly):\n${hintLines.map((l) => `- ${l}`).join("\n")}`
      : "";

  const prompt = MARKET_FRAME_PROMPT.replace("{input}", effectiveInput)
    .replace("{scopeSection}", scopeSection)
    .replace("{classifierSection}", classifierSection)
    .replace("{refinementSection}", refinementSection);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.35,
    response_format: { type: "json_object" },
  });

  const rawResponse = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(rawResponse);
  const result = marketFrameDraftSchema.parse(parsed);

  return { result, prompt, rawResponse };
}

export async function discoverCompetitors(
  input: string,
  scope?: string,
): Promise<DiscoveryCallResult> {
  const { lensDescription, isMegaCorp } = getCompanyResearchContext(input);
  const extraLines: string[] = [];
  if (scope) extraLines.push(`Scope/Focus: ${scope}`);
  if (lensDescription) {
    extraLines.push(`Known company context: ${lensDescription}`);
  }
  if (isMegaCorp) {
    extraLines.push(
      "Note: The input may refer to a large diversified company. Focus on the specific product line or market segment implied by the input and scope; avoid listing unrelated business units as direct competitors.",
    );
  }
  const scopeSection = extraLines.length > 0 ? `\n${extraLines.join("\n")}` : "";
  const prompt = DISCOVERY_PROMPT.replace("{input}", input).replace(
    "{scopeSection}",
    scopeSection,
  );

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const rawResponse = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(rawResponse);
  const result = discoveryResultSchema.parse(parsed);

  return { result, prompt, rawResponse };
}

export async function explainCompetitor(
  market: string,
  name: string,
): Promise<ExplanationCallResult> {
  const prompt = EXPLANATION_PROMPT.replace("{market}", market).replace(
    "{name}",
    name,
  );

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const rawResponse = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(rawResponse);
  const result = competitorExplanationSchema.parse(parsed);

  return { result, prompt, rawResponse };
}

export async function analyzeCompetitors(
  input: string,
  scope?: string,
  onProgress?: (
    step: string,
    status: "running" | "done" | "error",
    data?: unknown,
  ) => void,
): Promise<{
  marketSummary: string;
  competitors: Competitor[];
  trace: {
    discovery: { prompt: string; response: unknown };
    explanations: Array<{ name: string; prompt: string; response: unknown }>;
  };
}> {
  // Step 1: Discover competitors
  onProgress?.("discovery", "running");
  const discovery = await discoverCompetitors(input, scope);
  onProgress?.("discovery", "done", discovery);

  // Step 2: Explain each competitor
  const explanations: Array<{
    name: string;
    prompt: string;
    response: unknown;
  }> = [];
  const competitors: Competitor[] = [];

  for (const discovered of discovery.result.competitors) {
    onProgress?.(`explain-${discovered.name}`, "running");
    try {
      const explanation = await explainCompetitor(
        discovery.result.marketSummary,
        discovered.name,
      );
      explanations.push({
        name: discovered.name,
        prompt: explanation.prompt,
        response: explanation.result,
      });
      competitors.push({
        name: discovered.name,
        website: discovered.website,
        whyTheyMatter: explanation.result.whyTheyMatter,
        whoTheyServe: explanation.result.whoTheyServe,
        whatMakesThemDifferent: explanation.result.whatMakesThemDifferent,
        confidence: explanation.result.confidence,
      });
      onProgress?.(`explain-${discovered.name}`, "done", explanation);
    } catch (error) {
      onProgress?.(`explain-${discovered.name}`, "error", {
        error: String(error),
      });
      // Still include the competitor with basic info
      competitors.push({
        name: discovered.name,
        website: discovered.website,
        whyTheyMatter: discovered.shortReason,
        whoTheyServe: "Unable to determine",
        whatMakesThemDifferent: "Unable to determine",
        confidence: "low",
      });
    }
  }

  return {
    marketSummary: discovery.result.marketSummary,
    competitors,
    trace: {
      discovery: {
        prompt: discovery.prompt,
        response: discovery.result,
      },
      explanations,
    },
  };
}
