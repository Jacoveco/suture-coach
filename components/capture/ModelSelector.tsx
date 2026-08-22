"use client";

import { SELECTABLE_MODELS, MODEL_LABELS, type SelectableModel } from "@/lib/analysis/models";

export interface ModelSelectorProps {
  value: SelectableModel;
  onChange: (model: SelectableModel) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Analysis model
      </span>
      <div
        role="radiogroup"
        aria-label="Analysis model"
        className="flex rounded-full border border-black/[.08] p-1 dark:border-white/[.145]"
      >
        {SELECTABLE_MODELS.map((model) => {
          const isSelected = model === value;
          return (
            <button
              key={model}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(model)}
              className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-foreground text-background"
                  : "text-zinc-600 hover:bg-black/[.04] dark:text-zinc-400 dark:hover:bg-white/[.08]"
              }`}
            >
              {MODEL_LABELS[model].label}
              <span className="block text-[10px] font-normal opacity-80">
                {MODEL_LABELS[model].description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
