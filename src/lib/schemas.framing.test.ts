import { describe, it, expect } from "vitest";
import { marketFrameDraftSchema } from "./schemas";

describe("marketFrameDraftSchema", () => {
  it("parses a valid payload", () => {
    const parsed = marketFrameDraftSchema.parse({
      subject: "Test",
      interpretationKind: "product",
      marketLens: "B2B SaaS",
      directAlternatives: ["A", "B"],
      adjacentAlternatives: ["C"],
      rationale: "Because.",
      confidence: "high",
    });
    expect(parsed.subject).toBe("Test");
  });

  it("allows string interpretationKind from the model", () => {
    const parsed = marketFrameDraftSchema.parse({
      subject: "Test",
      interpretationKind: "startup_concept",
      marketLens: "X",
      directAlternatives: [],
      adjacentAlternatives: [],
      rationale: "R",
    });
    expect(parsed.interpretationKind).toBe("startup_concept");
  });
});
