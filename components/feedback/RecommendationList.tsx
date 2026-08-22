import type { SutureAnalysis } from "@/lib/analysis/schema";

const PRIORITY_STYLES = {
  high: "border-red-500/40 bg-red-50 dark:bg-red-950/40",
  medium: "border-amber-500/40 bg-amber-50 dark:bg-amber-950/40",
  low: "border-zinc-500/20 bg-zinc-50 dark:bg-zinc-900",
} as const;

export function RecommendationList({ analysis }: { analysis: SutureAnalysis }) {
  if (analysis.recommendations.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No specific recommendations — technique looks solid overall.
      </p>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-2">
      {analysis.recommendations.map((rec, i) => (
        <li
          key={i}
          className={`rounded-lg border p-3 ${PRIORITY_STYLES[rec.priority]}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{rec.title}</span>
            <span className="shrink-0 rounded-full bg-black/[.06] px-2 py-0.5 text-xs uppercase tracking-wide text-zinc-600 dark:bg-white/[.08] dark:text-zinc-400">
              {rec.priority}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{rec.detail}</p>
        </li>
      ))}
    </ul>
  );
}
