import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Competitor {
  name: string;
  positioning: string;
}

export interface AnalysisResult {
  market: string;
  description: string;
  competitors: Competitor[];
}

const PROMPT = `Given the input below, identify the competitive landscape.

Input: {input}

Return a JSON object with:
- market: A short market name (e.g., "B2B Customer Support Platforms")
- description: One sentence describing who this market serves
- competitors: Array of 5-7 competitors, each with:
  - name: Company/product name
  - positioning: One-line description of what makes them distinct (max 8 words)

Guidelines:
- Pick a focused market segment if the input is broad
- Don't include the input company itself if it's a known company
- Be specific and concise
- No marketing fluff

Return ONLY valid JSON.`;

export async function analyze(input: string): Promise<AnalysisResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: PROMPT.replace("{input}", input) }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as AnalysisResult;
}
