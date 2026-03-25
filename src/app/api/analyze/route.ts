import { NextRequest, NextResponse } from "next/server";
import { analyzeCompetitors } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { input, scope } = body;

    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return NextResponse.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    const result = await analyzeCompetitors(input.trim(), scope?.trim());

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);

    const message = error instanceof Error ? error.message : "Unknown error occurred";

    // Handle specific OpenAI errors
    if (message.includes("API key")) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key. Please check your configuration." },
        { status: 401 }
      );
    }

    if (message.includes("rate limit")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze competitors. Please try again." },
      { status: 500 }
    );
  }
}
