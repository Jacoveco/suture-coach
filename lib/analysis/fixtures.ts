import type { SutureAnalysis } from "./schema";

// Canned analysis used when USE_FAKE_ANALYSIS=true (local dev / e2e tests) so
// the real API is never called. Also reused directly by unit/component tests
// as the single source of fixture data.
export const FAKE_SUTURE_ANALYSIS: SutureAnalysis = {
  summary:
    "Overall solid technique with generally even spacing. Tension is slightly " +
    "high on the middle stitches, and bite depth varies a bit across the wound line.",
  overallScore: 74,
  metrics: {
    spacing: { score: 80, note: "Stitch intervals are mostly even, with one wider gap near the midpoint." },
    tension: { score: 65, note: "Middle stitches are pulled tighter than the rest, causing slight puckering." },
    symmetry: { score: 78, note: "Bite depth is consistent on one side but shallower on the other." },
  },
  recommendations: [
    {
      title: "Loosen the middle stitches",
      detail: "Reduce tension on stitches 3-4 to avoid tissue puckering — aim for edges that meet without blanching.",
      priority: "high",
    },
    {
      title: "Even out stitch spacing near the midpoint",
      detail: "The gap between stitches 4 and 5 is noticeably wider than the rest — aim for consistent ~6mm spacing.",
      priority: "medium",
    },
    {
      title: "Match bite depth on both sides",
      detail: "The right-side bites are shallower than the left — take symmetric bites to keep the wound edges level.",
      priority: "low",
    },
  ],
  annotations: [
    {
      id: "ann-1",
      type: "tension_indicator",
      label: "Puckering at stitch 3",
      points: [{ x: 0.48, y: 0.52 }],
      severity: "major",
      note: "Tissue is bunching — tension is too high here.",
    },
    {
      id: "ann-2",
      type: "spacing_measurement",
      label: "Wide gap before stitch 5",
      points: [
        { x: 0.6, y: 0.5 },
        { x: 0.7, y: 0.5 },
      ],
      severity: "minor",
      note: "This gap is wider than the surrounding spacing.",
    },
  ],
  disclaimer:
    "This feedback is generated for training purposes on simulated/practice material only. " +
    "It is not a diagnostic or clinical assessment.",
  confidence: "high",
};
