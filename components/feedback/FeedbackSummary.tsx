import type { SutureAnalysis } from "@/lib/analysis/schema";

const METRIC_LABELS = {
  spacing: "Spacing",
  tension: "Tension",
  symmetry: "Symmetry",
} as const;

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function FeedbackSummary({ analysis }: { analysis: SutureAnalysis }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
        {analysis.summary}
      </p>

      <dl className="grid grid-cols-3 gap-3">
        {(Object.keys(METRIC_LABELS) as Array<keyof typeof METRIC_LABELS>).map((key) => {
          const metric = analysis.metrics[key];
          return (
            <div
              key={key}
              className="flex flex-col items-center gap-1 rounded-xl border border-black/[.08] p-3 dark:border-white/[.145]"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {METRIC_LABELS[key]}
              </dt>
              <dd className={`text-2xl font-semibold ${scoreColor(metric.score)}`}>
                {metric.score}
              </dd>
              <dd className="text-center text-xs text-zinc-600 dark:text-zinc-400">
                {metric.note}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="rounded-lg bg-zinc-100 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        {analysis.disclaimer}
      </p>
    </div>
  );
}
