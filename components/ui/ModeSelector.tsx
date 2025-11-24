"use client";

import React, { useState } from "react";
import { Video, Film, ImageIcon, Wand2, Home, Sparkles, BookOpen, Box, ChevronDown, ChevronUp } from "lucide-react";
import type { Mode } from "@/lib/types";

interface ModeSelectorProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

interface ModeConfig {
  id: Mode;
  label: string;
  icon: React.ReactNode;
  category: "image" | "video" | "creative";
}

const MODES: ModeConfig[] = [
  // Image category
  { id: "photo-editor", label: "Photo Editor", icon: <ImageIcon className="w-5 h-5" />, category: "image" },
  { id: "ai-editor", label: "AI Editor", icon: <Wand2 className="w-5 h-5" />, category: "image" },
  { id: "home-canvas", label: "Home Canvas", icon: <Home className="w-5 h-5" />, category: "image" },
  { id: "nano-banana", label: "Nano Banana Pro", icon: <Sparkles className="w-5 h-5" />, category: "image" },
  // Video category
  { id: "single", label: "Single Video", icon: <Video className="w-5 h-5" />, category: "video" },
  { id: "storyboard", label: "Storyboard", icon: <Film className="w-5 h-5" />, category: "video" },
  // Creative category
  { id: "comic-creator", label: "Comic Creator", icon: <BookOpen className="w-5 h-5" />, category: "creative" },
  { id: "voxel-generator", label: "Voxel Generator", icon: <Box className="w-5 h-5" />, category: "creative" },
];

const CATEGORY_LABELS: Record<string, string> = {
  image: "Image",
  video: "Video",
  creative: "Creative",
};

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, setMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentMode = MODES.find((m) => m.id === mode);

  // Get modes by category
  const modesByCategory = MODES.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, ModeConfig[]>);

  return (
    <div className="relative">
      {/* Collapsed view - current mode button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
      >
        <span className="text-[var(--md-sys-color-primary)]">{currentMode?.icon}</span>
        <span className="md-label-large hidden sm:block">{currentMode?.label}</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-1" />
        )}
      </button>

      {/* Expanded dropdown */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsExpanded(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute top-full right-0 mt-2 z-40 w-56 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl shadow-lg overflow-hidden">
            {Object.entries(modesByCategory).map(([category, modes]) => (
              <div key={category}>
                <div className="px-3 py-2 bg-[var(--md-sys-color-surface-container-high)]">
                  <span className="md-label-small uppercase tracking-wider" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {CATEGORY_LABELS[category]}
                  </span>
                </div>
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id);
                      setIsExpanded(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${
                      mode === m.id
                        ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                        : "hover:bg-[var(--md-sys-color-surface-container-high)]"
                    }`}
                  >
                    <span className={mode === m.id ? "text-[var(--md-sys-color-primary)]" : ""}>{m.icon}</span>
                    <span className="md-label-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ModeSelector;