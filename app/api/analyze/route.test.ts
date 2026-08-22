// This route only touches Request/FormData/File (no DOM), and jsdom ships its
// own FormData/File implementation that fails webidl brand-checks against
// Node's native File across the realm boundary — run this file under Node.
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FAKE_SUTURE_ANALYSIS } from "@/lib/analysis/fixtures";

const { mockAnalyzeSuture } = vi.hoisted(() => ({ mockAnalyzeSuture: vi.fn() }));

vi.mock("@/lib/analysis/analyzeSuture", () => ({
  analyzeSuture: mockAnalyzeSuture,
}));

vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(() => ({
    ANTHROPIC_API_KEY: "sk-ant-test",
    ANALYSIS_MODEL: "claude-opus-5",
    USE_FAKE_ANALYSIS: false,
    MAX_UPLOAD_SIZE_MB: 25,
  })),
}));

import { POST } from "./route";
import { getEnv } from "@/lib/env";

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

function requestWithFile(file: File | null, notes?: string, model?: string): Request {
  const formData = new FormData();
  if (file) formData.append("media", file);
  if (notes) formData.append("notes", notes);
  if (model) formData.append("model", model);
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    mockAnalyzeSuture.mockReset();
  });

  it("returns 400 when no file is provided", async () => {
    const response = await POST(requestWithFile(null));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("no_file");
    expect(mockAnalyzeSuture).not.toHaveBeenCalled();
  });

  it("returns 400 for an unsupported file type", async () => {
    const file = makeFile("notes.pdf", "application/pdf", 1024);
    const response = await POST(requestWithFile(file));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("invalid_file_type");
    expect(mockAnalyzeSuture).not.toHaveBeenCalled();
  });

  it("returns 400 for an oversized file", async () => {
    const file = makeFile("big.png", "image/png", 26 * 1024 * 1024);
    const response = await POST(requestWithFile(file));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("file_too_large");
    expect(mockAnalyzeSuture).not.toHaveBeenCalled();
  });

  it("calls analyzeSuture and returns 200 with the analysis on success", async () => {
    mockAnalyzeSuture.mockResolvedValue({
      analysis: FAKE_SUTURE_ANALYSIS,
      modelUsed: "claude-opus-5",
      escalated: false,
    });
    const file = makeFile("photo.jpg", "image/jpeg", 1024);

    const response = await POST(
      requestWithFile(file, "left hand technique", "claude-sonnet-5"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.analysis).toEqual(FAKE_SUTURE_ANALYSIS);
    expect(body.modelUsed).toBe("claude-opus-5");
    expect(body.escalated).toBe(false);

    expect(mockAnalyzeSuture).toHaveBeenCalledOnce();
    const call = mockAnalyzeSuture.mock.calls[0][0];
    expect(call.notes).toBe("left hand technique");
    expect(call.model).toBe("claude-sonnet-5");
    expect(call.images).toHaveLength(1);
    expect(call.images[0].mediaType).toBe("image/jpeg");
  });

  it("reports escalation in the response when the analysis was escalated", async () => {
    mockAnalyzeSuture.mockResolvedValue({
      analysis: FAKE_SUTURE_ANALYSIS,
      modelUsed: "claude-opus-5",
      escalated: true,
    });
    const file = makeFile("photo.jpg", "image/jpeg", 1024);

    const response = await POST(requestWithFile(file, undefined, "claude-sonnet-5"));
    const body = await response.json();
    expect(body.escalated).toBe(true);
    expect(body.modelUsed).toBe("claude-opus-5");
  });

  it("returns 502 when analyzeSuture throws", async () => {
    mockAnalyzeSuture.mockRejectedValue(new Error("upstream boom"));
    const file = makeFile("photo.jpg", "image/jpeg", 1024);

    const response = await POST(requestWithFile(file));
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error.code).toBe("analysis_failed");
    expect(body.error.message).toBe("upstream boom");
  });

  it("returns a JSON 500 (not Next's default error page) when getEnv() throws", async () => {
    vi.mocked(getEnv).mockImplementationOnce(() => {
      throw new Error("ANTHROPIC_API_KEY is required");
    });
    const file = makeFile("photo.jpg", "image/jpeg", 1024);

    const response = await POST(requestWithFile(file));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("server_error");
    expect(body.error.message).toBe("ANTHROPIC_API_KEY is required");
    expect(mockAnalyzeSuture).not.toHaveBeenCalled();
  });
});
