import { NextRequest, NextResponse } from "next/server";
import { classifyInput } from "@/lib/classifier";
import { generateMarketFrame } from "@/lib/openai";

const MAX_INPUT_LENGTH = 4000;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { rawInput, refinedInput, scope, refinementHints } = body as {
      rawInput?: string;
      refinedInput?: string;
      scope?: string;
      refinementHints?: string[];
    };

    const raw = typeof rawInput === "string" ? rawInput : "";
    const refined = typeof refinedInput === "string" ? refinedInput : "";
    const effective = (refined.trim() || raw.trim()).trim();

    if (!effective) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    if (effective.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Input must be at most ${MAX_INPUT_LENGTH} characters` },
        { status: 400 },
      );
    }

    const scopeStr = typeof scope === "string" ? scope.trim() : "";
    const classification = classifyInput(effective);
    if (classification.needsScope && !scopeStr) {
      return NextResponse.json(
        {
          error:
            classification.suggestedScopePrompt ||
            "Add a scope or focus so we can narrow the market frame.",
        },
        { status: 400 },
      );
    }

    const hints = Array.isArray(refinementHints)
      ? refinementHints.filter((h): h is string => typeof h === "string")
      : [];

    const classifierSummary = `type=${classification.type}, needsScope=${classification.needsScope}`;

    const { result } = await generateMarketFrame({
      effectiveInput: effective,
      scope: scopeStr || undefined,
      classifierSummary,
      refinementHints: hints,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Framing draft error:", error);

    const message = error instanceof Error ? error.message : "Unknown error occurred";

    if (message.includes("API key")) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key. Please check your configuration." },
        { status: 401 },
      );
    }

    if (message.includes("rate limit")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Failed to generate market frame. Please try again." },
      { status: 500 },
    );
  }
}
