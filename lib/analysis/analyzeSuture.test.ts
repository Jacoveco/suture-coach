import { beforeEach, describe, expect, it, vi } from "vitest";
import { FAKE_SUTURE_ANALYSIS } from "./fixtures";

const mockParse = vi.fn();

vi.mock("@/lib/anthropic/client", () => ({
  getAnthropicClient: () => ({
    messages: { parse: mockParse },
  }),
}));

vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(() => ({
    ANTHROPIC_API_KEY: "sk-ant-test",
    ANALYSIS_MODEL: "claude-opus-5",
    USE_FAKE_ANALYSIS: false,
    MAX_UPLOAD_SIZE_MB: 25,
  })),
}));

import { analyzeSuture } from "./analyzeSuture";
import { getEnv } from "@/lib/env";

const SAMPLE_IMAGE = { base64: "ZmFrZS1pbWFnZS1kYXRh", mediaType: "image/jpeg" as const };

describe("analyzeSuture", () => {
  beforeEach(() => {
    mockParse.mockReset();
    vi.mocked(getEnv).mockReturnValue({
      ANTHROPIC_API_KEY: "sk-ant-test",
      ANALYSIS_MODEL: "claude-opus-5",
      USE_FAKE_ANALYSIS: false,
      MAX_UPLOAD_SIZE_MB: 25,
    });
  });

  it("throws when no images are provided", async () => {
    await expect(analyzeSuture({ images: [] })).rejects.toThrow(/at least one image/);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("returns the fixture without calling the API when USE_FAKE_ANALYSIS is true", async () => {
    vi.mocked(getEnv).mockReturnValue({
      ANTHROPIC_API_KEY: "sk-ant-test",
      ANALYSIS_MODEL: "claude-opus-5",
      USE_FAKE_ANALYSIS: true,
      MAX_UPLOAD_SIZE_MB: 25,
    });

    const result = await analyzeSuture({ images: [SAMPLE_IMAGE] });
    expect(result).toEqual(FAKE_SUTURE_ANALYSIS);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("returns parsed_output on a successful call", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: FAKE_SUTURE_ANALYSIS,
    });

    const result = await analyzeSuture({ images: [SAMPLE_IMAGE] });
    expect(result).toEqual(FAKE_SUTURE_ANALYSIS);
    expect(mockParse).toHaveBeenCalledOnce();
  });

  it("throws when the model refuses the request", async () => {
    mockParse.mockResolvedValue({ stop_reason: "refusal", parsed_output: null });
    await expect(analyzeSuture({ images: [SAMPLE_IMAGE] })).rejects.toThrow(/declined/);
  });

  it("throws when the response has no parsed_output", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: null });
    await expect(analyzeSuture({ images: [SAMPLE_IMAGE] })).rejects.toThrow(
      /structured output/,
    );
  });
});
