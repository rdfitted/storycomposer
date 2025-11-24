"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  X,
  GripVertical,
  Clock,
  ArrowRight,
  Download,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
import NextImage from "next/image";
import { Scene, SceneFrameMode, canSceneGenerate } from "@/lib/storyboard";
import VideoPlayer from "./VideoPlayer";
import CharacterSelector from "./storyboard/CharacterSelector";
import type { StoryboardCharacter } from "@/lib/types/storyboard-characters";

interface SceneCardProps {
  scene: Scene;
  sceneIndex: number;
  characters: StoryboardCharacter[];
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onRemoveScene: (sceneId: string) => void;
  onGenerateScene: (sceneId: string) => void;
  onEnhancePrompt: (sceneId: string) => void;
  dragHandleProps?: React.HTMLProps<HTMLDivElement>;
}

const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  sceneIndex,
  characters,
  onUpdateScene,
  onRemoveScene,
  onGenerateScene,
  onEnhancePrompt,
  dragHandleProps,
}) => {
  const [isDraggingFirst, setIsDraggingFirst] = useState(false);
  const [isDraggingLast, setIsDraggingLast] = useState(false);
  const [isDraggingSingle, setIsDraggingSingle] = useState(false);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);

  // Single image upload (legacy mode)
  const handleSingleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdateScene(scene.id, { imageFile: file });
    }
  };

  // First frame upload
  const handleFirstFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdateScene(scene.id, { firstFrameFile: file });
    }
  };

  // Last frame upload
  const handleLastFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdateScene(scene.id, { lastFrameFile: file });
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateScene(scene.id, { prompt: e.target.value });
  };

  const handleFrameModeChange = (mode: SceneFrameMode) => {
    onUpdateScene(scene.id, { frameMode: mode });
  };

  // Drag and drop handlers
  const handleSingleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSingle(true);
  };
  const handleSingleDragLeave = () => setIsDraggingSingle(false);
  const handleSingleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSingle(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onUpdateScene(scene.id, { imageFile: files[0] });
    }
  };

  const handleFirstDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFirst(true);
  };
  const handleFirstDragLeave = () => setIsDraggingFirst(false);
  const handleFirstDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFirst(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onUpdateScene(scene.id, { firstFrameFile: files[0] });
    }
  };

  const handleLastDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLast(true);
  };
  const handleLastDragLeave = () => setIsDraggingLast(false);
  const handleLastDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLast(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onUpdateScene(scene.id, { lastFrameFile: files[0] });
    }
  };

  const canGenerate = canSceneGenerate(scene);

  const handleTrimmedOutput = (blob: Blob) => {
    if (scene.trimmedUrlRef) {
      URL.revokeObjectURL(scene.trimmedUrlRef);
    }
    const trimmedUrl = URL.createObjectURL(blob);
    onUpdateScene(scene.id, {
      trimmedBlobRef: blob,
      trimmedUrlRef: trimmedUrl,
      videoUrl: trimmedUrl,
    });
  };

  const handleResetTrim = () => {
    if (scene.trimmedUrlRef) {
      URL.revokeObjectURL(scene.trimmedUrlRef);
    }
    onUpdateScene(scene.id, {
      trimmedBlobRef: null,
      trimmedUrlRef: null,
      videoUrl: scene.originalVideoUrlRef,
    });
  };

  const downloadVideo = () => {
    const blob = scene.trimmedBlobRef || scene.videoBlobRef;
    if (!blob) return;

    const isTrimmed = !!scene.trimmedBlobRef;
    const filename = isTrimmed
      ? `scene_${sceneIndex + 1}_trimmed.webm`
      : `scene_${sceneIndex + 1}.mp4`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.setAttribute("download", filename);
    link.setAttribute("rel", "noopener");
    link.target = "_self";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 0);
  };

  const isDualFrameMode = scene.frameMode === "interpolation";

  return (
    <div className="md-surface-container-high border border-[var(--md-sys-color-outline-variant)] rounded-2xl p-4 md-elevation-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1"
          >
            <GripVertical className="w-4 h-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
          </div>
          <span className="md-title-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            Scene {sceneIndex + 1}
          </span>
        </div>
        <button
          onClick={() => onRemoveScene(scene.id)}
          className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
          title="Remove scene"
        >
          <X className="w-4 h-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
        </button>
      </div>

      {/* Frame Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="md-label-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Mode:
        </span>
        <div className="flex rounded-lg overflow-hidden border border-[var(--md-sys-color-outline-variant)]">
          <button
            onClick={() => handleFrameModeChange("single")}
            className={`px-3 py-1 md-label-small transition-all ${
              scene.frameMode === "single"
                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                : "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
            }`}
          >
            Single
          </button>
          <button
            onClick={() => handleFrameModeChange("interpolation")}
            className={`px-3 py-1 md-label-small transition-all border-l border-[var(--md-sys-color-outline-variant)] ${
              scene.frameMode === "interpolation"
                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                : "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]"
            }`}
          >
            Start + End
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image Upload Section */}
        <div>
          {isDualFrameMode ? (
            // Dual Frame Upload
            <div className="space-y-3">
              {/* First Frame */}
              <div>
                <div className="md-label-small mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  First Frame
                </div>
                <div
                  className={`rounded-xl border-2 border-dashed p-3 cursor-pointer transition-all duration-200 ${
                    isDraggingFirst
                      ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
                      : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)]"
                  }`}
                  onClick={() => firstFrameInputRef.current?.click()}
                  onDragOver={handleFirstDragOver}
                  onDragLeave={handleFirstDragLeave}
                  onDrop={handleFirstDrop}
                >
                  {scene.firstFrameFile ? (
                    <div className="flex items-center gap-2">
                      <NextImage
                        src={URL.createObjectURL(scene.firstFrameFile)}
                        alt="First frame"
                        width={80}
                        height={45}
                        className="w-16 h-10 object-cover rounded"
                      />
                      <span className="md-body-small truncate" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {scene.firstFrameFile.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <Upload className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} />
                      <span className="md-label-small" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        Upload first frame
                      </span>
                    </div>
                  )}
                  <input
                    ref={firstFrameInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFirstFrameUpload}
                  />
                </div>
              </div>

              {/* Last Frame */}
              <div>
                <div className="md-label-small mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Last Frame
                </div>
                <div
                  className={`rounded-xl border-2 border-dashed p-3 cursor-pointer transition-all duration-200 ${
                    isDraggingLast
                      ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
                      : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)]"
                  }`}
                  onClick={() => lastFrameInputRef.current?.click()}
                  onDragOver={handleLastDragOver}
                  onDragLeave={handleLastDragLeave}
                  onDrop={handleLastDrop}
                >
                  {scene.lastFrameFile ? (
                    <div className="flex items-center gap-2">
                      <NextImage
                        src={URL.createObjectURL(scene.lastFrameFile)}
                        alt="Last frame"
                        width={80}
                        height={45}
                        className="w-16 h-10 object-cover rounded"
                      />
                      <span className="md-body-small truncate" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {scene.lastFrameFile.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <Upload className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} />
                      <span className="md-label-small" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        Upload last frame
                      </span>
                    </div>
                  )}
                  <input
                    ref={lastFrameInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLastFrameUpload}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Single Image Upload (Legacy)
            <div
              className={`rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all duration-200 ${
                isDraggingSingle
                  ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
                  : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)]"
              }`}
              onClick={() => singleFileInputRef.current?.click()}
              onDragOver={handleSingleDragOver}
              onDragLeave={handleSingleDragLeave}
              onDrop={handleSingleDrop}
            >
              {scene.imageFile ? (
                <div className="space-y-2">
                  <NextImage
                    src={URL.createObjectURL(scene.imageFile)}
                    alt="Scene image"
                    width={400}
                    height={225}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="md-body-small text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {scene.imageFile.name}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Upload className="w-8 h-8" style={{ color: 'var(--md-sys-color-primary)' }} />
                  <div className="text-center">
                    <div className="md-label-large" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                      Upload Image
                    </div>
                    <div className="md-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Required for scene
                    </div>
                  </div>
                </div>
              )}
              <input
                ref={singleFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSingleImageUpload}
              />
            </div>
          )}
        </div>

        {/* Prompt and Controls Section */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={scene.prompt}
              onChange={handlePromptChange}
              placeholder="Describe what happens in this scene... Use @CharacterName to mention characters"
              className="w-full rounded-xl md-surface-container border border-[var(--md-sys-color-outline-variant)] px-4 py-3 pr-12 md-body-large placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:border-[var(--md-sys-color-primary)] resize-none"
              style={{ backgroundColor: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)' }}
              rows={3}
            />
            {/* Enhance Button */}
            <button
              onClick={() => onEnhancePrompt(scene.id)}
              disabled={!scene.prompt.trim() || scene.isEnhancingPrompt || scene.isGenerating}
              className={`absolute right-2 top-2 p-2 rounded-lg transition-all ${
                !scene.prompt.trim() || scene.isEnhancingPrompt || scene.isGenerating
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
              }`}
              title="Enhance prompt with AI"
            >
              {scene.isEnhancingPrompt ? (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
              ) : (
                <Sparkles className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} />
              )}
            </button>
          </div>

          {/* Character Selector */}
          {characters.length > 0 && (
            <CharacterSelector
              characters={characters}
              selectedIds={scene.characterIds || []}
              onChange={(ids) => onUpdateScene(scene.id, { characterIds: ids })}
            />
          )}

          <div className="flex items-center justify-between">
            <div>
              {scene.isGenerating && (
                <div className="flex items-center gap-2 md-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  <Clock className="w-4 h-4 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                  Generating...
                </div>
              )}
            </div>
            <button
              onClick={() => onGenerateScene(scene.id)}
              disabled={!canGenerate}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl md-label-large transition-all duration-200 ${
                !canGenerate
                  ? "opacity-60 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              style={{
                backgroundColor: !canGenerate ? 'var(--md-sys-color-surface-variant)' : 'var(--md-sys-color-primary)',
                color: !canGenerate ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-primary)'
              }}
            >
              {scene.isGenerating ? (
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Video Preview Section */}
      {scene.videoUrl && (
        <div className="mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center justify-between mb-3">
            <span className="md-label-large" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Generated Video
            </span>
            <div className="flex items-center gap-2">
              {scene.trimmedBlobRef && (
                <button
                  onClick={handleResetTrim}
                  className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                  title="Reset trim"
                >
                  <RotateCcw className="w-4 h-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
                </button>
              )}
              <button
                onClick={downloadVideo}
                className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
                title="Download video"
              >
                <Download className="w-4 h-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
              </button>
            </div>
          </div>
          <VideoPlayer
            src={scene.videoUrl}
            onOutputChanged={handleTrimmedOutput}
            onDownload={downloadVideo}
            onResetTrim={handleResetTrim}
          />
        </div>
      )}
    </div>
  );
};

export default SceneCard;
