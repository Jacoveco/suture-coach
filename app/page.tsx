"use client";

import { useState } from "react";
import { MediaCapture } from "@/components/capture/MediaCapture";
import { FeedbackSummary } from "@/components/feedback/FeedbackSummary";
import { RecommendationList } from "@/components/feedback/RecommendationList";
import { SutureOverlay } from "@/components/visualization/SutureOverlay";
import type { SutureAnalysis } from "@/lib/analysis/schema";

type FlowState =
  | { status: "idle" }
  | { status: "analyzing"; imageUrl: string }
  | { status: "done"; imageUrl: string; analysis: SutureAnalysis }
  | { status: "error"; imageUrl: string; message: string };

export default function Home() {
  const [state, setState] = useState<FlowState>({ status: "idle" });

  async function handleFileSelected(file: File) {
    const imageUrl = URL.createObjectURL(file);
    setState({ status: "analyzing", imageUrl });

    try {
      const formData = new FormData();
      formData.append("media", file);

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

  return (
    <div className="flex min-h-dvh flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Suture Coach
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Upload a photo of a suturing practice attempt (simulator/training model
            only) for technique feedback.
          </p>
        </header>

        <MediaCapture onFileSelected={handleFileSelected} />

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

        {(state.status === "done" || state.status === "error") && (
          <SutureOverlay
            imageUrl={state.imageUrl}
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
