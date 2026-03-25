import { ExternalLink } from "lucide-react";
import type { Competitor } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface CompetitorCardProps {
  competitor: Competitor;
}

export function CompetitorCard({ competitor }: CompetitorCardProps) {
  const confidenceVariant = {
    high: "success" as const,
    medium: "warning" as const,
    low: "secondary" as const,
  };

  return (
    <div className="border-b border-neutral-100 py-5 last:border-0 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
              {competitor.name}
            </h3>
            {competitor.website && (
              <a
                href={competitor.website.startsWith("http") ? competitor.website : `https://${competitor.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <Badge variant={confidenceVariant[competitor.confidence]} className="text-[10px] px-1.5 py-0">
              {competitor.confidence}
            </Badge>
          </div>
          <div className="space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
            <p>
              <span className="text-neutral-500 dark:text-neutral-500">Why they matter: </span>
              {competitor.whyTheyMatter}
            </p>
            <p>
              <span className="text-neutral-500 dark:text-neutral-500">Who they serve: </span>
              {competitor.whoTheyServe}
            </p>
            <p>
              <span className="text-neutral-500 dark:text-neutral-500">What makes them different: </span>
              {competitor.whatMakesThemDifferent}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
