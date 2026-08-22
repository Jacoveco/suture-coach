import { beforeEach, describe, expect, it, vi } from "vitest";
import { FAKE_SUTURE_ANALYSIS } from "./fixtures";

const { mockParse } = vi.hoisted(() => ({ mockParse: vi.fn() }));

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
    expect(result).toEqual({
      analysis: FAKE_SUTURE_ANALYSIS,
      modelUsed: "claude-opus-5",
      escalated: false,
    });
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("returns parsed_output on a successful call, with no escalation when confidence is high", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: FAKE_SUTURE_ANALYSIS,
    });

    const result = await analyzeSuture({ images: [SAMPLE_IMAGE] });
    expect(result).toEqual({
      analysis: FAKE_SUTURE_ANALYSIS,
      modelUsed: "claude-opus-5",
      escalated: false,
    });
    expect(mockParse).toHaveBeenCalledOnce();
  });

  it("uses the requested selectable model when provided", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: FAKE_SUTURE_ANALYSIS });

    await analyzeSuture({ images: [SAMPLE_IMAGE], model: "claude-sonnet-5" });

    expect(mockParse).toHaveBeenCalledOnce();
    expect(mockParse.mock.calls[0][0].model).toBe("claude-sonnet-5");
  });

  it("falls back to ANALYSIS_MODEL when an unrecognized model is requested", async () => {
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: FAKE_SUTURE_ANALYSIS });

    await analyzeSuture({ images: [SAMPLE_IMAGE], model: "some-unvetted-model" });

    expect(mockParse.mock.calls[0][0].model).toBe("claude-opus-5");
  });

  it("escalates to Opus when Sonnet's own analysis is below high confidence", async () => {
    const sonnetResult = { ...FAKE_SUTURE_ANALYSIS, confidence: "low" as const };
    const opusResult = { ...FAKE_SUTURE_ANALYSIS, confidence: "high" as const };
    mockParse
      .mockResolvedValueOnce({ stop_reason: "end_turn", parsed_output: sonnetResult })
      .mockResolvedValueOnce({ stop_reason: "end_turn", parsed_output: opusResult });

    const result = await analyzeSuture({ images: [SAMPLE_IMAGE], model: "claude-sonnet-5" });

    expect(mockParse).toHaveBeenCalledTimes(2);
    expect(mockParse.mock.calls[0][0].model).toBe("claude-sonnet-5");
    expect(mockParse.mock.calls[1][0].model).toBe("claude-opus-5");
    expect(result).toEqual({ analysis: opusResult, modelUsed: "claude-opus-5", escalated: true });
  });

  it("does not escalate when Sonnet is confident", async () => {
    const sonnetResult = { ...FAKE_SUTURE_ANALYSIS, confidence: "high" as const };
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: sonnetResult });

    const result = await analyzeSuture({ images: [SAMPLE_IMAGE], model: "claude-sonnet-5" });

    expect(mockParse).toHaveBeenCalledOnce();
    expect(result).toEqual({ analysis: sonnetResult, modelUsed: "claude-sonnet-5", escalated: false });
  });

  it("never escalates when Opus itself is already the requested model, even at low confidence", async () => {
    const lowConfidenceOpus = { ...FAKE_SUTURE_ANALYSIS, confidence: "low" as const };
    mockParse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: lowConfidenceOpus });

    const result = await analyzeSuture({ images: [SAMPLE_IMAGE], model: "claude-opus-5" });

    expect(mockParse).toHaveBeenCalledOnce();
    expect(result).toEqual({
      analysis: lowConfidenceOpus,
      modelUsed: "claude-opus-5",
      escalated: false,
    });
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
