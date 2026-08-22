import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModelSelector } from "./ModelSelector";

describe("ModelSelector", () => {
  it("renders both model options with the current one selected", () => {
    render(<ModelSelector value="claude-opus-5" onChange={vi.fn()} />);

    const opus = screen.getByRole("radio", { name: /Opus 5/ });
    const sonnet = screen.getByRole("radio", { name: /Sonnet 5/ });
    expect(opus).toHaveAttribute("aria-checked", "true");
    expect(sonnet).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange with the newly picked model", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ModelSelector value="claude-opus-5" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: /Sonnet 5/ }));

    expect(onChange).toHaveBeenCalledWith("claude-sonnet-5");
  });
});
