import { z } from "zod";

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  ANALYSIS_MODEL: z.string().min(1).default("claude-opus-5"),
  USE_FAKE_ANALYSIS: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  // Default kept modest (not the ~25MB+ a modern phone photo can reach) since
  // this is a direct lever on Claude API cost per request — every uploaded
  // byte becomes billed input tokens.
  MAX_UPLOAD_SIZE_MB: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 10)),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANALYSIS_MODEL: process.env.ANALYSIS_MODEL,
    USE_FAKE_ANALYSIS: process.env.USE_FAKE_ANALYSIS,
    MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`,
    );
  }

  cached = parsed.data;
  return cached;
}
