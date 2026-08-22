const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export type MediaValidationError = "invalid_file_type" | "file_too_large";

export interface MediaValidationResult {
  valid: boolean;
  error?: MediaValidationError;
}

export function validateMediaFile(
  file: File,
  maxSizeMb: number,
): MediaValidationResult {
  const isAcceptedType =
    ACCEPTED_IMAGE_TYPES.includes(file.type) ||
    ACCEPTED_VIDEO_TYPES.includes(file.type);

  if (!isAcceptedType) {
    return { valid: false, error: "invalid_file_type" };
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return { valid: false, error: "file_too_large" };
  }

  return { valid: true };
}

export function isVideoFile(file: File): boolean {
  return ACCEPTED_VIDEO_TYPES.includes(file.type);
}
