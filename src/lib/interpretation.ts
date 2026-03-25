import type { Interpretation, InterpretationKind } from "./types";

/** Known brands → deterministic market lens for clearer competitor discovery */
const KNOWN_LENS: Record<string, string> = {
  intercom: "Customer support and customer messaging software",
  linear: "Issue tracking and engineering planning tools",
  slack: "Team communication and workplace collaboration",
  notion: "Productivity, docs, and workspace software",
  figma: "Design and collaborative interface software",
  zendesk: "Customer support and help desk software",
};

/** Single- or two-word names that are too broad without a segment */
const MEGA_CORPS = new Set([
  "microsoft",
  "google",
  "amazon",
  "apple",
  "meta",
  "facebook",
  "oracle",
  "ibm",
  "samsung",
  "tesla",
  "netflix",
  "adobe",
  "salesforce",
  "cisco",
  "intel",
  "nvidia",
  "hp",
  "dell",
  "sony",
  "verizon",
]);

const MARKETISH =
  /software|platform|tool|app|service|solution|system|saas|crm|erp|cms/i;
const SMB_OR_SEGMENT = /for\s+(?:small|medium|large|enterprise|startup|smb|smbs|teams)/i;
const X_FOR_Y = /\s+for\s+/i;

const FEATURE_HEAD = /^(.+?)\s+feature\s+(?:at|in)\s+(.+)$/i;
const FEATURE_TAIL = /^(.+?)\s+(?:at|in)\s+([A-Z][a-zA-Z0-9]*(?:\s+[a-z][a-zA-Z0-9]*)?)$/;

const BROAD_IDEA =
  /^(?:the|a|an)\s|(?:^|\s)(?:idea|concept|thinking about|exploring)|\?$/i;

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function lensForKnownOrGeneric(subject: string): string {
  const key = subject.toLowerCase().trim();
  if (KNOWN_LENS[key]) return KNOWN_LENS[key];
  return `Software and services related to ${titleCase(subject)}`;
}

function buildDisplayLine(i: {
  kind: InterpretationKind;
  subject: string;
  context?: string;
  marketLens: string;
}): string {
  const kindPhrase =
    i.kind === "company"
      ? "a company"
      : i.kind === "product"
        ? "a product or company"
        : i.kind === "feature"
          ? "a feature within a product"
          : i.kind === "market"
            ? "a market or category"
            : "an idea or opportunity";

  const focus =
    i.kind === "feature" && i.context
      ? `${i.subject.trim()} in ${i.context.trim()}`
      : i.subject.trim();

  return `We’re treating this as ${kindPhrase}. Focus: ${focus}. Market lens: ${i.marketLens}.`;
}

function interpretCore(trimmed: string): Interpretation {
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const lower = trimmed.toLowerCase();

  if (trimmed.length === 0) {
    return {
      kind: "idea",
      subject: "",
      marketLens: "Not specified",
      isAmbiguous: true,
      clarificationPrompt: "What specifically should be tracked?",
      displayLine:
        "Add a company, product, or idea so we know what to compare.",
    };
  }

  if (trimmed.length <= 2) {
    return {
      kind: "idea",
      subject: trimmed,
      marketLens: "Not specific enough yet",
      isAmbiguous: true,
      clarificationPrompt: "What specifically should be tracked?",
      displayLine:
        "That’s too short to interpret reliably—add a bit more detail.",
    };
  }

  // "… feature at/in ProductCo"
  let m = trimmed.match(FEATURE_HEAD);
  if (m) {
    const featureName = m[1].trim();
    const productName = m[2].trim();
    const lens =
      /issue\s*tracking|bug|ticket/i.test(featureName)
        ? "Issue tracking and engineering planning tools"
        : `Capabilities around ${featureName} and similar products`;
    return {
      kind: "feature",
      subject: featureName,
      context: productName,
      marketLens: lens,
      isAmbiguous: false,
      displayLine: buildDisplayLine({
        kind: "feature",
        subject: featureName,
        context: productName,
        marketLens: lens,
      }),
    };
  }

  // "Issue tracking at Linear" (no word "feature")
  m = trimmed.match(FEATURE_TAIL);
  if (m && wordCount >= 3 && /^[A-Z]/.test(m[2])) {
    const featureName = m[1].trim();
    const productName = m[2].trim();
    const lens =
      /issue|tracking|bug|ticket|sprint|backlog/i.test(featureName)
        ? "Issue tracking and engineering planning tools"
        : lensForKnownOrGeneric(productName);
    return {
      kind: "feature",
      subject: featureName,
      context: productName,
      marketLens: lens,
      isAmbiguous: false,
      displayLine: buildDisplayLine({
        kind: "feature",
        subject: featureName,
        context: productName,
        marketLens: lens,
      }),
    };
  }

  // Mega-cap without segment
  if (wordCount <= 2 && MEGA_CORPS.has(lower.replace(/\s+/g, " "))) {
    return {
      kind: "company",
      subject: trimmed,
      marketLens: "Not specific enough yet—pick a product or segment",
      isAmbiguous: true,
      clarificationPrompt: "What specifically should be tracked?",
      displayLine: `We’re treating this as a company. Focus: too broad right now. Market lens: not specific enough yet.`,
    };
  }

  // Market / category phrases
  if (
    MARKETISH.test(trimmed) ||
    SMB_OR_SEGMENT.test(trimmed) ||
    X_FOR_Y.test(trimmed)
  ) {
    const isIdea =
      /\bAI\b|artificial intelligence|machine learning|startup|new\s+way/i.test(
        trimmed,
      );
    const kind: InterpretationKind = isIdea ? "idea" : "market";

    const refinedLens = isIdea
      ? /crm/i.test(trimmed)
        ? "CRM and AI-assisted sales tools for SMBs"
        : /support|messaging/i.test(trimmed)
          ? "Customer support and messaging software"
          : `Relevant products and alternatives for: ${trimmed.slice(0, 120)}`
      : `Competitors in: ${trimmed.slice(0, 120)}`;

    return {
      kind,
      subject: trimmed,
      marketLens: refinedLens,
      isAmbiguous: wordCount > 18,
      clarificationPrompt: wordCount > 18 ? "What specifically should be tracked?" : undefined,
      displayLine: buildDisplayLine({
        kind,
        subject: trimmed,
        marketLens: refinedLens,
      }),
    };
  }

  // Broad / vague long inputs
  if (BROAD_IDEA.test(trimmed) || wordCount > 15) {
    return {
      kind: "idea",
      subject: trimmed,
      marketLens: "We’ll narrow competitors once the focus is clearer",
      isAmbiguous: true,
      clarificationPrompt: "What specifically should be tracked?",
      displayLine: buildDisplayLine({
        kind: "idea",
        subject: trimmed,
        marketLens: "Needs a sharper focus",
      }),
    };
  }

  // Short company / product-like (1–2 words, capitalized)
  if (wordCount <= 2 && /^[A-Z]/.test(trimmed)) {
    const lens = lensForKnownOrGeneric(trimmed);
    return {
      kind: "product",
      subject: trimmed,
      marketLens: lens,
      isAmbiguous: false,
      displayLine: buildDisplayLine({
        kind: "product",
        subject: trimmed,
        marketLens: lens,
      }),
    };
  }

  // Default: treat as product / market exploration
  return {
    kind: "product",
    subject: trimmed,
    marketLens: `Products and alternatives related to: ${trimmed.slice(0, 120)}`,
    isAmbiguous: false,
    displayLine: buildDisplayLine({
      kind: "product",
      subject: trimmed,
      marketLens: `Products and alternatives related to this description`,
    }),
  };
}

/**
 * Merge user refinement: sharpens subject and usually clears ambiguity.
 */
function applyRefinement(base: Interpretation, refinement: string): Interpretation {
  const r = refinement.trim();
  if (!r) return base;

  const marketLens =
    base.marketLens.includes("Not specific") || base.marketLens.includes("Needs a sharper")
      ? `Competitors and alternatives for: ${r}`
      : `${base.marketLens} (focus: ${r})`;

  const displayLine = buildDisplayLine({
    kind: base.kind,
    subject: r,
    context: base.context,
    marketLens,
  });

  return {
    kind: base.kind,
    subject: r,
    context: base.context,
    marketLens,
    isAmbiguous: false,
    clarificationPrompt: undefined,
    displayLine,
  };
}

export function interpretInput(raw: string, refinement?: string): Interpretation {
  const trimmed = raw.trim();
  const ref = refinement?.trim() ?? "";

  const base = interpretCore(trimmed);
  if (!ref) return base;
  return applyRefinement(base, ref);
}
