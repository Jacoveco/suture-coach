import { analyzeSuture } from "@/lib/analysis/analyzeSuture";
import { validateMediaFile } from "@/lib/media/validate";
import { getEnv } from "@/lib/env";

type ApiErrorCode =
  | "no_file"
  | "invalid_file_type"
  | "file_too_large"
  | "analysis_failed";

function errorResponse(code: ApiErrorCode, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
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

  try {
    const images = await Promise.all(
      files.map(async (file) => ({
        base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
        mediaType: (file.type === "image/png" ? "image/png" : "image/jpeg") as
          | "image/jpeg"
          | "image/png",
      })),
    );

    const analysis = await analyzeSuture({
      images,
      notes: typeof notes === "string" ? notes : undefined,
    });

    return Response.json({ analysis });
  } catch (error) {
    return errorResponse(
      "analysis_failed",
      error instanceof Error ? error.message : "Analysis failed.",
      502,
    );
  }
}
