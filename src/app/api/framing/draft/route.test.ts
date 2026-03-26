import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/openai", () => ({
  generateMarketFrame: vi.fn(),
}));

import { generateMarketFrame } from "@/lib/openai";
import { POST } from "./route";

const frameResult = {
  subject: "Acme",
  interpretationKind: "product" as const,
  marketLens: "Widgets for teams",
  directAlternatives: ["X"],
  adjacentAlternatives: ["Y"],
  rationale: "Test rationale",
  confidence: "high" as const,
};

describe("POST /api/framing/draft", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.mocked(generateMarketFrame).mockResolvedValue({
      result: frameResult,
      prompt: "p",
      rawResponse: "{}",
    });
  });

  it("returns 200 with framed JSON", async () => {
    const req = new NextRequest("http://localhost/api/framing/draft", {
      method: "POST",
      body: JSON.stringify({ rawInput: "Acme" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.subject).toBe("Acme");
    expect(generateMarketFrame).toHaveBeenCalled();
  });

  it("returns 400 when scope is required but missing", async () => {
    const req = new NextRequest("http://localhost/api/framing/draft", {
      method: "POST",
      body: JSON.stringify({
        rawInput: "exploring new ideas without a plan",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty input", async () => {
    const req = new NextRequest("http://localhost/api/framing/draft", {
      method: "POST",
      body: JSON.stringify({ rawInput: "  " }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
