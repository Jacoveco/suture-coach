import { describe, expect, it } from "vitest";
import { selectFrameTimestamps } from "./extractFrames";

// Pure timestamp-selection logic is unit-tested here. Actual frame
// extraction (video decode + canvas draw) needs a real browser — jsdom
// doesn't implement canvas rendering — so that path is verified manually /
// via Playwright (see docs/PLAN.md M7).
describe("selectFrameTimestamps", () => {
  it("returns an empty array for zero or negative duration", () => {
    expect(selectFrameTimestamps(0)).toEqual([]);
    expect(selectFrameTimestamps(-5)).toEqual([]);
  });

  it("returns the midpoint for a single frame", () => {
    expect(selectFrameTimestamps(10, 1)).toEqual([5]);
  });

  it("returns N evenly-spaced timestamps within the middle 80% of the clip", () => {
    const timestamps = selectFrameTimestamps(10, 3);
    expect(timestamps).toHaveLength(3);
    // margin = 10% of 10s = 1s on each side -> usable range [1, 9]
    expect(timestamps[0]).toBeCloseTo(1);
    expect(timestamps[2]).toBeCloseTo(9);
    expect(timestamps[1]).toBeCloseTo(5);
  });

  it("never returns a timestamp outside the clip duration", () => {
    const duration = 7.3;
    const timestamps = selectFrameTimestamps(duration, 5);
    for (const t of timestamps) {
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(duration);
    }
  });
});
