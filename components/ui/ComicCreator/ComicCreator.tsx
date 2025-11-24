"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { BookOpen, Plus, X, Users, Play, Loader2, Trash2, MapPin, ChevronLeft, ChevronRight, FileText, Sparkles, Maximize2, Download } from "lucide-react";
import type { ComicStyle, ComicCharacter, ComicPanel, ComicProject, ComicPage } from "@/lib/types";
import { COMIC_STYLES, PAGE_LAYOUTS } from "@/lib/types";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const ComicCreator: React.FC = () => {
  // Project state
  const [project, setProject] = useState<ComicProject>({
    id: generateId(),
    title: "Untitled Comic",
    style: "webcomic",
    characters: [],
    pages: [],
  });

  // UI state
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<ComicCharacter | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<{ url: string; panelIndex: number; pageIndex: number } | null>(null);

  // Computed values
  const currentPage = project.pages[currentPageIndex] || null;
  const totalPanels = project.pages.reduce((sum, page) => sum + page.panels.length, 0);

  // Character management
  const addCharacter = () => {
    if (project.characters.length >= 15) return;
    const newChar: ComicCharacter = {
      id: generateId(),
      name: "",
      referenceImages: [],
      description: "",
    };
    setEditingCharacter(newChar);
    setShowCharacterModal(true);
  };

  const saveCharacter = () => {
    if (!editingCharacter) return;

    setProject((prev) => {
      const existingIndex = prev.characters.findIndex((c) => c.id === editingCharacter.id);
      if (existingIndex >= 0) {
        const newChars = [...prev.characters];
        newChars[existingIndex] = editingCharacter;
        return { ...prev, characters: newChars };
      }
      return { ...prev, characters: [...prev.characters, editingCharacter] };
    });
    setShowCharacterModal(false);
    setEditingCharacter(null);
  };

  const deleteCharacter = (id: string) => {
    setProject((prev) => ({
      ...prev,
      characters: prev.characters.filter((c) => c.id !== id),
      pages: prev.pages.map((page) => ({
        ...page,
        panels: page.panels.map((p) => ({
          ...p,
          characters: p.characters.filter((cId) => cId !== id),
        })),
      })),
    }));
  };

  // Page management
  const addPage = (layout: ComicPage["layout"] = "grid-2x2") => {
    const layoutInfo = PAGE_LAYOUTS.find((l) => l.value === layout);
    const panelCount = layoutInfo?.panelCount || 4;

    const newPanels: ComicPanel[] = Array.from({ length: panelCount }, (_, i) => ({
      id: generateId(),
      position: i,
      prompt: "",
      characters: [],
      dialogue: [],
    }));

    const newPage: ComicPage = {
      id: generateId(),
      pageNumber: project.pages.length + 1,
      panels: newPanels,
      layout,
    };

    setProject((prev) => ({ ...prev, pages: [...prev.pages, newPage] }));
    setCurrentPageIndex(project.pages.length);
    setSelectedPanel(null);
  };

  const updatePageLayout = (pageId: string, layout: ComicPage["layout"]) => {
    setProject((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => {
        if (page.id !== pageId) return page;

        const layoutInfo = PAGE_LAYOUTS.find((l) => l.value === layout);
        const targetPanelCount = layoutInfo?.panelCount || page.panels.length;

        let newPanels = [...page.panels];
        if (layout !== "custom") {
          // Adjust panel count to match layout
          if (newPanels.length < targetPanelCount) {
            // Add panels
            const toAdd = targetPanelCount - newPanels.length;
            for (let i = 0; i < toAdd; i++) {
              newPanels.push({
                id: generateId(),
                position: newPanels.length,
                prompt: "",
                characters: [],
                dialogue: [],
              });
            }
          } else if (newPanels.length > targetPanelCount) {
            // Remove empty panels from the end
            newPanels = newPanels.slice(0, targetPanelCount);
          }
        }

        return { ...page, layout, panels: newPanels };
      }),
    }));
  };

  const deletePage = (pageId: string) => {
    setProject((prev) => ({
      ...prev,
      pages: prev.pages
        .filter((p) => p.id !== pageId)
        .map((p, i) => ({ ...p, pageNumber: i + 1 })),
    }));

    // Adjust current page index
    if (currentPageIndex >= project.pages.length - 1) {
      setCurrentPageIndex(Math.max(0, project.pages.length - 2));
    }
    setSelectedPanel(null);
  };

  // Panel management (within current page)
  const addPanel = () => {
    if (!currentPage) return;

    const newPanel: ComicPanel = {
      id: generateId(),
      position: currentPage.panels.length,
      prompt: "",
      characters: [],
      dialogue: [],
    };

    setProject((prev) => ({
      ...prev,
      pages: prev.pages.map((page) =>
        page.id === currentPage.id
          ? { ...page, panels: [...page.panels, newPanel] }
          : page
      ),
    }));
    setSelectedPanel(newPanel.id);
  };

  const updatePanel = (id: string, updates: Partial<ComicPanel>) => {
    setProject((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => ({
        ...page,
        panels: page.panels.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
    }));
  };

  const deletePanel = (id: string) => {
    if (!currentPage) return;

    setProject((prev) => ({
      ...prev,
      pages: prev.pages.map((page) =>
        page.id === currentPage.id
          ? {
              ...page,
              panels: page.panels
                .filter((p) => p.id !== id)
                .map((p, i) => ({ ...p, position: i })),
            }
          : page
      ),
    }));
    if (selectedPanel === id) setSelectedPanel(null);
  };

  // Helper to convert dataURL to File
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Helper to get all panels flattened across pages with their global index
  const getAllPanelsWithIndex = (): Array<{ panel: ComicPanel; globalIndex: number; pageIndex: number }> => {
    const result: Array<{ panel: ComicPanel; globalIndex: number; pageIndex: number }> = [];
    let globalIndex = 0;
    project.pages.forEach((page, pageIndex) => {
      page.panels.forEach((panel) => {
        result.push({ panel, globalIndex, pageIndex });
        globalIndex++;
      });
    });
    return result;
  };

  // Generate panel
  const generatePanel = async (panelId: string) => {
    // Find panel across all pages
    let panel: ComicPanel | undefined;
    let panelPageIndex = -1;
    for (let i = 0; i < project.pages.length; i++) {
      const found = project.pages[i].panels.find((p) => p.id === panelId);
      if (found) {
        panel = found;
        panelPageIndex = i;
        break;
      }
    }

    if (!panel || !panel.prompt.trim()) return;

    setIsGenerating(panelId);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("prompt", panel.prompt);
      formData.append("style", project.style);
      formData.append("panelId", panelId);

      // Add character references (include id for matching with reference images)
      const panelCharacters = project.characters.filter((c) =>
        panel.characters.includes(c.id)
      );
      formData.append("characters", JSON.stringify(panelCharacters.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
      }))));

      // Add dialogue
      if (panel.dialogue && panel.dialogue.length > 0) {
        formData.append("dialogue", JSON.stringify(panel.dialogue));
      }

      // Add character reference images
      panelCharacters.forEach((char) => {
        char.referenceImages.forEach((img, index) => {
          formData.append(`characterImage_${char.id}_${index}`, img.file);
        });
      });

      // Collect previous panels from all pages for style continuity
      const allPanels = getAllPanelsWithIndex();
      const currentGlobalIndex = allPanels.findIndex((p) => p.panel.id === panelId);

      // Get up to 3 most recent panels with images (prioritize same page, then previous pages)
      const previousPanelsWithImages = allPanels
        .slice(0, currentGlobalIndex)
        .filter((p) => p.panel.imageUrl)
        .slice(-3);

      previousPanelsWithImages.forEach((prevPanelInfo) => {
        if (prevPanelInfo.panel.imageUrl) {
          const file = dataURLtoFile(prevPanelInfo.panel.imageUrl, `panel_${prevPanelInfo.globalIndex}.png`);
          formData.append(`previousPanel_${prevPanelInfo.globalIndex}`, file);
        }
      });

      // Add page context info for the API
      formData.append("currentPage", String(panelPageIndex + 1));
      formData.append("totalPages", String(project.pages.length));

      // Add scenic continuity with specific panel reference
      if (panel.scenicContinuity && panel.scenicReference) {
        formData.append("scenicContinuity", "true");
        // Find the referenced panel and include its image
        const refPage = project.pages[panel.scenicReference.pageIndex];
        const refPanel = refPage?.panels.find((p) => p.id === panel.scenicReference?.panelId);
        if (refPanel?.imageUrl) {
          const file = dataURLtoFile(refPanel.imageUrl, `scenic_reference.png`);
          formData.append("scenicReferenceImage", file);
          formData.append("scenicReferenceInfo", JSON.stringify({
            pageNumber: panel.scenicReference.pageIndex + 1,
            panelPosition: refPage.panels.findIndex((p) => p.id === refPanel.id) + 1
          }));
        }
      }

      const response = await fetch("/api/comic/generate-panel", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      if (json.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        updatePanel(panelId, { imageUrl: dataUrl });
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(null);
    }
  };

  // Generate all panels on current page
  const generatePagePanels = async () => {
    if (!currentPage) return;
    for (const panel of currentPage.panels) {
      if (!panel.imageUrl && panel.prompt.trim()) {
        await generatePanel(panel.id);
      }
    }
  };

  // Generate all panels across all pages
  const generateAllPanels = async () => {
    for (const page of project.pages) {
      for (const panel of page.panels) {
        if (!panel.imageUrl && panel.prompt.trim()) {
          await generatePanel(panel.id);
        }
      }
    }
  };

  // Download current page as combined image
  const downloadPage = async () => {
    if (!currentPage) return;

    const panelsWithImages = currentPage.panels.filter((p) => p.imageUrl);
    if (panelsWithImages.length === 0) return;

    // Determine grid dimensions based on layout
    let cols = 2;
    let rows = 2;
    switch (currentPage.layout) {
      case "single":
        cols = 1;
        rows = 1;
        break;
      case "strip-horizontal":
        cols = 3;
        rows = 1;
        break;
      case "strip-vertical":
        cols = 1;
        rows = 3;
        break;
      case "grid-2x2":
        cols = 2;
        rows = 2;
        break;
      case "grid-3x3":
        cols = 3;
        rows = 3;
        break;
      default:
        cols = Math.ceil(Math.sqrt(currentPage.panels.length));
        rows = Math.ceil(currentPage.panels.length / cols);
    }

    const panelSize = 512; // Each panel is 512x512
    const gap = 8;
    const padding = 16;
    const canvasWidth = cols * panelSize + (cols - 1) * gap + padding * 2;
    const canvasHeight = rows * panelSize + (rows - 1) * gap + padding * 2;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Load and draw each panel
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      for (let i = 0; i < currentPage.panels.length; i++) {
        const panel = currentPage.panels[i];
        if (!panel.imageUrl) continue;

        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = padding + col * (panelSize + gap);
        const y = padding + row * (panelSize + gap);

        const img = await loadImage(panel.imageUrl);
        ctx.drawImage(img, x, y, panelSize, panelSize);
      }

      // Download
      const link = document.createElement("a");
      link.download = `${project.title.replace(/[^a-z0-9]/gi, "_")}_page${currentPageIndex + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error creating page image:", err);
      setError("Failed to download page");
    }
  };

  // Enhance prompt with AI
  const enhancePrompt = async (panelId: string) => {
    // Find panel across all pages
    let panel: ComicPanel | undefined;
    let panelPageIndex = -1;
    let panelPosition = -1;
    for (let i = 0; i < project.pages.length; i++) {
      const idx = project.pages[i].panels.findIndex((p) => p.id === panelId);
      if (idx !== -1) {
        panel = project.pages[i].panels[idx];
        panelPageIndex = i;
        panelPosition = idx;
        break;
      }
    }

    if (!panel || !panel.prompt.trim()) return;

    setIsEnhancing(true);
    setError(null);

    try {
      // Build story context for the enhancer
      const allPreviousPanels: Array<{ position: number; prompt: string; hasImage: boolean }> = [];
      let globalPosition = 0;
      for (let pageIdx = 0; pageIdx <= panelPageIndex; pageIdx++) {
        const pagePanels = project.pages[pageIdx].panels;
        for (let pIdx = 0; pIdx < pagePanels.length; pIdx++) {
          if (pageIdx === panelPageIndex && pIdx >= panelPosition) break;
          allPreviousPanels.push({
            position: globalPosition,
            prompt: pagePanels[pIdx].prompt,
            hasImage: !!pagePanels[pIdx].imageUrl,
          });
          globalPosition++;
        }
      }

      // Get scenic reference context if set
      let scenicReferenceContext = undefined;
      if (panel.scenicContinuity && panel.scenicReference) {
        const refPage = project.pages[panel.scenicReference.pageIndex];
        const refPanel = refPage?.panels.find((p) => p.id === panel.scenicReference?.panelId);
        if (refPanel) {
          scenicReferenceContext = {
            pageNumber: panel.scenicReference.pageIndex + 1,
            panelPosition: refPage.panels.findIndex((p) => p.id === refPanel.id) + 1,
            prompt: refPanel.prompt,
          };
        }
      }

      // Get character names in this panel
      const panelCharacterNames = project.characters
        .filter((c) => panel.characters.includes(c.id))
        .map((c) => c.name);

      const storyContext = {
        projectTitle: project.title,
        style: COMIC_STYLES.find((s) => s.value === project.style)?.label || project.style,
        characters: project.characters.map((c) => ({
          name: c.name,
          description: c.description,
        })),
        panelCharacters: panelCharacterNames,
        previousPanels: allPreviousPanels.slice(-5), // Last 5 panels for context
        currentPanelPosition: globalPosition,
        scenicReference: scenicReferenceContext,
      };

      const response = await fetch("/api/comic/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: panel.prompt,
          storyContext,
        }),
      });

      const json = await response.json();
      console.log("Enhance response:", json);

      if (json.error) {
        throw new Error(json.error);
      }

      if (!json.enhancedPrompt) {
        throw new Error("No enhanced prompt returned");
      }

      // Update the panel with the enhanced prompt
      updatePanel(panelId, { prompt: json.enhancedPrompt });
    } catch (err) {
      console.error("Enhancement error:", err);
      setError(err instanceof Error ? err.message : "Enhancement failed");
    } finally {
      setIsEnhancing(false);
    }
  };

  const selectedPanelData = currentPage?.panels.find((p) => p.id === selectedPanel);

  return (
    <div className="min-h-screen px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="md-headline-small flex items-center gap-2">
              <BookOpen className="w-6 h-6" style={{ color: "var(--md-sys-color-primary)" }} />
              Comic Creator
            </h2>
            <p className="md-body-medium mt-1" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              {project.pages.length} {project.pages.length === 1 ? "page" : "pages"} · {totalPanels} {totalPanels === 1 ? "panel" : "panels"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addCharacter}
              disabled={project.characters.length >= 15}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              Add Character
            </button>
            <button
              onClick={() => addPage("grid-2x2")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:opacity-90"
            >
              <FileText className="w-4 h-4" />
              Add Page
            </button>
            <button
              onClick={generateAllPanels}
              disabled={!!isGenerating || totalPanels === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Generate All
            </button>
          </div>
        </div>

        {/* Project Settings */}
        <div className="mb-6 md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="md-label-medium block mb-1">Project Title</label>
              <input
                type="text"
                value={project.title}
                onChange={(e) => setProject({ ...project, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium"
              />
            </div>
            <div>
              <label className="md-label-medium block mb-1">Art Style</label>
              <select
                value={project.style}
                onChange={(e) => setProject({ ...project, style: e.target.value as ComicStyle })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium"
              >
                {COMIC_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label} - {style.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Characters Bar */}
        {project.characters.length > 0 && (
          <div className="mb-6 md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)]">
            <label className="md-label-large block mb-3">Characters ({project.characters.length}/15)</label>
            <div className="flex gap-3 flex-wrap">
              {project.characters.map((char) => (
                <div
                  key={char.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface-container-high)]"
                >
                  {char.referenceImages[0] && (
                    <img
                      src={char.referenceImages[0].dataUrl}
                      alt={char.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <span className="md-label-medium">{char.name || "Unnamed"}</span>
                  <button
                    onClick={() => deleteCharacter(char.id)}
                    className="p-1 rounded hover:bg-[var(--md-sys-color-error-container)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Page and Panel Grid */}
          <div className="lg:col-span-2 space-y-4">
            {/* Page Navigation */}
            {project.pages.length > 0 && (
              <div className="md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                      disabled={currentPageIndex === 0}
                      className="p-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="md-title-medium">
                      Page {currentPageIndex + 1} of {project.pages.length}
                    </span>
                    <button
                      onClick={() => setCurrentPageIndex(Math.min(project.pages.length - 1, currentPageIndex + 1))}
                      disabled={currentPageIndex === project.pages.length - 1}
                      className="p-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)] disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={currentPage?.layout || "grid-2x2"}
                      onChange={(e) => currentPage && updatePageLayout(currentPage.id, e.target.value as ComicPage["layout"])}
                      className="px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-label-small"
                    >
                      {PAGE_LAYOUTS.map((layout) => (
                        <option key={layout.value} value={layout.value}>
                          {layout.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={generatePagePanels}
                      disabled={!!isGenerating || !currentPage?.panels.some((p) => p.prompt.trim())}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] md-label-small disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      Generate Page
                    </button>
                    <button
                      onClick={downloadPage}
                      disabled={!currentPage?.panels.some((p) => p.imageUrl)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] md-label-small disabled:opacity-50"
                      title="Download page as image"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => currentPage && deletePage(currentPage.id)}
                      disabled={project.pages.length <= 1}
                      className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-error-container)] disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Page thumbnails */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {project.pages.map((page, index) => (
                    <button
                      key={page.id}
                      onClick={() => setCurrentPageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all flex items-center justify-center ${
                        index === currentPageIndex
                          ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
                          : "border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-outline)]"
                      }`}
                    >
                      <span className="md-label-medium">{index + 1}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => addPage("grid-2x2")}
                    className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" style={{ color: "var(--md-sys-color-on-surface-variant)" }} />
                  </button>
                </div>
              </div>
            )}

            {/* Panel Grid */}
            <div className="md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center justify-between mb-4">
                <label className="md-label-large">
                  {currentPage ? `Panels (${currentPage.panels.length})` : "Panels"}
                </label>
                {currentPage?.layout === "custom" && (
                  <button
                    onClick={addPanel}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] md-label-small"
                  >
                    <Plus className="w-4 h-4" />
                    Add Panel
                  </button>
                )}
              </div>

              {!currentPage ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <p className="md-body-large" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    Add your first page to get started
                  </p>
                  <button
                    onClick={() => addPage("grid-2x2")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                  >
                    <FileText className="w-4 h-4" />
                    Add First Page
                  </button>
                </div>
              ) : currentPage.panels.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="md-body-large" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    No panels on this page
                  </p>
                </div>
              ) : (
                <div className={`grid gap-4 ${
                  currentPage.layout === "strip-horizontal" ? "grid-cols-3" :
                  currentPage.layout === "strip-vertical" ? "grid-cols-1 max-w-sm mx-auto" :
                  currentPage.layout === "single" ? "grid-cols-1 max-w-md mx-auto" :
                  currentPage.layout === "grid-3x3" ? "grid-cols-3" :
                  "grid-cols-2"
                }`}>
                  {currentPage.panels.map((panel, index) => (
                    <div
                      key={panel.id}
                      onClick={() => setSelectedPanel(panel.id)}
                      className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedPanel === panel.id
                          ? "border-[var(--md-sys-color-primary)]"
                          : "border-transparent hover:border-[var(--md-sys-color-outline)]"
                      }`}
                    >
                      {panel.imageUrl ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={panel.imageUrl}
                            alt={`Panel ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingImage({ url: panel.imageUrl!, panelIndex: index, pageIndex: currentPageIndex });
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                            title="View full image"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : isGenerating === panel.id ? (
                        <div className="w-full h-full flex items-center justify-center bg-[var(--md-sys-color-surface-container-low)]">
                          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--md-sys-color-primary)" }} />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[var(--md-sys-color-surface-container-low)]">
                          <span className="md-body-medium" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                            Panel {index + 1}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel Editor */}
          <div className="md-surface-container rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)]">
            {selectedPanelData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="md-label-large">
                    Page {currentPageIndex + 1}, Panel {(currentPage?.panels.findIndex((p) => p.id === selectedPanel) ?? 0) + 1}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generatePanel(selectedPanelData.id)}
                      disabled={!!isGenerating || !selectedPanelData.prompt.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] md-label-small disabled:opacity-50"
                    >
                      {isGenerating === selectedPanelData.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Generate
                    </button>
                    <button
                      onClick={() => deletePanel(selectedPanelData.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--md-sys-color-error-container)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="md-label-medium">Scene Description</label>
                    <button
                      onClick={() => enhancePrompt(selectedPanelData.id)}
                      disabled={isEnhancing || !selectedPanelData.prompt.trim()}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] hover:opacity-90 disabled:opacity-50 md-label-small"
                      title="Enhance prompt with AI"
                    >
                      {isEnhancing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Enhance
                    </button>
                  </div>
                  <textarea
                    value={selectedPanelData.prompt}
                    onChange={(e) => updatePanel(selectedPanelData.id, { prompt: e.target.value })}
                    placeholder="Describe what happens in this panel..."
                    className="w-full h-24 px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium resize-none"
                  />
                </div>

                <div>
                  <label className="md-label-medium block mb-2">
                    Characters in Panel ({selectedPanelData.characters.length}/5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {project.characters.map((char) => {
                      const isSelected = selectedPanelData.characters.includes(char.id);
                      const atLimit = selectedPanelData.characters.length >= 5 && !isSelected;
                      return (
                        <button
                          key={char.id}
                          onClick={() => {
                            if (atLimit) return;
                            const newChars = isSelected
                              ? selectedPanelData.characters.filter((id) => id !== char.id)
                              : [...selectedPanelData.characters, char.id];
                            updatePanel(selectedPanelData.id, { characters: newChars });
                          }}
                          disabled={atLimit}
                          className={`px-3 py-1.5 rounded-lg md-label-small transition-colors ${
                            isSelected
                              ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                              : atLimit
                              ? "bg-[var(--md-sys-color-surface-container)] opacity-40 cursor-not-allowed"
                              : "bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
                          }`}
                        >
                          {char.name || "Unnamed"}
                        </button>
                      );
                    })}
                    {project.characters.length === 0 && (
                      <p className="md-body-small" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                        Add characters above
                      </p>
                    )}
                  </div>
                </div>

                {/* Scenic Continuity */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" style={{ color: "var(--md-sys-color-tertiary)" }} />
                    <label className="md-label-medium">Scenic Continuity</label>
                  </div>
                  <select
                    value={
                      selectedPanelData.scenicReference
                        ? `${selectedPanelData.scenicReference.pageIndex}::${selectedPanelData.scenicReference.panelId}`
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value === "") {
                        updatePanel(selectedPanelData.id, { scenicContinuity: false, scenicReference: null });
                      } else {
                        const [pageIdx, panelId] = e.target.value.split("::");
                        updatePanel(selectedPanelData.id, {
                          scenicContinuity: true,
                          scenicReference: { pageIndex: parseInt(pageIdx, 10), panelId }
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium"
                  >
                    <option value="">No scene reference</option>
                    {project.pages.map((page, pageIdx) => (
                      <optgroup key={page.id} label={`Page ${pageIdx + 1}`}>
                        {page.panels
                          .filter((p) => p.imageUrl && p.id !== selectedPanelData.id)
                          .map((p) => {
                            const actualPanelIdx = page.panels.findIndex((panel) => panel.id === p.id);
                            return (
                              <option key={p.id} value={`${pageIdx}::${p.id}`}>
                                Page {pageIdx + 1}, Panel {actualPanelIdx + 1}
                              </option>
                            );
                          })}
                      </optgroup>
                    ))}
                  </select>
                  <p className="md-body-small mt-1" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    Match the scene/background from a specific panel
                  </p>
                </div>

                {error && (
                  <p className="md-body-small" style={{ color: "var(--md-sys-color-error)" }}>
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="md-body-medium" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  Select a panel to edit
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character Modal */}
      {showCharacterModal && editingCharacter && (
        <CharacterModal
          character={editingCharacter}
          onChange={setEditingCharacter}
          onSave={saveCharacter}
          onClose={() => {
            setShowCharacterModal(false);
            setEditingCharacter(null);
          }}
        />
      )}

      {/* Image View Modal */}
      {viewingImage && (
        <ImageViewModal
          imageUrl={viewingImage.url}
          panelIndex={viewingImage.panelIndex}
          pageIndex={viewingImage.pageIndex}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
};

// Character Modal Component
interface CharacterModalProps {
  character: ComicCharacter;
  onChange: (char: ComicCharacter) => void;
  onSave: () => void;
  onClose: () => void;
}

const CharacterModal: React.FC<CharacterModalProps> = ({ character, onChange, onSave, onClose }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({
          ...character,
          referenceImages: [
            ...character.referenceImages,
            { file, dataUrl: reader.result as string },
          ].slice(0, 5),
        });
      };
      reader.readAsDataURL(file);
    });
  }, [character, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 5 - character.referenceImages.length,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg mx-4 md-surface-container rounded-xl p-6 border border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="md-title-large">
            {character.name ? "Edit Character" : "New Character"}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container-high)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="md-label-medium block mb-1">Name</label>
            <input
              type="text"
              value={character.name}
              onChange={(e) => onChange({ ...character, name: e.target.value })}
              placeholder="Character name..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium"
            />
          </div>

          <div>
            <label className="md-label-medium block mb-1">Description</label>
            <textarea
              value={character.description}
              onChange={(e) => onChange({ ...character, description: e.target.value })}
              placeholder="Describe the character's appearance..."
              className="w-full h-20 px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] md-body-medium resize-none"
            />
          </div>

          <div>
            <label className="md-label-medium block mb-2">
              Reference Images ({character.referenceImages.length}/5)
            </label>
            {character.referenceImages.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {character.referenceImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img.dataUrl}
                      alt={`Ref ${index + 1}`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => onChange({
                        ...character,
                        referenceImages: character.referenceImages.filter((_, i) => i !== index),
                      })}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--md-sys-color-error)] text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {character.referenceImages.length < 5 && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
                    : "border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]"
                }`}
              >
                <input {...getInputProps()} />
                <p className="md-body-small" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  Drop images or click to upload
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!character.name.trim()}
            className="px-4 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] disabled:opacity-50"
          >
            Save Character
          </button>
        </div>
      </div>
    </div>
  );
};

// Image View Modal Component
interface ImageViewModalProps {
  imageUrl: string;
  panelIndex: number;
  pageIndex: number;
  onClose: () => void;
}

const ImageViewModal: React.FC<ImageViewModalProps> = ({ imageUrl, panelIndex, pageIndex, onClose }) => {
  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `comic_page${pageIndex + 1}_panel${panelIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-zoom-out"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadImage();
          }}
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          title="Download image"
        >
          <Download className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt={`Panel ${panelIndex + 1} - Full View`}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white md-label-medium">
          Page {pageIndex + 1}, Panel {panelIndex + 1}
        </p>
      </div>
    </div>
  );
};

export default ComicCreator;
