import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/anthropic/client";
import { getEnv } from "@/lib/env";
import { buildSutureAnalysisPrompt } from "./prompt";
import { SutureAnalysisSchema, type SutureAnalysis } from "./schema";
import { FAKE_SUTURE_ANALYSIS } from "./fixtures";
import { isSelectableModel, type SelectableModel } from "./models";

export { SELECTABLE_MODELS, isSelectableModel, type SelectableModel } from "./models";

// Ceiling model used for a second, more careful pass whenever the requested
// model's own analysis comes back anything less than "high" confidence.
const ESCALATION_MODEL: SelectableModel = "claude-opus-5";

export interface AnalyzeSutureImage {
  base64: string;
  mediaType: "image/jpeg" | "image/png";
}

export interface AnalyzeSutureInput {
  images: AnalyzeSutureImage[];
  notes?: string;
  // Which model to start with. Falls back to ANALYSIS_MODEL if omitted or
  // not one of SELECTABLE_MODELS.
  model?: string;
}

export interface AnalyzeSutureResult {
  analysis: SutureAnalysis;
  // The model whose analysis was actually returned (may differ from the
  // requested model if escalation occurred).
  modelUsed: string;
  // True if the requested model's own analysis was below "high" confidence
  // and a second pass with ESCALATION_MODEL was run instead.
  escalated: boolean;
}

async function runAnalysis(
  model: string,
  input: AnalyzeSutureInput,
): Promise<SutureAnalysis> {
  const client = getAnthropicClient();

  const message = await client.messages.parse({
    model,
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

export async function analyzeSuture(
  input: AnalyzeSutureInput,
): Promise<AnalyzeSutureResult> {
  if (input.images.length === 0) {
    throw new Error("analyzeSuture: at least one image is required");
  }

  const env = getEnv();
  const requestedModel = isSelectableModel(input.model) ? input.model : env.ANALYSIS_MODEL;

  if (env.USE_FAKE_ANALYSIS) {
    return { analysis: FAKE_SUTURE_ANALYSIS, modelUsed: requestedModel, escalated: false };
  }

  const result = await runAnalysis(requestedModel, input);

  // Triage: if the requested model wasn't already the ceiling model and it
  // rated its own analysis below "high" confidence, redo the analysis with
  // the ceiling model rather than return a shaky read — keeping feedback as
  // true as possible even when the cheaper model was picked.
  if (requestedModel !== ESCALATION_MODEL && result.confidence !== "high") {
    const escalatedAnalysis = await runAnalysis(ESCALATION_MODEL, input);
    return { analysis: escalatedAnalysis, modelUsed: ESCALATION_MODEL, escalated: true };
  }

  return { analysis: result, modelUsed: requestedModel, escalated: false };
}
