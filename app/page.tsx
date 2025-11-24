"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Clock } from "lucide-react";
import Composer from "@/components/ui/Composer";
import VideoPlayer from "@/components/ui/VideoPlayer";
import ModeSelector from "@/components/ui/ModeSelector";
import StoryboardComposer from "@/components/ui/StoryboardComposer";
import PhotoEditor from "@/components/ui/PhotoEditor";
import AIEditor from "@/components/ui/AIEditor";
import HomeCanvas from "@/components/ui/HomeCanvas";
import NanoBananaPro from "@/components/ui/NanoBananaPro/NanoBananaPro";
import ComicCreator from "@/components/ui/ComicCreator/ComicCreator";
import VoxelGenerator from "@/components/ui/VoxelGenerator/VoxelGenerator";
import { Scene, cleanupAllSceneUrls } from "@/lib/storyboard";
import type { Mode } from "@/lib/types";

type VeoOperationName = string | null;
type FrameMode = "start-only" | "end-only" | "interpolation";

const POLL_INTERVAL_MS = 5000;

const VeoStudio: React.FC = () => {
  // Mode management
  const [mode, setMode] = useState<Mode>("photo-editor");

  // Single video state
  const [prompt, setPrompt] = useState(""); // Video prompt
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [selectedModel, setSelectedModel] = useState(
    "veo-3.1-generate-preview"
  );

  // Storyboard state
  const [scenes, setScenes] = useState<Scene[]>([]);

  // Frame mode and frame state
  const [frameMode, setFrameMode] = useState<FrameMode>("start-only");
  const [startingFrameFile, setStartingFrameFile] = useState<File | null>(null);
  const [endingFrameFile, setEndingFrameFile] = useState<File | null>(null);
  const [generatedStartImage, setGeneratedStartImage] = useState<string | null>(null);
  const [generatedEndImage, setGeneratedEndImage] = useState<string | null>(null);

  // Image generation prompts
  const [startImagePrompt, setStartImagePrompt] = useState("");
  const [endImagePrompt, setEndImagePrompt] = useState("");

  const [imagenBusy, setImagenBusy] = useState(false);

  // Prompt enhancement
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  const [operationName, setOperationName] = useState<VeoOperationName>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoBlobRef = useRef<Blob | null>(null);
  const trimmedBlobRef = useRef<Blob | null>(null);
  const trimmedUrlRef = useRef<string | null>(null);
  const originalVideoUrlRef = useRef<string | null>(null);

  const [showImageTools, setShowImageTools] = useState(false);

  // Determine if we have the required frames based on frame mode
  const hasRequiredFrames = useMemo(() => {
    if (!showImageTools) return true; // No frames required if image tools hidden

    const hasStartFrame = startingFrameFile || generatedStartImage;
    const hasEndFrame = endingFrameFile || generatedEndImage;

    switch (frameMode) {
      case "start-only":
        return !!hasStartFrame;
      case "end-only":
        return !!hasEndFrame;
      case "interpolation":
        return !!hasStartFrame && !!hasEndFrame;
      default:
        return true;
    }
  }, [showImageTools, frameMode, startingFrameFile, generatedStartImage, endingFrameFile, generatedEndImage]);

  const canStart = useMemo(() => {
    if (!prompt.trim()) return false;
    if (showImageTools && !hasRequiredFrames) return false;
    return true;
  }, [prompt, showImageTools, hasRequiredFrames]);

  const resetAll = () => {
    // Reset single video state
    setPrompt("");
    setNegativePrompt("");
    setAspectRatio("16:9");
    setFrameMode("start-only");
    setStartingFrameFile(null);
    setEndingFrameFile(null);
    setGeneratedStartImage(null);
    setGeneratedEndImage(null);
    setStartImagePrompt("");
    setEndImagePrompt("");
    setOperationName(null);
    setIsGenerating(false);
    setVideoUrl(null);
    if (videoBlobRef.current) {
      URL.revokeObjectURL(URL.createObjectURL(videoBlobRef.current));
      videoBlobRef.current = null;
    }
    if (trimmedUrlRef.current) {
      URL.revokeObjectURL(trimmedUrlRef.current);
      trimmedUrlRef.current = null;
    }
    trimmedBlobRef.current = null;

    // Reset storyboard state
    cleanupAllSceneUrls(scenes);
    setScenes([]);
  };

  // Generate starting frame with Imagen
  const generateStartWithImagen = useCallback(async () => {
    if (!startImagePrompt.trim() || imagenBusy) return;
    setImagenBusy(true);
    setGeneratedStartImage(null);
    try {
      const resp = await fetch("/api/imagen/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: startImagePrompt }),
      });
      const json = await resp.json();
      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        setGeneratedStartImage(dataUrl);
        setStartingFrameFile(null); // Clear uploaded file if generating
      }
    } catch (e) {
      console.error(e);
    } finally {
      setImagenBusy(false);
    }
  }, [startImagePrompt, imagenBusy]);

  // Generate ending frame with Imagen
  const generateEndWithImagen = useCallback(async () => {
    if (!endImagePrompt.trim() || imagenBusy) return;
    setImagenBusy(true);
    setGeneratedEndImage(null);
    try {
      const resp = await fetch("/api/imagen/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: endImagePrompt }),
      });
      const json = await resp.json();
      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        setGeneratedEndImage(dataUrl);
        setEndingFrameFile(null); // Clear uploaded file if generating
      }
    } catch (e) {
      console.error(e);
    } finally {
      setImagenBusy(false);
    }
  }, [endImagePrompt, imagenBusy]);

  // Enhance prompt with AI
  const enhancePrompt = useCallback(async () => {
    if (!prompt.trim() || isEnhancingPrompt) return;
    setIsEnhancingPrompt(true);
    try {
      const hasStartFrame = startingFrameFile || generatedStartImage;
      const hasEndFrame = endingFrameFile || generatedEndImage;

      const context = {
        aspectRatio,
        model: selectedModel,
        hasStartingFrame: !!hasStartFrame,
        hasEndingFrame: !!hasEndFrame,
        frameMode: showImageTools ? frameMode : "none" as const,
      };

      const resp = await fetch("/api/veo/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context }),
      });
      const json = await resp.json();
      if (json?.enhancedPrompt) {
        setPrompt(json.enhancedPrompt);
      }
    } catch (e) {
      console.error("Error enhancing prompt:", e);
    } finally {
      setIsEnhancingPrompt(false);
    }
  }, [prompt, isEnhancingPrompt, aspectRatio, selectedModel, showImageTools, frameMode, startingFrameFile, generatedStartImage, endingFrameFile, generatedEndImage]);

  // Start Veo job
  const startGeneration = useCallback(async () => {
    if (!canStart) return;
    setIsGenerating(true);
    setVideoUrl(null);

    const form = new FormData();
    form.append("prompt", prompt);
    form.append("model", selectedModel);
    if (negativePrompt) form.append("negativePrompt", negativePrompt);
    if (aspectRatio) form.append("aspectRatio", aspectRatio);

    if (showImageTools) {
      form.append("frameMode", frameMode);

      // Handle starting frame
      const needsStartFrame = frameMode === "start-only" || frameMode === "interpolation";
      if (needsStartFrame) {
        if (startingFrameFile) {
          form.append("startingFrame", startingFrameFile);
        } else if (generatedStartImage) {
          const [meta, b64] = generatedStartImage.split(",");
          const mime = meta?.split(";")?.[0]?.replace("data:", "") || "image/png";
          form.append("startingFrameBase64", b64);
          form.append("startingFrameMimeType", mime);
        }
      }

      // Handle ending frame
      const needsEndFrame = frameMode === "end-only" || frameMode === "interpolation";
      if (needsEndFrame) {
        if (endingFrameFile) {
          form.append("endingFrame", endingFrameFile);
        } else if (generatedEndImage) {
          const [meta, b64] = generatedEndImage.split(",");
          const mime = meta?.split(";")?.[0]?.replace("data:", "") || "image/png";
          form.append("endingFrameBase64", b64);
          form.append("endingFrameMimeType", mime);
        }
      }
    }

    try {
      const resp = await fetch("/api/veo/generate", {
        method: "POST",
        body: form,
      });
      const json = await resp.json();
      setOperationName(json?.name || null);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  }, [
    canStart,
    prompt,
    selectedModel,
    negativePrompt,
    aspectRatio,
    showImageTools,
    frameMode,
    startingFrameFile,
    generatedStartImage,
    endingFrameFile,
    generatedEndImage,
  ]);

  // Enhance scene prompt with AI
  const enhanceScenePrompt = useCallback(async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.prompt.trim() || scene.isEnhancingPrompt) return;

    // Update scene state to enhancing
    setScenes(prev => prev.map(s =>
      s.id === sceneId ? { ...s, isEnhancingPrompt: true } : s
    ));

    try {
      const hasStartFrame = scene.firstFrameFile;
      const hasEndFrame = scene.lastFrameFile;

      const context = {
        aspectRatio: scene.aspectRatio,
        model: selectedModel,
        hasStartingFrame: !!hasStartFrame,
        hasEndingFrame: !!hasEndFrame,
        frameMode: scene.frameMode === "interpolation" ? "interpolation" :
                   scene.frameMode === "single" ? "start-only" : scene.frameMode,
      };

      const resp = await fetch("/api/veo/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: scene.prompt, context }),
      });
      const json = await resp.json();
      if (json?.enhancedPrompt) {
        setScenes(prev => prev.map(s =>
          s.id === sceneId ? { ...s, prompt: json.enhancedPrompt, isEnhancingPrompt: false } : s
        ));
      } else {
        setScenes(prev => prev.map(s =>
          s.id === sceneId ? { ...s, isEnhancingPrompt: false } : s
        ));
      }
    } catch (e) {
      console.error("Error enhancing scene prompt:", e);
      setScenes(prev => prev.map(s =>
        s.id === sceneId ? { ...s, isEnhancingPrompt: false } : s
      ));
    }
  }, [scenes, selectedModel, setScenes]);

  // Generate individual scene
  const generateScene = useCallback(async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !scene.prompt.trim() || scene.isGenerating) return;

    // Validate based on frame mode
    if (scene.frameMode === "single" && !scene.imageFile) return;
    if (scene.frameMode === "interpolation" && (!scene.firstFrameFile || !scene.lastFrameFile)) return;

    // Update scene state to generating
    setScenes(prev => prev.map(s =>
      s.id === sceneId ? { ...s, isGenerating: true, operationName: null } : s
    ));

    const form = new FormData();
    form.append("prompt", scene.prompt);
    form.append("model", selectedModel);
    form.append("aspectRatio", scene.aspectRatio);

    // Handle different frame modes
    if (scene.frameMode === "single" && scene.imageFile) {
      // Legacy single image mode
      form.append("imageFile", scene.imageFile);
    } else if (scene.frameMode === "interpolation") {
      // Dual frame mode
      form.append("frameMode", "interpolation");
      if (scene.firstFrameFile) {
        form.append("startingFrame", scene.firstFrameFile);
      }
      if (scene.lastFrameFile) {
        form.append("endingFrame", scene.lastFrameFile);
      }
    }

    try {
      const resp = await fetch("/api/veo/generate", {
        method: "POST",
        body: form,
      });
      const json = await resp.json();

      // Update scene with operation name
      setScenes(prev => prev.map(s =>
        s.id === sceneId ? { ...s, operationName: json?.name || null } : s
      ));
    } catch (e) {
      console.error(e);
      setScenes(prev => prev.map(s =>
        s.id === sceneId ? { ...s, isGenerating: false } : s
      ));
    }
  }, [scenes, selectedModel, setScenes]);

  // Poll operation until done then download
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      if (!operationName || videoUrl) return;
      try {
        const resp = await fetch("/api/veo/operation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: operationName }),
        });
        const fresh = await resp.json();
        if (fresh?.done) {
          // Check if video was filtered by safety
          if (fresh?.response?.raiMediaFilteredCount > 0) {
            const reason = fresh?.response?.raiMediaFilteredReasons?.[0] || "Content was filtered by safety policies.";
            console.error("[Veo] Video filtered:", reason);
            alert(`Video generation blocked: ${reason}`);
            setIsGenerating(false);
            setOperationName(null);
            return;
          }

          const fileUri = fresh?.response?.generatedVideos?.[0]?.video?.uri;
          if (fileUri) {
            const dl = await fetch("/api/veo/download", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uri: fileUri }),
            });
            const blob = await dl.blob();
            videoBlobRef.current = blob;
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
            originalVideoUrlRef.current = url;
          } else {
            // No video and no filter - unknown error
            console.error("[Veo] No video URI in response:", fresh);
            alert("Video generation completed but no video was returned.");
          }
          setIsGenerating(false);
          return;
        }
      } catch (e) {
        console.error(e);
        setIsGenerating(false);
      } finally {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }
    if (operationName && !videoUrl) {
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [operationName, videoUrl]);

  // Poll scenes operations
  useEffect(() => {
    const activeScenes = scenes.filter(s => s.operationName && s.isGenerating && !s.videoUrl);
    if (activeScenes.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    activeScenes.forEach(scene => {
      const pollScene = async () => {
        try {
          const resp = await fetch("/api/veo/operation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: scene.operationName }),
          });
          const fresh = await resp.json();

          if (fresh?.done) {
            const fileUri = fresh?.response?.generatedVideos?.[0]?.video?.uri;
            if (fileUri) {
              const dl = await fetch("/api/veo/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uri: fileUri }),
              });
              const blob = await dl.blob();
              const url = URL.createObjectURL(blob);

              // Update scene with video
              setScenes(prev => prev.map(s =>
                s.id === scene.id ? {
                  ...s,
                  isGenerating: false,
                  videoBlobRef: blob,
                  videoUrl: url,
                  originalVideoUrlRef: url
                } : s
              ));
            } else {
              // Mark as failed
              setScenes(prev => prev.map(s =>
                s.id === scene.id ? { ...s, isGenerating: false } : s
              ));
            }
          } else {
            // Continue polling
            const timer = setTimeout(pollScene, POLL_INTERVAL_MS);
            timers.push(timer);
          }
        } catch (e) {
          console.error(e);
          setScenes(prev => prev.map(s =>
            s.id === scene.id ? { ...s, isGenerating: false } : s
          ));
        }
      };

      const timer = setTimeout(pollScene, POLL_INTERVAL_MS);
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [scenes]);

  const onPickStartingFrame = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setStartingFrameFile(f);
      setGeneratedStartImage(null);
    }
  };

  const onPickEndingFrame = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setEndingFrameFile(f);
      setGeneratedEndImage(null);
    }
  };

  const handleTrimmedOutput = (blob: Blob) => {
    trimmedBlobRef.current = blob; // likely webm
    if (trimmedUrlRef.current) {
      URL.revokeObjectURL(trimmedUrlRef.current);
    }
    trimmedUrlRef.current = URL.createObjectURL(blob);
    setVideoUrl(trimmedUrlRef.current);
  };

  const handleResetTrimState = () => {
    if (trimmedUrlRef.current) {
      URL.revokeObjectURL(trimmedUrlRef.current);
      trimmedUrlRef.current = null;
    }
    trimmedBlobRef.current = null;
    if (originalVideoUrlRef.current) {
      setVideoUrl(originalVideoUrlRef.current);
    }
  };

  const downloadVideo = async () => {
    const blob = trimmedBlobRef.current || videoBlobRef.current;
    if (!blob) return;
    const isTrimmed = !!trimmedBlobRef.current;
    const filename = isTrimmed ? "veo3_video_trimmed.webm" : "veo3_video.mp4";
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

  return (
    <div className="relative min-h-screen w-full md-surface">
      <div className="fixed top-6 left-6 z-20 hidden md:block">
        <h1 className="md-headline-medium md-surface-container-high px-4 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] md-elevation-2">
          Story Composer
        </h1>
      </div>
      <div className="fixed top-6 right-6 z-20 hidden md:block">
        <ModeSelector mode={mode} setMode={setMode} />
      </div>
      {/* Content Area */}
      {mode === "photo-editor" ? (
        <div className="min-h-screen pt-20">
          <PhotoEditor />
        </div>
      ) : mode === "ai-editor" ? (
        <div className="min-h-screen pt-20">
          <AIEditor />
        </div>
      ) : mode === "home-canvas" ? (
        <div className="min-h-screen pt-20">
          <HomeCanvas />
        </div>
      ) : mode === "nano-banana" ? (
        <div className="min-h-screen pt-20">
          <NanoBananaPro />
        </div>
      ) : mode === "comic-creator" ? (
        <div className="min-h-screen pt-20">
          <ComicCreator />
        </div>
      ) : mode === "voxel-generator" ? (
        <div className="min-h-screen pt-20">
          <VoxelGenerator />
        </div>
      ) : mode === "single" ? (
        <div className="flex items-center justify-center min-h-screen pb-40 px-4">
          {!videoUrl &&
            (isGenerating ? (
              <div className="select-none inline-flex items-center gap-3 md-body-large" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                <Clock className="w-5 h-5 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                Generating Video...
              </div>
            ) : (
              <div className="select-none md-body-large" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Nothing to see here yet.
              </div>
            ))}
          {videoUrl && (
            <div className="w-full max-w-3xl">
              <VideoPlayer
                src={videoUrl}
                onOutputChanged={handleTrimmedOutput}
                onDownload={downloadVideo}
                onResetTrim={handleResetTrimState}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-screen pt-20 pb-6">
          <div className="w-full h-full flex flex-col">
            {/* Top Section - Storyboard Controls (Integrated) */}
            <div className="px-6 pb-6">
              <StoryboardComposer
                scenes={scenes}
                setScenes={setScenes}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                onGenerateScene={generateScene}
                onEnhancePrompt={enhanceScenePrompt}
              />
            </div>

            {/* Bottom Section - Storyboard Grid (100% width) */}
            <div className="flex-1 px-6">
              {scenes.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="select-none md-body-large text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Create your first scene to get started with your storyboard.
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
                    {scenes.map((scene, index) => (
                      <div key={scene.id} className="aspect-video">
                        {scene.videoUrl ? (
                          <div className="relative h-full">
                            <video
                              src={scene.videoUrl}
                              className="w-full h-full object-cover rounded-xl"
                              controls
                              loop
                              muted
                            />
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                              Scene {index + 1}
                            </div>
                          </div>
                        ) : scene.isGenerating ? (
                          <div className="h-full flex items-center justify-center bg-[var(--md-sys-color-surface-container)] rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                            <div className="text-center">
                              <Clock className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--md-sys-color-primary)' }} />
                              <div className="md-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                Scene {index + 1} Generating...
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center bg-[var(--md-sys-color-surface-variant)] rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                            <div className="text-center" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              <div className="md-body-medium">Scene {index + 1}</div>
                              <div className="md-body-small">Ready to generate</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === "single" && (
        <Composer
          prompt={prompt}
          setPrompt={setPrompt}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          canStart={canStart}
          isGenerating={isGenerating}
          startGeneration={startGeneration}
          showImageTools={showImageTools}
          setShowImageTools={setShowImageTools}
          frameMode={frameMode}
          setFrameMode={setFrameMode}
          startingFrameFile={startingFrameFile}
          generatedStartImage={generatedStartImage}
          onPickStartingFrame={onPickStartingFrame}
          endingFrameFile={endingFrameFile}
          generatedEndImage={generatedEndImage}
          onPickEndingFrame={onPickEndingFrame}
          startImagePrompt={startImagePrompt}
          setStartImagePrompt={setStartImagePrompt}
          endImagePrompt={endImagePrompt}
          setEndImagePrompt={setEndImagePrompt}
          imagenBusy={imagenBusy}
          generateStartWithImagen={generateStartWithImagen}
          generateEndWithImagen={generateEndWithImagen}
          isEnhancingPrompt={isEnhancingPrompt}
          enhancePrompt={enhancePrompt}
          resetAll={resetAll}
        />
      )}
    </div>
  );
};

export default VeoStudio;
