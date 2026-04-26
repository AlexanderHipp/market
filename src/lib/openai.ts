import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ItemDetails {
  target: string;
  strengths: string;
  weaknesses: string;
  priceRange: "free" | "low" | "mid" | "high" | "enterprise";
}

export interface RelatedQuery {
  label: string;
  query: string;
}

export interface Item {
  name: string;
  positioning: string;
  details: ItemDetails;
  related: RelatedQuery[];
}

export interface AnalysisResult {
  inputType: "company" | "feature" | "segment" | "idea";
  market: string;
  description: string;
  items: Item[];
}

const PROMPT = `Analyze the competitive landscape for the input below.

Input: {input}

First, determine what type of input this is:
- "company": A specific company or product name (e.g., "Intercom", "Slack")
- "feature": A capability or feature (e.g., "live chat", "video conferencing")
- "segment": A market segment or customer type (e.g., "enterprise HR", "SMB e-commerce")
- "idea": An abstract concept or problem (e.g., "help customers faster")

Return a JSON object with:
- inputType: One of "company", "feature", "segment", "idea"
- market: Short market name (e.g., "B2B Customer Support Platforms")
- description: One sentence describing who this market serves
- items: Array of 5-6 relevant players, each with:
  - name: Company/product name
  - positioning: What makes them distinct (max 8 words)
  - details: Object with:
    - target: Who they serve (max 10 words)
    - strengths: Key advantage (max 10 words)
    - weaknesses: Main limitation (max 10 words)
    - priceRange: One of "free", "low", "mid", "high", "enterprise"
  - related: Array of 2 pivot suggestions, each with:
    - label: Short label (2-3 words)
    - query: Search query to explore that angle

Guidelines:
- If input is a company, show competitors in the same space
- If input is a feature, show companies known for that feature
- If input is a segment, show companies serving that segment
- Don't include the input itself if it's a known company
- Be specific and factual, no marketing fluff

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
