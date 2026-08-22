"use client";

import { useState } from "react";
import { MediaCapture } from "@/components/capture/MediaCapture";
import { FeedbackSummary } from "@/components/feedback/FeedbackSummary";
import { RecommendationList } from "@/components/feedback/RecommendationList";
import { SutureOverlay } from "@/components/visualization/SutureOverlay";
import { isVideoFile } from "@/lib/media/validate";
import { extractFramesFromVideo } from "@/lib/media/extractFrames";
import type { SutureAnalysis } from "@/lib/analysis/schema";

type FlowState =
  | { status: "idle" }
  | { status: "extracting" }
  | { status: "analyzing"; imageUrl: string }
  | { status: "done"; imageUrl: string; analysis: SutureAnalysis }
  | { status: "error"; imageUrl?: string; message: string };

export default function Home() {
  const [state, setState] = useState<FlowState>({ status: "idle" });

  async function submitForAnalysis(files: File[], imageUrl: string) {
    setState({ status: "analyzing", imageUrl });

    try {
      const formData = new FormData();
      for (const file of files) formData.append("media", file);

      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      const body = await response.json();

      if (!response.ok) {
        setState({
          status: "error",
          imageUrl,
          message: body.error?.message ?? "Analysis failed. Please try again.",
        });
        return;
      }

      setState({ status: "done", imageUrl, analysis: body.analysis });
    } catch {
      setState({
        status: "error",
        imageUrl,
        message: "Couldn't reach the analysis service. Check your connection and try again.",
      });
    }
  }

  async function handleFileSelected(file: File) {
    if (!isVideoFile(file)) {
      await submitForAnalysis([file], URL.createObjectURL(file));
      return;
    }

    setState({ status: "extracting" });

    let frames: File[];
    try {
      frames = await extractFramesFromVideo(file);
    } catch {
      setState({
        status: "error",
        message:
          "Couldn't process that video. Please try a different clip, or upload a photo instead.",
      });
      return;
    }

    const previewFrame = frames[Math.floor(frames.length / 2)];
    await submitForAnalysis(frames, URL.createObjectURL(previewFrame));
  }

  let overlayImageUrl: string | undefined;
  if (state.status === "done") overlayImageUrl = state.imageUrl;
  else if (state.status === "error" && state.imageUrl) overlayImageUrl = state.imageUrl;

  return (
    <div className="flex min-h-dvh flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Suture Coach
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Upload a photo or video of a suturing practice attempt (simulator/training
            model only) for technique feedback.
          </p>
        </header>

        <p className="rounded-lg border border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          Training tool only. For use with simulators and training models — never real
          patients. This is not a diagnostic or clinical device, and feedback should not
          be used to make clinical decisions.
        </p>

        <MediaCapture onFileSelected={handleFileSelected} />

        {state.status === "extracting" && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
            Extracting frames from your video…
          </p>
        )}

        {state.status === "analyzing" && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
            Analyzing your suturing technique…
          </p>
        )}

        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        )}

        {overlayImageUrl && (
          <SutureOverlay
            imageUrl={overlayImageUrl}
            annotations={state.status === "done" ? state.analysis.annotations : []}
          />
        )}

        {state.status === "done" && (
          <>
            <FeedbackSummary analysis={state.analysis} />
            <RecommendationList analysis={state.analysis} />
          </>
        )}
      </main>
    </div>
  );
}
