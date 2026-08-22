"use client";

import { useRef, useState } from "react";
import { validateMediaFile, type MediaValidationError } from "@/lib/media/validate";

const ERROR_MESSAGES: Record<MediaValidationError, string> = {
  invalid_file_type: "That file type isn't supported. Please choose a JPEG/PNG photo or an MP4/WebM/MOV video.",
  file_too_large: "That file is too large. Please choose a smaller photo or video.",
};

export interface MediaCaptureProps {
  onFileSelected: (file: File) => void;
  maxSizeMb?: number;
}

// Matches lib/env.ts's MAX_UPLOAD_SIZE_MB default — keep these in sync.
export function MediaCapture({ onFileSelected, maxSizeMb = 10 }: MediaCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    const result = validateMediaFile(file, maxSizeMb);
    if (!result.valid) {
      setError(ERROR_MESSAGES[result.error!]);
      return;
    }

    setError(null);
    onFileSelected(file);
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Take Photo / Video
        </button>
        <button
          type="button"
          onClick={() => libraryInputRef.current?.click()}
          className="flex h-12 flex-1 items-center justify-center rounded-full border border-solid border-black/[.08] px-5 text-base font-medium transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Choose from Library
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        aria-label="Take a photo or video"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        aria-label="Choose a photo or video from your library"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
