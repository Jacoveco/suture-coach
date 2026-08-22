// Models the user can pick between in the UI. Kept to a short allowlist so a
// client-supplied value can never select an arbitrary/unvetted model string.
// Deliberately dependency-free (no Anthropic SDK, no server-only code) so it
// can be imported from client components without pulling server code into
// the browser bundle.
export const SELECTABLE_MODELS = ["claude-opus-5", "claude-sonnet-5"] as const;
export type SelectableModel = (typeof SELECTABLE_MODELS)[number];

export function isSelectableModel(value: unknown): value is SelectableModel {
  return typeof value === "string" && (SELECTABLE_MODELS as readonly string[]).includes(value);
}

export const MODEL_LABELS: Record<SelectableModel, { label: string; description: string }> = {
  "claude-sonnet-5": { label: "Sonnet 5", description: "Faster, lower cost" },
  "claude-opus-5": { label: "Opus 5", description: "Most accurate" },
};
