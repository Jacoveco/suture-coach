import { z } from "zod";

export const OverlayAnnotationSchema = z.object({
  id: z.string(),
  type: z.enum([
    "stitch_point",
    "spacing_measurement",
    "tension_indicator",
    "symmetry_axis",
    "region",
  ]),
  label: z.string(),
  // Normalized 0-1 coordinates, relative to image width/height, so overlay
  // rendering never depends on the original image's pixel dimensions.
  points: z
    .array(
      z.object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
      }),
    )
    .min(1),
  severity: z.enum(["good", "minor", "major"]).optional(),
  note: z.string().optional(),
});

export const SutureMetricSchema = z.object({
  score: z.number().min(0).max(100),
  note: z.string(),
});

export const RecommendationSchema = z.object({
  title: z.string(),
  detail: z.string(),
  priority: z.enum(["high", "medium", "low"]),
});

export const SutureAnalysisSchema = z.object({
  summary: z.string(),
  overallScore: z.number().min(0).max(100).optional(),
  metrics: z.object({
    spacing: SutureMetricSchema,
    tension: SutureMetricSchema,
    symmetry: SutureMetricSchema,
  }),
  recommendations: z.array(RecommendationSchema),
  annotations: z.array(OverlayAnnotationSchema),
  // The model always restates: training tool, not clinical/diagnostic.
  disclaimer: z.string(),
});

export type OverlayAnnotation = z.infer<typeof OverlayAnnotationSchema>;
export type SutureAnalysis = z.infer<typeof SutureAnalysisSchema>;
