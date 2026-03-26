import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const { input } = await request.json();

    if (!input?.trim()) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    const result = await analyze(input.trim());
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
