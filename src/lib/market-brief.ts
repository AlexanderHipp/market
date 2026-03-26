import type { MarketFrameDraft } from "./schemas";

/** Persisted brief: draft fields + id + timestamps + optional scope for deep-dive handoff */
export interface MarketBrief {
  id: string;
  rawInput: string;
  refinedInput?: string;
  /** Scope from framing flow when user narrowed the input */
  scope?: string;
  interpretationKind: string;
  subject: string;
  marketLens: string;
  directAlternatives: string[];
  adjacentAlternatives: string[];
  rationale: string;
  trackingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "market:briefs:v1";
export const MAX_STORED_BRIEFS = 10;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadBriefs(): MarketBrief[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMarketBrief);
  } catch {
    return [];
  }
}

function isMarketBrief(x: unknown): x is MarketBrief {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.rawInput === "string" &&
    typeof o.interpretationKind === "string" &&
    typeof o.subject === "string" &&
    typeof o.marketLens === "string" &&
    Array.isArray(o.directAlternatives) &&
    Array.isArray(o.adjacentAlternatives) &&
    typeof o.rationale === "string" &&
    typeof o.trackingEnabled === "boolean" &&
    typeof o.createdAt === "string" &&
    typeof o.updatedAt === "string"
  );
}

function persist(briefs: MarketBrief[]): void {
  if (!isBrowser()) return;
  const trimmed = briefs
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, MAX_STORED_BRIEFS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function listBriefsSorted(): MarketBrief[] {
  return loadBriefs().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getBrief(id: string): MarketBrief | undefined {
  return loadBriefs().find((b) => b.id === id);
}

export function createBrief(
  draft: MarketFrameDraft & {
    rawInput: string;
    refinedInput?: string;
    scope?: string;
  },
): MarketBrief {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const brief: MarketBrief = {
    id,
    rawInput: draft.rawInput,
    refinedInput: draft.refinedInput,
    scope: draft.scope,
    interpretationKind: draft.interpretationKind,
    subject: draft.subject,
    marketLens: draft.marketLens,
    directAlternatives: draft.directAlternatives,
    adjacentAlternatives: draft.adjacentAlternatives,
    rationale: draft.rationale,
    trackingEnabled: false,
    createdAt: now,
    updatedAt: now,
  };
  const all = loadBriefs();
  persist([brief, ...all]);
  return brief;
}

export function updateBriefTracking(id: string, trackingEnabled: boolean): MarketBrief | null {
  const all = loadBriefs();
  const idx = all.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const updated: MarketBrief = {
    ...all[idx],
    trackingEnabled,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  persist(all);
  return updated;
}

export function deleteBrief(id: string): boolean {
  const all = loadBriefs();
  const next = all.filter((b) => b.id !== id);
  if (next.length === all.length) return false;
  persist(next);
  return true;
}

export function exportBriefAsJson(brief: MarketBrief): string {
  return JSON.stringify(brief, null, 2);
}

/** Deep-dive URL: prefer stored scope; else first 200 chars of marketLens */
export function deepDiveQueryFromBrief(brief: MarketBrief): { input: string; scope?: string } {
  const input = (brief.refinedInput ?? brief.rawInput).trim();
  const scopeFromLens =
    !brief.scope?.trim() && brief.marketLens?.trim()
      ? brief.marketLens.trim().slice(0, 200)
      : undefined;
  const scope = brief.scope?.trim() || scopeFromLens;
  return {
    input,
    ...(scope ? { scope } : {}),
  };
}

/** Path + query for competitor deep-dive on home */
export function buildDeepDiveHref(brief: MarketBrief): string {
  const q = deepDiveQueryFromBrief(brief);
  const params = new URLSearchParams();
  params.set("input", q.input);
  if (q.scope) params.set("scope", q.scope);
  return `/?${params.toString()}`;
}
