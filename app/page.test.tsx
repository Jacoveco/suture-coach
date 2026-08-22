import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FAKE_SUTURE_ANALYSIS } from "@/lib/analysis/fixtures";

const { mockExtractFrames } = vi.hoisted(() => ({ mockExtractFrames: vi.fn() }));

vi.mock("@/lib/media/extractFrames", () => ({
  extractFramesFromVideo: mockExtractFrames,
}));

import Home from "./page";

function makeFile(name: string, type: string, sizeBytes = 1024): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

function selectFile(file: File) {
  const input = screen.getByLabelText("Choose a photo or video from your library");
  fireEvent.change(input, { target: { files: [file] } });
}

describe("Home page", () => {
  beforeEach(() => {
    mockExtractFrames.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows the non-clinical training-tool disclaimer before any upload", () => {
    render(<Home />);
    expect(
      screen.getByText(/Training tool only/),
    ).toBeInTheDocument();
    expect(screen.getByText(/not a diagnostic or clinical device/)).toBeInTheDocument();
  });

  it("submits a single-frame request for a photo upload and renders feedback", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          analysis: FAKE_SUTURE_ANALYSIS,
          modelUsed: "claude-opus-5",
          escalated: false,
        }),
        { status: 200 },
      ),
    );

    render(<Home />);
    selectFile(makeFile("photo.jpg", "image/jpeg"));

    expect(screen.getByRole("status")).toHaveTextContent(/Analyzing/);

    await waitFor(() => expect(screen.getByText(FAKE_SUTURE_ANALYSIS.summary)).toBeInTheDocument());

    expect(fetch).toHaveBeenCalledOnce();
    const formData = vi.mocked(fetch).mock.calls[0][1]!.body as FormData;
    expect(formData.getAll("media")).toHaveLength(1);
    expect(formData.get("model")).toBe("claude-opus-5");
    expect(mockExtractFrames).not.toHaveBeenCalled();
    expect(screen.getByText(/Analyzed with Opus 5/)).toBeInTheDocument();
  });

  it("lets the user pick Sonnet 5 and sends that model in the request", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          analysis: FAKE_SUTURE_ANALYSIS,
          modelUsed: "claude-sonnet-5",
          escalated: false,
        }),
        { status: 200 },
      ),
    );

    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("radio", { name: /Sonnet 5/ }));
    selectFile(makeFile("photo.jpg", "image/jpeg"));

    await waitFor(() => expect(screen.getByText(FAKE_SUTURE_ANALYSIS.summary)).toBeInTheDocument());

    const formData = vi.mocked(fetch).mock.calls[0][1]!.body as FormData;
    expect(formData.get("model")).toBe("claude-sonnet-5");
    expect(screen.getByText(/Analyzed with Sonnet 5/)).toBeInTheDocument();
  });

  it("shows an escalation notice when the server escalated to Opus", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          analysis: FAKE_SUTURE_ANALYSIS,
          modelUsed: "claude-opus-5",
          escalated: true,
        }),
        { status: 200 },
      ),
    );

    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("radio", { name: /Sonnet 5/ }));
    selectFile(makeFile("photo.jpg", "image/jpeg"));

    await waitFor(() =>
      expect(screen.getByText(/automatically escalated from Sonnet 5/)).toBeInTheDocument(),
    );
  });

  it("extracts frames from a video upload and submits all of them", async () => {
    const frames = [
      makeFile("frame-0.jpg", "image/jpeg"),
      makeFile("frame-1.jpg", "image/jpeg"),
      makeFile("frame-2.jpg", "image/jpeg"),
    ];
    mockExtractFrames.mockResolvedValue(frames);
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          analysis: FAKE_SUTURE_ANALYSIS,
          modelUsed: "claude-opus-5",
          escalated: false,
        }),
        { status: 200 },
      ),
    );

    render(<Home />);
    selectFile(makeFile("clip.mp4", "video/mp4"));

    await waitFor(() => expect(mockExtractFrames).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByText(FAKE_SUTURE_ANALYSIS.summary)).toBeInTheDocument());

    const formData = vi.mocked(fetch).mock.calls[0][1]!.body as FormData;
    expect(formData.getAll("media")).toHaveLength(3);
  });

  it("shows an error and never calls the API when frame extraction fails", async () => {
    mockExtractFrames.mockRejectedValue(new Error("decode failed"));

    render(<Home />);
    selectFile(makeFile("clip.mp4", "video/mp4"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/Couldn't process that video/),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows an error message when the API returns a failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "analysis_failed", message: "Upstream error" } }), {
        status: 502,
      }),
    );

    render(<Home />);
    selectFile(makeFile("photo.jpg", "image/jpeg"));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Upstream error"));
  });

  it("shows a connection error when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    render(<Home />);
    selectFile(makeFile("photo.jpg", "image/jpeg"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/Couldn't reach the analysis service/),
    );
  });
});
