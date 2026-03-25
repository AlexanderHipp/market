"use client";

import { ChevronDown, Check, Loader2, AlertCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface TraceStep {
  name: string;
  status: "running" | "done" | "error";
  prompt?: string;
  response?: unknown;
}

interface TracePanelProps {
  trace: {
    discovery?: { prompt: string; response: unknown };
    explanations?: Array<{ name: string; prompt: string; response: unknown }>;
  };
  isLoading?: boolean;
  currentStep?: string;
}

function StatusIcon({ status }: { status: "running" | "done" | "error" }) {
  if (status === "running") {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />;
  }
  if (status === "done") {
    return <Check className="h-3.5 w-3.5 text-emerald-600" />;
  }
  return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
}

function TraceStepCard({ step }: { step: TraceStep }) {
  return (
    <Collapsible className="border border-neutral-100 rounded-md dark:border-neutral-800">
      <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900">
        <div className="flex items-center gap-2">
          <StatusIcon status={step.status} />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {step.name}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-neutral-100 p-3 space-y-3 dark:border-neutral-800">
          {step.prompt && (
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-1">Prompt</p>
              <pre className="text-xs bg-neutral-50 p-2 rounded overflow-x-auto whitespace-pre-wrap font-mono text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                {step.prompt}
              </pre>
            </div>
          )}
          {step.response !== undefined && step.response !== null && (
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-1">Response</p>
              <pre className="text-xs bg-neutral-50 p-2 rounded overflow-x-auto whitespace-pre-wrap font-mono text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                {JSON.stringify(step.response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TracePanel({ trace, isLoading, currentStep }: TracePanelProps) {
  const steps: TraceStep[] = [];

  // Add discovery step
  if (trace.discovery) {
    steps.push({
      name: "Competitor Discovery",
      status: "done",
      prompt: trace.discovery.prompt,
      response: trace.discovery.response,
    });
  } else if (isLoading && currentStep === "discovery") {
    steps.push({
      name: "Competitor Discovery",
      status: "running",
    });
  }

  // Add explanation steps
  if (trace.explanations) {
    for (const exp of trace.explanations) {
      steps.push({
        name: `Explain: ${exp.name}`,
        status: "done",
        prompt: exp.prompt,
        response: exp.response,
      });
    }
  }

  if (steps.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Collapsible className="mt-8">
      <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
        <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        <span>Show how this was researched</span>
        {isLoading && (
          <Badge variant="secondary" className="ml-2 text-[10px]">
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            Analyzing...
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        <div className="space-y-2">
          {steps.map((step, i) => (
            <TraceStepCard key={i} step={step} />
          ))}
          {isLoading && currentStep && !steps.find(s => s.name.includes(currentStep)) && (
            <div className="flex items-center gap-2 p-3 text-sm text-neutral-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{currentStep}</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
