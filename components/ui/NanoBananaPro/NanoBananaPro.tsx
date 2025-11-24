"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Sparkles, Camera, Type, Image as ImageIcon, ChevronDown, ChevronUp, X, Loader2, Download } from "lucide-react";
import type {
  Resolution,
  CameraControls,
  TextOverlay,
  ReferenceObject,
  CharacterReference,
} from "@/lib/types";
import {
  RESOLUTIONS,
  CAMERA_ANGLES,
  DOF_OPTIONS,
  LIGHTING_PRESETS,
  COLOR_GRADINGS,
  LENS_OPTIONS,
  DEFAULT_CAMERA_CONTROLS,
} from "@/lib/types";

const NanoBananaPro: React.FC = () => {
  // Core state
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1" | "9:16" | "4:3">("1:1");

  // Camera controls
  const [showCameraControls, setShowCameraControls] = useState(false);
  const [cameraControls, setCameraControls] = useState<CameraControls>(DEFAULT_CAMERA_CONTROLS);

  // Text overlay
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [textOverlay, setTextOverlay] = useState<TextOverlay | null>(null);

  // Reference objects (max 14)
  const [referenceObjects, setReferenceObjects] = useState<ReferenceObject[]>([]);

  // Character references (max 5) - prepared for future character consistency feature
  const [characterReferences, setCharacterReferences] = useState<CharacterReference[]>([]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle reference object upload
  const onDropReferenceObjects = useCallback((acceptedFiles: File[]) => {
    const remainingSlots = 14 - referenceObjects.length;
    const filesToProcess = acceptedFiles.slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newObj: ReferenceObject = {
          id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          dataUrl: reader.result as string,
          label: file.name.split(".")[0],
        };
        setReferenceObjects((prev) => [...prev, newObj].slice(0, 14));
      };
      reader.readAsDataURL(file);
    });
  }, [referenceObjects.length]);

  const { getRootProps: getRefRootProps, getInputProps: getRefInputProps, isDragActive: isRefDragActive } = useDropzone({
    onDrop: onDropReferenceObjects,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 14 - referenceObjects.length,
  });

  const removeReferenceObject = (id: string) => {
    setReferenceObjects((prev) => prev.filter((obj) => obj.id !== id));
  };

  // Character reference functions - prepared for future character consistency feature
  // These will be used when the character panel UI is implemented
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _addCharacterReference = () => {
    if (characterReferences.length >= 5) return;
    const newChar: CharacterReference = {
      id: `char-${Date.now()}`,
      name: `Character ${characterReferences.length + 1}`,
      images: [],
    };
    setCharacterReferences((prev) => [...prev, newChar]);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _removeCharacterReference = (id: string) => {
    setCharacterReferences((prev) => prev.filter((c) => c.id !== id));
  };

  // Generate image
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      if (negativePrompt) formData.append("negativePrompt", negativePrompt);
      formData.append("resolution", resolution);
      formData.append("aspectRatio", aspectRatio);

      if (showCameraControls) {
        formData.append("cameraControls", JSON.stringify(cameraControls));
      }

      if (showTextOverlay && textOverlay) {
        formData.append("textOverlay", JSON.stringify(textOverlay));
      }

      // Add reference objects
      referenceObjects.forEach((obj) => {
        formData.append("referenceObjects", obj.file);
      });

      const response = await fetch("/api/nano-banana/generate", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      if (json.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        setGeneratedImage(dataUrl);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `nano-banana-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="md-headline-small flex items-center gap-2">
            <Sparkles className="w-6 h-6" style={{ color: "var(--md-sys-color-primary)" }} />
            Nano Banana Pro
          </h2>
          <p className="md-body-medium mt-1" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
            Advanced 4K image generation with professional controls
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-4">
            {/* Prompt Input */}
            <div className="md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)]">
              <label className="md-label-large block mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="w-full h-32 px-4 py-3 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-large resize-none focus:outline-none focus:border-[var(--md-sys-color-primary)]"
              />
              <div className="mt-2">
                <label className="md-label-medium block mb-1" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  Negative Prompt (optional)
                </label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Things to avoid..."
                  className="w-full px-4 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium focus:outline-none focus:border-[var(--md-sys-color-primary)]"
                />
              </div>
            </div>

            {/* Resolution & Aspect Ratio */}
            <div className="md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="md-label-large block mb-2">Resolution</label>
                  <div className="flex gap-2">
                    {RESOLUTIONS.map((res) => (
                      <button
                        key={res.value}
                        onClick={() => setResolution(res.value)}
                        className={`px-4 py-2 rounded-lg md-label-large transition-all ${
                          resolution === res.value
                            ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                            : "bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
                        }`}
                      >
                        {res.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 md-body-small" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {RESOLUTIONS.find((r) => r.value === resolution)?.price} per image
                  </p>
                </div>
                <div>
                  <label className="md-label-large block mb-2">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium"
                  >
                    <option value="1:1">1:1 Square</option>
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="4:3">4:3 Standard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Camera Controls (Collapsible) */}
            <div className="md-surface-container rounded-xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
              <button
                onClick={() => setShowCameraControls(!showCameraControls)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5" style={{ color: "var(--md-sys-color-primary)" }} />
                  <span className="md-label-large">Camera Controls</span>
                </div>
                {showCameraControls ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {showCameraControls && (
                <div className="px-4 pb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="md-label-medium block mb-1">Angle</label>
                    <select
                      value={cameraControls.angle}
                      onChange={(e) => setCameraControls({ ...cameraControls, angle: e.target.value as typeof cameraControls.angle })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-small"
                    >
                      {CAMERA_ANGLES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="md-label-medium block mb-1">Depth of Field</label>
                    <select
                      value={cameraControls.dof}
                      onChange={(e) => setCameraControls({ ...cameraControls, dof: e.target.value as typeof cameraControls.dof })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-small"
                    >
                      {DOF_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="md-label-medium block mb-1">Lighting</label>
                    <select
                      value={cameraControls.lighting}
                      onChange={(e) => setCameraControls({ ...cameraControls, lighting: e.target.value as typeof cameraControls.lighting })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-small"
                    >
                      {LIGHTING_PRESETS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="md-label-medium block mb-1">Color Grading</label>
                    <select
                      value={cameraControls.colorGrading}
                      onChange={(e) => setCameraControls({ ...cameraControls, colorGrading: e.target.value as typeof cameraControls.colorGrading })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-small"
                    >
                      {COLOR_GRADINGS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="md-label-medium block mb-1">Lens (optional)</label>
                    <select
                      value={cameraControls.lens || ""}
                      onChange={(e) => setCameraControls({ ...cameraControls, lens: e.target.value || undefined })}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-small"
                    >
                      <option value="">Auto</option>
                      {LENS_OPTIONS.map((lens) => (
                        <option key={lens} value={lens}>{lens}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Text Overlay (Collapsible) */}
            <div className="md-surface-container rounded-xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
              <button
                onClick={() => setShowTextOverlay(!showTextOverlay)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5" style={{ color: "var(--md-sys-color-primary)" }} />
                  <span className="md-label-large">Text Overlay</span>
                </div>
                {showTextOverlay ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {showTextOverlay && (
                <div className="px-4 pb-4 space-y-3">
                  <input
                    type="text"
                    value={textOverlay?.text || ""}
                    onChange={(e) => setTextOverlay({ ...textOverlay, text: e.target.value, style: textOverlay?.style || "headline", position: textOverlay?.position || "center" })}
                    placeholder="Enter text to overlay..."
                    className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="md-label-medium block mb-1">Style</label>
                      <select
                        value={textOverlay?.style || "headline"}
                        onChange={(e) => setTextOverlay({ ...textOverlay, text: textOverlay?.text || "", style: e.target.value as TextOverlay["style"], position: textOverlay?.position || "center" })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-small"
                      >
                        <option value="headline">Headline</option>
                        <option value="body">Body</option>
                        <option value="caption">Caption</option>
                        <option value="logo">Logo</option>
                      </select>
                    </div>
                    <div>
                      <label className="md-label-medium block mb-1">Position</label>
                      <select
                        value={textOverlay?.position || "center"}
                        onChange={(e) => setTextOverlay({ ...textOverlay, text: textOverlay?.text || "", style: textOverlay?.style || "headline", position: e.target.value as TextOverlay["position"] })}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-small"
                      >
                        <option value="top">Top</option>
                        <option value="center">Center</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reference Objects */}
            <div className="md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" style={{ color: "var(--md-sys-color-primary)" }} />
                  <span className="md-label-large">Reference Objects</span>
                </div>
                <span className="md-label-medium" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  {referenceObjects.length}/14
                </span>
              </div>

              {referenceObjects.length > 0 && (
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {referenceObjects.map((obj) => (
                    <div key={obj.id} className="relative aspect-square group">
                      <img
                        src={obj.dataUrl}
                        alt={obj.label}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeReferenceObject(obj.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--md-sys-color-error)] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {referenceObjects.length < 14 && (
                <div
                  {...getRefRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isRefDragActive
                      ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
                      : "border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]"
                  }`}
                >
                  <input {...getRefInputProps()} />
                  <p className="md-body-medium" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {isRefDragActive ? "Drop images here" : "Drag & drop or click to add reference images"}
                  </p>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-4 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] md-label-large flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Image
                </>
              )}
            </button>
          </div>

          {/* Right Column - Preview */}
          <div className="md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)] min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="md-label-large">Preview</span>
              {generatedImage && (
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] md-label-medium hover:opacity-90 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center bg-[var(--md-sys-color-surface-container-low)] rounded-lg overflow-hidden">
              {error ? (
                <div className="text-center p-4">
                  <p className="md-body-large" style={{ color: "var(--md-sys-color-error)" }}>
                    {error}
                  </p>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="max-w-full max-h-full object-contain"
                />
              ) : isGenerating ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: "var(--md-sys-color-primary)" }} />
                  <p className="md-body-large" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    Generating your image...
                  </p>
                </div>
              ) : (
                <p className="md-body-large" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  Your generated image will appear here
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NanoBananaPro;
