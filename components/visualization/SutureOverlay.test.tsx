import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SutureOverlay } from "./SutureOverlay";
import { FAKE_SUTURE_ANALYSIS } from "@/lib/analysis/fixtures";

describe("SutureOverlay", () => {
  it("renders one annotation group per annotation, at the expected count", () => {
    render(
      <SutureOverlay imageUrl="blob:fake" annotations={FAKE_SUTURE_ANALYSIS.annotations} />,
    );

    for (const annotation of FAKE_SUTURE_ANALYSIS.annotations) {
      expect(screen.getByTestId(`annotation-${annotation.id}`)).toBeInTheDocument();
    }
  });

  it("applies severity as a data attribute for styling", () => {
    render(
      <SutureOverlay imageUrl="blob:fake" annotations={FAKE_SUTURE_ANALYSIS.annotations} />,
    );

    const major = screen.getByTestId("annotation-ann-1");
    expect(major).toHaveAttribute("data-severity", "major");
    const minor = screen.getByTestId("annotation-ann-2");
    expect(minor).toHaveAttribute("data-severity", "minor");
  });

  it("makes each annotation keyboard-focusable with an accessible label", () => {
    render(
      <SutureOverlay imageUrl="blob:fake" annotations={FAKE_SUTURE_ANALYSIS.annotations} />,
    );

    const annotation = screen.getByTestId("annotation-ann-1");
    expect(annotation).toHaveAttribute("tabindex", "0");
    expect(annotation).toHaveAccessibleName(FAKE_SUTURE_ANALYSIS.annotations[0].note!);
  });

  it("renders the source image", () => {
    render(<SutureOverlay imageUrl="blob:fake-url" annotations={[]} />);
    expect(screen.getByRole("img", { name: /suturing practice attempt/i })).toHaveAttribute(
      "src",
      "blob:fake-url",
    );
  });
});
