"use client";

import { useState } from "react";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";

interface ItemDetails {
  target: string;
  strengths: string;
  weaknesses: string;
  priceRange: "free" | "low" | "mid" | "high" | "enterprise";
}

interface RelatedQuery {
  label: string;
  query: string;
}

interface Item {
  name: string;
  positioning: string;
  details: ItemDetails;
  related: RelatedQuery[];
}

interface Result {
  inputType: "company" | "feature" | "segment" | "idea";
  market: string;
  description: string;
  items: Item[];
}

const priceLabels: Record<string, string> = {
  free: "Free",
  low: "Budget",
  mid: "Mid-range",
  high: "Premium",
  enterprise: "Enterprise",
};

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  async function analyze(query: string) {
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setExpanded(new Set());
    setInput(query);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: query.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    analyze(input);
  }

  function toggleExpand(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-xl px-4 py-20">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-neutral-500">
            What are you exploring?
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Intercom, live chat, enterprise CRM..."
            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-base outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </span>
            ) : (
              "Analyze"
            )}
          </button>
        </form>

        {error && (
          <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {result && (
          <div className="mt-12 space-y-6">
            <div>
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {result.market}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {result.description}
              </p>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {result.items.map((item) => {
                const isExpanded = expanded.has(item.name);
                return (
                  <div key={item.name} className="py-3">
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-neutral-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-neutral-400" />
                        )}
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm text-neutral-500">
                        {item.positioning}
                      </span>
                    </button>

                    {isExpanded && item.details && (
                      <div className="ml-6 mt-3 space-y-2 text-sm">
                        <div className="flex gap-2">
                          <span className="text-neutral-400 w-20">Target</span>
                          <span className="text-neutral-600 dark:text-neutral-300">
                            {item.details.target}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-neutral-400 w-20">Strengths</span>
                          <span className="text-neutral-600 dark:text-neutral-300">
                            {item.details.strengths}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-neutral-400 w-20">Weaknesses</span>
                          <span className="text-neutral-600 dark:text-neutral-300">
                            {item.details.weaknesses}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-neutral-400 w-20">Price</span>
                          <span className="text-neutral-600 dark:text-neutral-300">
                            {priceLabels[item.details.priceRange] || item.details.priceRange}
                          </span>
                        </div>

                        {item.related && item.related.length > 0 && (
                          <div className="flex gap-2 pt-2">
                            <span className="text-neutral-400 w-20">Explore</span>
                            <div className="flex flex-wrap gap-2">
                              {item.related.map((r) => (
                                <button
                                  key={r.query}
                                  onClick={() => analyze(r.query)}
                                  className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
