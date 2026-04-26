import { NextRequest, NextResponse } from "next/server";
import { sharpenForResearch } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local",
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { input, refinement } = body;

    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    const refinementStr =
      typeof refinement === "string" ? refinement.trim() : "";

    const result = await sharpenForResearch(
      input.trim(),
      refinementStr || undefined,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sharpen error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

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
      { error: "Failed to sharpen input. Please try again." },
      { status: 500 },
    );
  }
}
