"use client";

import React from "react";
import {
  Upload,
  Wand2,
  Plus,
  ArrowRight,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import NextImage from "next/image";
import ModelSelector from "@/components/ui/ModelSelector";
import AspectRatioSelector from "@/components/ui/AspectRatioSelector";

type FrameMode = "start-only" | "end-only" | "interpolation";

interface ComposerProps {
  prompt: string;
  setPrompt: (value: string) => void;

  selectedModel: string;
  setSelectedModel: (model: string) => void;

  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;

  canStart: boolean;
  isGenerating: boolean;
  startGeneration: () => void;

  showImageTools: boolean;
  setShowImageTools: React.Dispatch<React.SetStateAction<boolean>>;

  // Frame mode support
  frameMode: FrameMode;
  setFrameMode: (mode: FrameMode) => void;

  // Starting frame
  startingFrameFile: File | null;
  generatedStartImage: string | null;
  onPickStartingFrame: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Ending frame
  endingFrameFile: File | null;
  generatedEndImage: string | null;
  onPickEndingFrame: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Image generation prompts
  startImagePrompt: string;
  setStartImagePrompt: (value: string) => void;
  endImagePrompt: string;
  setEndImagePrompt: (value: string) => void;

  // Imagen generation
  imagenBusy: boolean;
  generateStartWithImagen: () => Promise<void> | void;
  generateEndWithImagen: () => Promise<void> | void;

  // Prompt enhancement
  isEnhancingPrompt: boolean;
  enhancePrompt: () => Promise<void> | void;

  resetAll: () => void;
}

const Composer: React.FC<ComposerProps> = ({
  prompt,
  setPrompt,
  selectedModel,
  setSelectedModel,
  aspectRatio,
  setAspectRatio,
  canStart,
  isGenerating,
  startGeneration,
  showImageTools,
  setShowImageTools,
  frameMode,
  setFrameMode,
  startingFrameFile,
  generatedStartImage,
  onPickStartingFrame,
  endingFrameFile,
  generatedEndImage,
  onPickEndingFrame,
  startImagePrompt,
  setStartImagePrompt,
  endImagePrompt,
  setEndImagePrompt,
  imagenBusy,
  generateStartWithImagen,
  generateEndWithImagen,
  isEnhancingPrompt,
  enhancePrompt,
  resetAll,
}) => {
  const [isDraggingStart, setIsDraggingStart] = React.useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = React.useState(false);
  const startFileInputRef = React.useRef<HTMLInputElement>(null);
  const endFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenStartFileDialog = () => {
    startFileInputRef.current?.click();
  };

  const handleOpenEndFileDialog = () => {
    endFileInputRef.current?.click();
  };

  const handleStartDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingStart(true);
  };

  const handleStartDragLeave = () => {
    setIsDraggingStart(false);
  };

  const handleStartDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingStart(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onPickStartingFrame({
        target: { files },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleEndDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingEnd(true);
  };

  const handleEndDragLeave = () => {
    setIsDraggingEnd(false);
  };

  const handleEndDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingEnd(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onPickEndingFrame({
        target: { files },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleReset = () => {
    resetAll();
    setShowImageTools(false);
  };

  const showStartingFrame = frameMode === "start-only" || frameMode === "interpolation";
  const showEndingFrame = frameMode === "end-only" || frameMode === "interpolation";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-[min(100%,48rem)] px-4">
      {showImageTools && (
        <div className="mb-4 rounded-2xl md-surface-container-high border border-[var(--md-sys-color-outline-variant)] p-4 md-elevation-2">
          {/* Frame Mode Selector */}
          <div className="flex items-center gap-2 mb-4">
            <span className="md-label-large" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Frame Mode:
            </span>
            <div className="flex rounded-xl overflow-hidden border border-[var(--md-sys-color-outline-variant)]">
              <button
                onClick={() => setFrameMode("start-only")}
                className={`px-3 py-1.5 md-label-medium transition-all ${
                  frameMode === "start-only"
                    ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                    : "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                }`}
              >
                Start Only
              </button>
              <button
                onClick={() => setFrameMode("end-only")}
                className={`px-3 py-1.5 md-label-medium transition-all border-x border-[var(--md-sys-color-outline-variant)] ${
                  frameMode === "end-only"
                    ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                    : "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                }`}
              >
                End Only
              </button>
              <button
                onClick={() => setFrameMode("interpolation")}
                className={`px-3 py-1.5 md-label-medium transition-all ${
                  frameMode === "interpolation"
                    ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                    : "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
                }`}
              >
                Both Frames
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${frameMode === "interpolation" ? "grid-cols-2" : "grid-cols-1"}`}>
            {/* Starting Frame Upload */}
            {showStartingFrame && (
              <div>
                <div className="md-label-large mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Starting Frame
                </div>
                <div
                  className={`rounded-xl border-2 border-dashed p-4 cursor-pointer md-interactive transition-all duration-200 ${
                    isDraggingStart
                      ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
                      : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                  }`}
                  onClick={handleOpenStartFileDialog}
                  onDragOver={handleStartDragOver}
                  onDragLeave={handleStartDragLeave}
                  onDrop={handleStartDrop}
                >
                  <div className="flex items-center gap-3 text-[var(--md-sys-color-on-surface)]">
                    <Upload className="w-5 h-5" style={{ color: 'var(--md-sys-color-primary)' }} />
                    <div>
                      <div className="md-label-medium">
                        {startingFrameFile ? startingFrameFile.name : "Upload starting frame"}
                      </div>
                      <div className="md-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        PNG, JPG, WEBP
                      </div>
                    </div>
                  </div>
                  <input
                    ref={startFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickStartingFrame}
                  />
                </div>

                {/* Generate starting frame with Imagen */}
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={startImagePrompt}
                    onChange={(e) => setStartImagePrompt(e.target.value)}
                    placeholder="Or describe starting frame..."
                    className="flex-1 rounded-xl md-surface-container border border-[var(--md-sys-color-outline-variant)] px-3 py-2 md-body-medium placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                    style={{ backgroundColor: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)' }}
                  />
                  <button
                    onClick={generateStartWithImagen}
                    disabled={!startImagePrompt.trim() || imagenBusy}
                    className={`p-2 rounded-xl md-interactive transition-all ${
                      !startImagePrompt.trim() || imagenBusy ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    style={{
                      backgroundColor: !startImagePrompt.trim() || imagenBusy ? 'var(--md-sys-color-surface-variant)' : 'var(--md-sys-color-primary)',
                      color: !startImagePrompt.trim() || imagenBusy ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-primary)'
                    }}
                    title="Generate with Imagen"
                  >
                    {imagenBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Preview */}
                {!startingFrameFile && generatedStartImage && (
                  <div className="mt-3">
                    <NextImage
                      src={generatedStartImage}
                      alt="Generated starting frame"
                      width={320}
                      height={180}
                      className="max-h-32 rounded-xl border border-[var(--md-sys-color-outline-variant)] w-auto h-auto object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Ending Frame Upload */}
            {showEndingFrame && (
              <div>
                <div className="md-label-large mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Ending Frame
                </div>
                <div
                  className={`rounded-xl border-2 border-dashed p-4 cursor-pointer md-interactive transition-all duration-200 ${
                    isDraggingEnd
                      ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
                      : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                  }`}
                  onClick={handleOpenEndFileDialog}
                  onDragOver={handleEndDragOver}
                  onDragLeave={handleEndDragLeave}
                  onDrop={handleEndDrop}
                >
                  <div className="flex items-center gap-3 text-[var(--md-sys-color-on-surface)]">
                    <Upload className="w-5 h-5" style={{ color: 'var(--md-sys-color-primary)' }} />
                    <div>
                      <div className="md-label-medium">
                        {endingFrameFile ? endingFrameFile.name : "Upload ending frame"}
                      </div>
                      <div className="md-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        PNG, JPG, WEBP
                      </div>
                    </div>
                  </div>
                  <input
                    ref={endFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickEndingFrame}
                  />
                </div>

                {/* Generate ending frame with Imagen */}
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={endImagePrompt}
                    onChange={(e) => setEndImagePrompt(e.target.value)}
                    placeholder="Or describe ending frame..."
                    className="flex-1 rounded-xl md-surface-container border border-[var(--md-sys-color-outline-variant)] px-3 py-2 md-body-medium placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                    style={{ backgroundColor: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)' }}
                  />
                  <button
                    onClick={generateEndWithImagen}
                    disabled={!endImagePrompt.trim() || imagenBusy}
                    className={`p-2 rounded-xl md-interactive transition-all ${
                      !endImagePrompt.trim() || imagenBusy ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    style={{
                      backgroundColor: !endImagePrompt.trim() || imagenBusy ? 'var(--md-sys-color-surface-variant)' : 'var(--md-sys-color-primary)',
                      color: !endImagePrompt.trim() || imagenBusy ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-primary)'
                    }}
                    title="Generate with Imagen"
                  >
                    {imagenBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Preview */}
                {!endingFrameFile && generatedEndImage && (
                  <div className="mt-3">
                    <NextImage
                      src={generatedEndImage}
                      alt="Generated ending frame"
                      width={320}
                      height={180}
                      className="max-h-32 rounded-xl border border-[var(--md-sys-color-outline-variant)] w-auto h-auto object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="md-surface-container-highest border border-[var(--md-sys-color-outline-variant)] px-6 py-4 rounded-2xl md-elevation-3">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            aria-pressed={showImageTools}
            onClick={() => setShowImageTools((s) => !s)}
            className={`inline-flex items-center gap-2 px-4 py-2 md-label-large rounded-xl md-interactive transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] ${
              showImageTools
                ? "md-surface-container-high border border-[var(--md-sys-color-outline)]"
                : "hover:bg-[var(--md-sys-color-surface-container)]"
            }`}
            title="Image to Video"
            style={{
              backgroundColor: showImageTools ? 'var(--md-sys-color-surface-container-high)' : 'transparent',
              color: 'var(--md-sys-color-on-surface)'
            }}
          >
            <Plus className="w-5 h-5" />
            Frames
          </button>

          <div className="flex items-center gap-3">
            <AspectRatioSelector
              selectedRatio={aspectRatio}
              onRatioChange={setAspectRatio}
              compact={true}
              dropdownDirection="up"
              forVideo={true}
              selectedModel={selectedModel}
            />
            <ModelSelector
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your video..."
          className="w-full bg-transparent focus:outline-none resize-none md-body-large"
          style={{ color: 'var(--md-sys-color-on-surface)' }}
          rows={2}
        />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="h-12 w-12 flex items-center justify-center rounded-full md-interactive transition-all duration-200 border border-[var(--md-sys-color-outline-variant)]"
              style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" style={{ color: 'var(--md-sys-color-on-surface)' }} />
            </button>
            {/* Enhance Prompt Button */}
            <button
              onClick={enhancePrompt}
              disabled={!prompt.trim() || isEnhancingPrompt || isGenerating}
              className={`h-12 px-4 flex items-center gap-2 rounded-full md-interactive transition-all duration-200 border border-[var(--md-sys-color-outline-variant)] ${
                !prompt.trim() || isEnhancingPrompt || isGenerating ? "opacity-60 cursor-not-allowed" : ""
              }`}
              style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
              title="Enhance prompt with AI"
            >
              {isEnhancingPrompt ? (
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
              ) : (
                <Sparkles className="w-5 h-5" style={{ color: 'var(--md-sys-color-primary)' }} />
              )}
              <span className="md-label-large" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Enhance
              </span>
            </button>
          </div>
          <button
            onClick={startGeneration}
            disabled={!canStart || isGenerating}
            aria-busy={isGenerating}
            className={`h-12 w-12 flex items-center justify-center rounded-full md-interactive transition-all duration-200 ${
              !canStart || isGenerating
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer"
            }`}
            style={{
              backgroundColor: !canStart || isGenerating ? 'var(--md-sys-color-surface-variant)' : 'var(--md-sys-color-primary)',
              color: !canStart || isGenerating ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-primary)'
            }}
            title="Generate"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--md-sys-color-on-surface-variant)', borderTopColor: 'transparent' }} />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Composer;
