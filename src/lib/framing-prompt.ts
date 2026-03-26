import type { RefinementHint } from "./schemas";

/** Maps refinement chips to natural-language constraints for the framing model. */
export function refinementHintsToPromptLines(hints: string[]): string[] {
  const lines: string[] = [];
  for (const h of hints) {
    switch (h as RefinementHint) {
      case "too_broad":
        lines.push("Narrow the market segment; avoid generic categories.");
        break;
      case "wrong_market":
        lines.push("Re-evaluate which market category this belongs in; the previous lens may be wrong.");
        break;
      case "focus_smb":
        lines.push("Focus on small and medium businesses (SMB), not enterprise.");
        break;
      case "focus_enterprise":
        lines.push("Focus on mid-market and enterprise, not SMB or prosumer.");
        break;
      case "feature_not_product":
        lines.push("Treat the subject as a feature or capability within a larger product category, not a full standalone product.");
        break;
      default:
        break;
    }
  }
  return lines;
}
