const DEFAULT_FRAME_COUNT = 3;

/**
 * Picks target timestamps (seconds) for frame extraction, biased slightly
 * away from the very start/end of the clip. Pure function so timestamp
 * selection can be unit-tested without a real <video>/<canvas>.
 */
export function selectFrameTimestamps(
  durationSeconds: number,
  frameCount: number = DEFAULT_FRAME_COUNT,
): number[] {
  if (durationSeconds <= 0 || frameCount <= 0) return [];
  if (frameCount === 1) return [durationSeconds / 2];

  // Sample within the middle 80% of the clip so we avoid the first/last
  // frames, which are often blurry (camera starting/stopping) or blank.
  const margin = durationSeconds * 0.1;
  const usableStart = margin;
  const usableEnd = durationSeconds - margin;
  const step = (usableEnd - usableStart) / (frameCount - 1);

  return Array.from({ length: frameCount }, (_, i) => usableStart + step * i);
}

export interface ExtractedFrame {
  base64: string;
  mediaType: "image/jpeg";
}

/**
 * Extracts representative frames from a video file using an off-DOM
 * <video> + <canvas>. Browser-only — relies on real video decoding and
 * canvas rendering, so this is exercised manually/in Playwright rather than
 * under jsdom (see extractFrames.test.ts for what IS unit-tested here).
 */
export async function extractFramesFromVideo(
  file: File,
  frameCount: number = DEFAULT_FRAME_COUNT,
): Promise<ExtractedFrame[]> {
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;

  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load video metadata"));
    });

    const timestamps = selectFrameTimestamps(video.duration, frameCount);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas 2D context");

    const frames: ExtractedFrame[] = [];
    for (const timestamp of timestamps) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("Failed to seek video"));
        video.currentTime = timestamp;
      });

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      frames.push({ base64: dataUrl.split(",")[1] ?? "", mediaType: "image/jpeg" });
    }

    return frames;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
