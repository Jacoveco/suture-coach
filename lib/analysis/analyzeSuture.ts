import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/anthropic/client";
import { getEnv } from "@/lib/env";
import { buildSutureAnalysisPrompt } from "./prompt";
import { SutureAnalysisSchema, type SutureAnalysis } from "./schema";
import { FAKE_SUTURE_ANALYSIS } from "./fixtures";

export interface AnalyzeSutureImage {
  base64: string;
  mediaType: "image/jpeg" | "image/png";
}

export interface AnalyzeSutureInput {
  images: AnalyzeSutureImage[];
  notes?: string;
}

export async function analyzeSuture(
  input: AnalyzeSutureInput,
): Promise<SutureAnalysis> {
  if (input.images.length === 0) {
    throw new Error("analyzeSuture: at least one image is required");
  }

  const env = getEnv();

  if (env.USE_FAKE_ANALYSIS) {
    return FAKE_SUTURE_ANALYSIS;
  }

  const client = getAnthropicClient();

  const message = await client.messages.parse({
    model: env.ANALYSIS_MODEL,
    max_tokens: 3072,
    output_config: {
      effort: "low",
      format: zodOutputFormat(SutureAnalysisSchema),
    },
    system: buildSutureAnalysisPrompt(),
    messages: [
      {
        role: "user",
        content: [
          ...input.images.map((img) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: img.mediaType,
              data: img.base64,
            },
          })),
          {
            type: "text" as const,
            text: input.notes ?? "Analyze this suturing practice attempt.",
          },
        ],
      },
    ],
  });

  if (message.stop_reason === "refusal") {
    throw new Error("analyzeSuture: the analysis request was declined");
  }

  if (!message.parsed_output) {
    throw new Error("analyzeSuture: response did not include structured output");
  }

  return message.parsed_output;
}
