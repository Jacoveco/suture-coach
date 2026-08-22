import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecommendationList } from "./RecommendationList";
import { FAKE_SUTURE_ANALYSIS } from "@/lib/analysis/fixtures";
import type { SutureAnalysis } from "@/lib/analysis/schema";

describe("RecommendationList", () => {
  it("renders every recommendation with its priority", () => {
    render(<RecommendationList analysis={FAKE_SUTURE_ANALYSIS} />);
    for (const rec of FAKE_SUTURE_ANALYSIS.recommendations) {
      expect(screen.getByText(rec.title)).toBeInTheDocument();
      expect(screen.getByText(rec.detail)).toBeInTheDocument();
    }
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("renders a fallback message when there are no recommendations", () => {
    const analysis: SutureAnalysis = { ...FAKE_SUTURE_ANALYSIS, recommendations: [] };
    render(<RecommendationList analysis={analysis} />);
    expect(screen.getByText(/looks solid overall/)).toBeInTheDocument();
  });
});
