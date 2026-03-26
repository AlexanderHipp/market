import { describe, it, expect } from "vitest";
import { refinementHintsToPromptLines } from "./framing-prompt";

describe("refinementHintsToPromptLines", () => {
  it("returns lines for known hints", () => {
    const lines = refinementHintsToPromptLines([
      "too_broad",
      "focus_smb",
    ]);
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("Narrow");
    expect(lines[1]).toContain("SMB");
  });

  it("ignores unknown hints", () => {
    expect(refinementHintsToPromptLines(["unknown"])).toEqual([]);
  });
});
