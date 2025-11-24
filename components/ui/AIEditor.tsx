"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { type Crop, type PixelCrop } from "react-image-crop";
import AIEditorCanvas from "./AIEditorCanvas";
import AIEditorTabs from "./AIEditorTabs";
import AIEditorHistory from "./AIEditorHistory";
import RetouchPanel from "./RetouchPanel";
import FilterPanel from "./FilterPanel";
import AdjustmentPanel from "./AdjustmentPanel";
import CropPanel from "./CropPanel";
import { Clock } from "lucide-react";

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  if (arr.length < 2) throw new Error("Invalid data URL");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

type Tab = 'retouch' | 'adjust' | 'filters' | 'crop';

const AIEditor: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);

  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);

  // Effect to reset crop when aspect ratio changes
  useEffect(() => {
    if (activeTab === 'crop') {
      // Small delay to ensure aspect ratio is applied
      const timeout = setTimeout(() => {
        setCrop(undefined);
        setCompletedCrop(undefined);
      }, 50);
      
      return () => clearTimeout(timeout);
    }
  }, [aspect, activeTab]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [history, historyIndex]);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to edit.');
      return;
    }
    
    if (!prompt.trim()) {
        setError('Please enter a description for your edit.');
        return;
    }

    if (!editHotspot) {
        setError('Please click on the image to select an area to edit.');
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("editType", "retouch");
        formData.append("imageFile", currentImage);
        formData.append("hotspotX", editHotspot.x.toString());
        formData.append("hotspotY", editHotspot.y.toString());

        const response = await fetch("/api/ai-editor/edit", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to generate image");
        }

        const editedImageUrl = `data:${result.image.mimeType};base64,${result.image.imageBytes}`;
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setEditHotspot(null);
        setDisplayHotspot(null);
        setPrompt('');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory]);

  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply a filter to.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const formData = new FormData();
        formData.append("prompt", filterPrompt);
        formData.append("editType", "filter");
        formData.append("imageFile", currentImage);

        const response = await fetch("/api/ai-editor/edit", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to apply filter");
        }

        const filteredImageUrl = `data:${result.image.mimeType};base64,${result.image.imageBytes}`;
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the filter. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply an adjustment to.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const formData = new FormData();
        formData.append("prompt", adjustmentPrompt);
        formData.append("editType", "adjustment");
        formData.append("imageFile", currentImage);

        const response = await fetch("/api/ai-editor/edit", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to apply adjustment");
        }

        const adjustedImageUrl = `data:${result.image.mimeType};base64,${result.image.imageBytes}`;
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the adjustment. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
        setError('Please select an area to crop.');
        return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        setError('Could not process the crop.');
        return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );
    
    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);

  }, [completedCrop, addImageToHistory]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('retouch');
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canUndo, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
    setError(null);
    setPrompt('');
    setEditHotspot(null);
    setDisplayHotspot(null);
  }, []);

  const handleDownload = useCallback(() => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(currentImage);
      link.download = `edited-${currentImage.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  }, [currentImage]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab !== 'retouch') return;

    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDisplayHotspot({ x: offsetX, y: offsetY });

    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);

    setEditHotspot({ x: originalX, y: originalY });
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center animate-fade-in bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-outline-variant)] p-8 rounded-xl max-w-2xl mx-auto flex flex-col items-center gap-4">
          <h2 className="md-title-large" style={{ color: 'var(--md-sys-color-on-error-container)' }}>
            An Error Occurred
          </h2>
          <p className="md-body-medium" style={{ color: 'var(--md-sys-color-on-error-container)' }}>
            {error}
          </p>
          <button
            onClick={() => setError(null)}
            className="bg-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] md-label-large px-6 py-3 rounded-xl md-interactive"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!currentImageUrl) {
      return (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
          <div className="md-body-large mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            AI Photo Editor
          </div>
          <div className="md-body-medium mb-6" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Upload an image to start editing with AI
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center justify-center px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] md-label-large rounded-xl cursor-pointer md-interactive"
          >
            Choose Image
          </label>
        </div>
      );
    }

    return (
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6">
        <AIEditorCanvas
          currentImageUrl={currentImageUrl}
          originalImageUrl={originalImageUrl}
          activeTab={activeTab}
          isLoading={isLoading}
          isComparing={isComparing}
          displayHotspot={displayHotspot}
          onImageClick={handleImageClick}
          imgRef={imgRef}
          crop={crop}
          setCrop={setCrop}
          setCompletedCrop={setCompletedCrop}
          aspect={aspect}
        />

        <AIEditorTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="w-full">
          {activeTab === 'retouch' && (
            <RetouchPanel
              prompt={prompt}
              setPrompt={setPrompt}
              editHotspot={editHotspot}
              isLoading={isLoading}
              onGenerate={handleGenerate}
            />
          )}
          {activeTab === 'crop' && (
            <CropPanel
              onApplyCrop={handleApplyCrop}
              onSetAspect={setAspect}
              isLoading={isLoading}
              isCropping={!!completedCrop?.width && completedCrop.width > 0}
              currentAspect={aspect}
            />
          )}
          {activeTab === 'adjust' && (
            <AdjustmentPanel
              onApplyAdjustment={handleApplyAdjustment}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'filters' && (
            <FilterPanel
              onApplyFilter={handleApplyFilter}
              isLoading={isLoading}
            />
          )}
        </div>

        <AIEditorHistory
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onReset={handleReset}
          onUploadNew={handleUploadNew}
          onDownload={handleDownload}
          onCompareStart={() => setIsComparing(true)}
          onCompareEnd={() => setIsComparing(false)}
        />
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full md-surface">
      <div className="flex items-center justify-center min-h-screen pb-40 px-4">
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center gap-4">
            <Clock className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
            <p className="md-body-large" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              AI is working its magic...
            </p>
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default AIEditor;