import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MediaCapture } from "./MediaCapture";

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("MediaCapture", () => {
  it("renders both capture affordances", () => {
    render(<MediaCapture onFileSelected={vi.fn()} />);
    expect(screen.getByText("Take Photo / Video")).toBeInTheDocument();
    expect(screen.getByText("Choose from Library")).toBeInTheDocument();
  });

  it("calls onFileSelected with a valid file", () => {
    const onFileSelected = vi.fn();
    render(<MediaCapture onFileSelected={onFileSelected} />);

    const input = screen.getByLabelText("Choose a photo or video from your library");
    const file = makeFile("photo.jpg", "image/jpeg", 1024);
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelected).toHaveBeenCalledWith(file);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an inline error and does not call onFileSelected for an unsupported type", () => {
    const onFileSelected = vi.fn();
    render(<MediaCapture onFileSelected={onFileSelected} />);

    const input = screen.getByLabelText("Choose a photo or video from your library");
    const file = makeFile("notes.pdf", "application/pdf", 1024);
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelected).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/isn't supported/);
  });

  it("shows an inline error for a file over the size limit", () => {
    const onFileSelected = vi.fn();
    render(<MediaCapture onFileSelected={onFileSelected} maxSizeMb={1} />);

    const input = screen.getByLabelText("Choose a photo or video from your library");
    const file = makeFile("big.png", "image/png", 2 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelected).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/too large/);
  });
});
