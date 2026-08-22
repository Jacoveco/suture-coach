import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("getEnv", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws a clear error when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { getEnv } = await import("./env");
    expect(() => getEnv()).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("parses valid config and applies defaults", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
    delete process.env.ANALYSIS_MODEL;
    delete process.env.USE_FAKE_ANALYSIS;
    delete process.env.MAX_UPLOAD_SIZE_MB;

    const { getEnv } = await import("./env");
    const env = getEnv();

    expect(env.ANTHROPIC_API_KEY).toBe("sk-ant-test-key");
    expect(env.ANALYSIS_MODEL).toBe("claude-opus-5");
    expect(env.USE_FAKE_ANALYSIS).toBe(false);
    expect(env.MAX_UPLOAD_SIZE_MB).toBe(10);
  });

  it("respects overrides", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
    process.env.ANALYSIS_MODEL = "claude-sonnet-5";
    process.env.USE_FAKE_ANALYSIS = "true";
    process.env.MAX_UPLOAD_SIZE_MB = "5";

    const { getEnv } = await import("./env");
    const env = getEnv();

    expect(env.ANALYSIS_MODEL).toBe("claude-sonnet-5");
    expect(env.USE_FAKE_ANALYSIS).toBe(true);
    expect(env.MAX_UPLOAD_SIZE_MB).toBe(5);
  });
});
