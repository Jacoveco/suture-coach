import type { OverlayAnnotation } from "@/lib/analysis/schema";

const SEVERITY_COLOR: Record<NonNullable<OverlayAnnotation["severity"]>, string> = {
  good: "#10b981",
  minor: "#f59e0b",
  major: "#ef4444",
};

function colorFor(severity: OverlayAnnotation["severity"]): string {
  return SEVERITY_COLOR[severity ?? "minor"];
}

export function SutureOverlay({
  imageUrl,
  annotations,
}: {
  imageUrl: string;
  annotations: OverlayAnnotation[];
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
      {/* eslint-disable-next-line @next/next/no-img-element -- source is an
          uploaded/captured blob URL, not a static asset next/image can optimize */}
      <img src={imageUrl} alt="Suturing practice attempt" className="block h-auto w-full" />
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        {annotations.map((annotation) => {
          const color = colorFor(annotation.severity);
          const label = annotation.note ?? annotation.label;

          return (
            <g
              key={annotation.id}
              data-testid={`annotation-${annotation.id}`}
              data-severity={annotation.severity ?? "minor"}
              role="img"
              aria-label={label}
              tabIndex={0}
              className="pointer-events-auto focus:outline-none"
            >
              {annotation.points.length === 1 ? (
                <circle
                  cx={annotation.points[0].x}
                  cy={annotation.points[0].y}
                  r={0.015}
                  fill={color}
                  stroke="white"
                  strokeWidth={0.003}
                />
              ) : (
                <polyline
                  points={annotation.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={color}
                  strokeWidth={0.006}
                  strokeLinecap="round"
                />
              )}
              <title>{label}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
