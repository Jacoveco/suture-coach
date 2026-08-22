import { describe, expect, it } from "vitest";
import { validateMediaFile, isVideoFile } from "./validate";

function makeFile(type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], "test-file", { type });
}

describe("validateMediaFile", () => {
  it("accepts a JPEG under the size limit", () => {
    const file = makeFile("image/jpeg", 1024);
    expect(validateMediaFile(file, 25)).toEqual({ valid: true });
  });

  it("accepts an MP4 video under the size limit", () => {
    const file = makeFile("video/mp4", 1024);
    expect(validateMediaFile(file, 25)).toEqual({ valid: true });
  });

  it("rejects an unsupported file type", () => {
    const file = makeFile("application/pdf", 1024);
    expect(validateMediaFile(file, 25)).toEqual({
      valid: false,
      error: "invalid_file_type",
    });
  });

  it("rejects a file over the size limit", () => {
    const file = makeFile("image/png", 2 * 1024 * 1024);
    expect(validateMediaFile(file, 1)).toEqual({
      valid: false,
      error: "file_too_large",
    });
  });
});

describe("isVideoFile", () => {
  it("identifies video MIME types", () => {
    expect(isVideoFile(makeFile("video/mp4", 10))).toBe(true);
    expect(isVideoFile(makeFile("image/jpeg", 10))).toBe(false);
  });
});
