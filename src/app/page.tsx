"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Competitor {
  name: string;
  positioning: string;
}

interface Result {
  market: string;
  description: string;
  competitors: Competitor[];
}

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
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
            placeholder="e.g. Intercom, CRM software, AI writing tools..."
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
              {result.competitors.map((c) => (
                <div key={c.name} className="flex justify-between py-3">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {c.name}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {c.positioning}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
