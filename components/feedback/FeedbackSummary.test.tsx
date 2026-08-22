import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedbackSummary } from "./FeedbackSummary";
import { FAKE_SUTURE_ANALYSIS } from "@/lib/analysis/fixtures";

describe("FeedbackSummary", () => {
  it("renders the summary text and disclaimer", () => {
    render(<FeedbackSummary analysis={FAKE_SUTURE_ANALYSIS} />);
    expect(screen.getByText(FAKE_SUTURE_ANALYSIS.summary)).toBeInTheDocument();
    expect(screen.getByText(FAKE_SUTURE_ANALYSIS.disclaimer)).toBeInTheDocument();
  });

  it("renders a score and note for each metric", () => {
    render(<FeedbackSummary analysis={FAKE_SUTURE_ANALYSIS} />);
    expect(screen.getByText("Spacing")).toBeInTheDocument();
    expect(screen.getByText("Tension")).toBeInTheDocument();
    expect(screen.getByText("Symmetry")).toBeInTheDocument();
    expect(screen.getByText(String(FAKE_SUTURE_ANALYSIS.metrics.spacing.score))).toBeInTheDocument();
    expect(screen.getByText(FAKE_SUTURE_ANALYSIS.metrics.tension.note)).toBeInTheDocument();
  });
});
