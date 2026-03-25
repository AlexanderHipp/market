import OpenAI from "openai";
import { discoveryResultSchema, competitorExplanationSchema } from "./schemas";
import type { DiscoveryResult, Competitor, Interpretation } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function kindInstructions(kind: Interpretation["kind"]): string {
  switch (kind) {
    case "company":
      return "The subject is a company. Identify competitors with overlapping offerings in the stated market lens. Do not list the named company itself.";
    case "product":
      return "The subject is a product or company. Identify direct competitors in the same category per the market lens.";
    case "feature":
      return "The subject is a feature or capability (context may name the host product). Prioritize competitors known for comparable functionality.";
    case "market":
      return "The subject describes a market or category. Identify leading vendors and close alternatives in that space.";
    case "idea":
      return "The subject is a concept or opportunity. Infer the nearest product category from the market lens and find established competitors there.";
    default:
      return "Use the interpretation fields to stay aligned with user intent.";
  }
}

export function buildDiscoveryPrompt(
  rawInput: string,
  interpretation: Interpretation,
  refinement?: string,
): string {
  const contextLine = interpretation.context
    ? `- Context (e.g. host product): ${interpretation.context}`
    : "";
  const refinementLine = refinement?.trim()
    ? `User refinement on what to track: ${refinement.trim()}`
    : "";

  return `You are a market research analyst. Use the confirmed interpretation below—not the raw text alone—to identify the competitive landscape.

Original user input:
${rawInput}
${refinementLine ? `\n${refinementLine}\n` : ""}
Confirmed interpretation:
- Kind: ${interpretation.kind}
- Subject: ${interpretation.subject}
${contextLine}
- Market lens for competitor discovery: ${interpretation.marketLens}

Framing instructions:
${kindInstructions(interpretation.kind)}

Return a JSON object with:
1. marketSummary: A one-sentence description of the market (aligned with the interpretation and market lens)
2. competitors: An array of 5-8 relevant competitors, each with:
   - name: Company/product name
   - website: Main URL (optional, only if you're confident)
   - shortReason: Why they're included (1 sentence)
   - confidence: "high", "medium", or "low"

Guidelines:
- Focus on direct competitors given this framing
- Be specific about the market segment
- Do not include the input company/product itself if it's a known named entity in the subject
- Only include competitors you're confident about
- Prefer well-known, established players over obscure ones

Return ONLY valid JSON, no other text.`;
}

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
  rawInput: string,
  interpretation: Interpretation,
  refinement?: string,
): Promise<DiscoveryCallResult> {
  const prompt = buildDiscoveryPrompt(rawInput, interpretation, refinement);

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
  rawInput: string,
  refinement: string | undefined,
  interpretation: Interpretation,
  ambiguousBeforeRefinement: boolean,
  onProgress?: (
    step: string,
    status: "running" | "done" | "error",
    data?: unknown,
  ) => void,
): Promise<{
  marketSummary: string;
  competitors: Competitor[];
  trace: {
    interpretation: {
      response: {
        rawInput: string;
        interpretation: Interpretation;
        refinement?: string;
        isAmbiguous: boolean;
        ambiguousBeforeRefinement: boolean;
      };
    };
    discovery: { prompt: string; response: unknown };
    explanations: Array<{ name: string; prompt: string; response: unknown }>;
  };
}> {
  const interpretationTrace = {
    response: {
      rawInput,
      interpretation,
      refinement: refinement?.trim() || undefined,
      isAmbiguous: interpretation.isAmbiguous,
      ambiguousBeforeRefinement,
    },
  };

  onProgress?.("discovery", "running");
  const discovery = await discoverCompetitors(
    rawInput,
    interpretation,
    refinement,
  );
  onProgress?.("discovery", "done", discovery);

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
      interpretation: interpretationTrace,
      discovery: {
        prompt: discovery.prompt,
        response: discovery.result,
      },
      explanations,
    },
  };
}
