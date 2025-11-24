import React from "react";
import { ChevronDown } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  setSelectedModel,
}) => {
  const models = [
    "veo-3.1-generate-preview",
    "veo-3.1-fast-generate-preview",
    "veo-2.0-generate-001",
  ];

  const formatModelName = (model: string) => {
    if (model.includes("veo-3.1-fast")) return "Veo 3.1 - Fast";
    if (model.includes("veo-3.1")) return "Veo 3.1";
    if (model.includes("veo-2.0")) return "Veo 2";
    return model;
  };

  return (
    <div className="relative flex items-center">
      <select
        aria-label="Model selector"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="pl-4 pr-10 py-2 md-label-large rounded-xl border border-[var(--md-sys-color-outline-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:border-[var(--md-sys-color-primary)] appearance-none md-interactive transition-all duration-200"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)'
        }}
      >
        {models.map((model) => (
          <option key={model} value={model} style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            color: 'var(--md-sys-color-on-surface)'
          }}>
            {formatModelName(model)}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 h-5 w-5 pointer-events-none" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
    </div>
  );
};

export default ModelSelector;
