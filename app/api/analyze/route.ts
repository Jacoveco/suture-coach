import { analyzeSuture } from "@/lib/analysis/analyzeSuture";
import { validateMediaFile } from "@/lib/media/validate";
import { getEnv } from "@/lib/env";

type ApiErrorCode =
  | "no_file"
  | "invalid_file_type"
  | "file_too_large"
  | "analysis_failed"
  | "server_error";

function errorResponse(code: ApiErrorCode, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  // Top-level guard so every failure — including getEnv() throwing on a
  // misconfigured server (e.g. missing ANTHROPIC_API_KEY) — returns our
  // typed JSON error shape instead of Next's default HTML/500 error page,
  // which the client's response.json() call would otherwise choke on.
  try {
    const env = getEnv();

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse("no_file", "Request must be multipart/form-data.", 400);
    }

    const files = formData.getAll("media").filter((v): v is File => v instanceof File);
    if (files.length === 0) {
      return errorResponse("no_file", "No media file was provided.", 400);
    }

    for (const file of files) {
      const validation = validateMediaFile(file, env.MAX_UPLOAD_SIZE_MB);
      if (!validation.valid) {
        const message =
          validation.error === "file_too_large"
            ? `File exceeds the ${env.MAX_UPLOAD_SIZE_MB}MB limit.`
            : "Unsupported file type. Please upload a JPEG/PNG photo or an MP4/WebM/MOV video.";
        return errorResponse(validation.error!, message, 400);
      }
    }

    const notes = formData.get("notes");
    const model = formData.get("model");

    try {
      const images = await Promise.all(
        files.map(async (file) => ({
          base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
          mediaType: (file.type === "image/png" ? "image/png" : "image/jpeg") as
            | "image/jpeg"
            | "image/png",
        })),
      );

      const { analysis, modelUsed, escalated } = await analyzeSuture({
        images,
        notes: typeof notes === "string" ? notes : undefined,
        model: typeof model === "string" ? model : undefined,
      });

      return Response.json({ analysis, modelUsed, escalated });
    } catch (error) {
      return errorResponse(
        "analysis_failed",
        error instanceof Error ? error.message : "Analysis failed.",
        502,
      );
    }
  } catch (error) {
    return errorResponse(
      "server_error",
      error instanceof Error ? error.message : "Something went wrong. Please try again later.",
      500,
    );
  }
}
