import OpenAI from "openai";
import { discoveryResultSchema, competitorExplanationSchema } from "./schemas";
import type { DiscoveryResult, Competitor } from "./types";

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

export async function discoverCompetitors(
  input: string,
  scope?: string,
): Promise<DiscoveryCallResult> {
  const scopeSection = scope ? `Scope/Focus: ${scope}` : "";
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
