import { describe, expect, it } from "vitest";
import { SutureAnalysisSchema } from "./schema";
import { FAKE_SUTURE_ANALYSIS } from "./fixtures";

describe("SutureAnalysisSchema", () => {
  it("accepts a valid analysis", () => {
    const result = SutureAnalysisSchema.safeParse(FAKE_SUTURE_ANALYSIS);
    expect(result.success).toBe(true);
  });

  it("rejects a response missing required fields", () => {
    const { summary: _summary, ...withoutSummary } = FAKE_SUTURE_ANALYSIS;
    const result = SutureAnalysisSchema.safeParse(withoutSummary);
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range metric score", () => {
    const invalid = {
      ...FAKE_SUTURE_ANALYSIS,
      metrics: {
        ...FAKE_SUTURE_ANALYSIS.metrics,
        spacing: { score: 150, note: "too high" },
      },
    };
    const result = SutureAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects an annotation coordinate outside 0-1", () => {
    const invalid = {
      ...FAKE_SUTURE_ANALYSIS,
      annotations: [
        {
          id: "bad",
          type: "region" as const,
          label: "out of bounds",
          points: [{ x: 1.5, y: 0.5 }],
        },
      ],
    };
    const result = SutureAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
