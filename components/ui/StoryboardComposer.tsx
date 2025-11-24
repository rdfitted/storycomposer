"use client";

import React, { useState, useCallback } from "react";
import { Plus, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
import AspectRatioSelector from "./AspectRatioSelector";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Scene, cleanupAllSceneUrls } from "@/lib/storyboard";
import SceneCard from "./SceneCard";
import ModelSelector from "./ModelSelector";
import CharacterBank from "./storyboard/CharacterBank";
import { useStoryboardCharacters } from "@/stores/useCreativeStore";

interface StoryboardComposerProps {
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  onGenerateScene: (sceneId: string) => void;
  onEnhancePrompt: (sceneId: string) => void;
}

import type { StoryboardCharacter } from "@/lib/types/storyboard-characters";

// Sortable wrapper for SceneCard
interface SortableSceneCardProps {
  scene: Scene;
  sceneIndex: number;
  characters: StoryboardCharacter[];
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onRemoveScene: (sceneId: string) => void;
  onGenerateScene: (sceneId: string) => void;
  onEnhancePrompt: (sceneId: string) => void;
}

const SortableSceneCard: React.FC<SortableSceneCardProps> = ({
  scene,
  sceneIndex,
  characters,
  onUpdateScene,
  onRemoveScene,
  onGenerateScene,
  onEnhancePrompt,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SceneCard
        scene={scene}
        sceneIndex={sceneIndex}
        characters={characters}
        onUpdateScene={onUpdateScene}
        onRemoveScene={onRemoveScene}
        onGenerateScene={onGenerateScene}
        onEnhancePrompt={onEnhancePrompt}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const StoryboardComposer: React.FC<StoryboardComposerProps> = ({
  scenes,
  setScenes,
  selectedModel,
  setSelectedModel,
  aspectRatio,
  setAspectRatio,
  onGenerateScene,
  onEnhancePrompt,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCharacterBankCollapsed, setIsCharacterBankCollapsed] = useState(false);
  const { characters } = useStoryboardCharacters();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddScene = () => {
    // Create an empty scene with all new fields
    const newScene: Scene = {
      id: crypto.randomUUID(),
      imageFile: null,
      frameMode: "single",
      firstFrameFile: null,
      lastFrameFile: null,
      prompt: "",
      isEnhancingPrompt: false,
      aspectRatio: aspectRatio,
      characterIds: [],
      operationName: null,
      isGenerating: false,
      videoUrl: null,
      videoBlobRef: null,
      originalVideoUrlRef: null,
      trimmedBlobRef: null,
      trimmedUrlRef: null,
    };
    setScenes([...scenes, newScene]);
  };

  const handleUpdateScene = useCallback((sceneId: string, updates: Partial<Scene>) => {
    setScenes(scenes.map(scene =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    ));
  }, [scenes, setScenes]);

  const handleRemoveScene = useCallback((sceneId: string) => {
    const sceneToRemove = scenes.find(s => s.id === sceneId);
    if (sceneToRemove) {
      // Cleanup URLs before removing
      if (sceneToRemove.videoUrl && sceneToRemove.videoBlobRef) {
        URL.revokeObjectURL(sceneToRemove.videoUrl);
      }
      if (sceneToRemove.originalVideoUrlRef) {
        URL.revokeObjectURL(sceneToRemove.originalVideoUrlRef);
      }
      if (sceneToRemove.trimmedUrlRef) {
        URL.revokeObjectURL(sceneToRemove.trimmedUrlRef);
      }
    }
    setScenes(scenes.filter(scene => scene.id !== sceneId));
  }, [scenes, setScenes]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = scenes.findIndex((scene) => scene.id === active.id);
      const newIndex = scenes.findIndex((scene) => scene.id === over?.id);

      setScenes(arrayMove(scenes, oldIndex, newIndex));
    }
  };

  const handleResetAll = () => {
    cleanupAllSceneUrls(scenes);
    setScenes([]);
  };

  const totalGenerating = scenes.filter(s => s.isGenerating).length;
  const totalCompleted = scenes.filter(s => s.videoUrl).length;

  return (
    <div className="md-surface-container-highest border border-[var(--md-sys-color-outline-variant)] rounded-2xl md-elevation-3">
      {/* Header */}
      <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="md-title-large" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Storyboard Controls
            </h2>
            <div className="md-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {scenes.length} scenes • {totalCompleted} completed • {totalGenerating} generating
            </div>
          </div>
          <button
            className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
            ) : (
              <ChevronUp className="w-5 h-5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
            )}
          </button>
        </div>

        {/* Settings Row - Separated from header */}
        {!isCollapsed && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="md-label-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Aspect Ratio:</span>
              <AspectRatioSelector
                selectedRatio={aspectRatio}
                onRatioChange={setAspectRatio}
                compact={true}
                forVideo={true}
                selectedModel={selectedModel}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="md-label-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Model:</span>
              <ModelSelector
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
              />
            </div>
            <button
              onClick={handleResetAll}
              className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
              title="Reset all scenes"
            >
              <RotateCcw className="w-4 h-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-[var(--md-sys-color-outline-variant)]">
          {/* Character Bank */}
          <div className="pt-4 mb-4">
            <CharacterBank
              collapsed={isCharacterBankCollapsed}
              onToggleCollapse={() => setIsCharacterBankCollapsed(!isCharacterBankCollapsed)}
            />
          </div>

          <div className="mb-4">
            <button
              onClick={handleAddScene}
              className="flex items-center gap-2 px-4 py-2 rounded-xl md-label-large transition-all duration-200 hover:bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]"
              style={{ color: 'var(--md-sys-color-primary)' }}
            >
              <Plus className="w-4 h-4" />
              Add Scene
            </button>
          </div>

          {/* Scenes List */}
          <div className="max-h-96 overflow-y-auto">
            {scenes.length === 0 ? (
              <div className="text-center py-8">
                <div className="md-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Click &quot;Add Scene&quot; to get started
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={scenes} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {scenes.map((scene, index) => (
                      <SortableSceneCard
                        key={scene.id}
                        scene={scene}
                        sceneIndex={index}
                        characters={characters}
                        onUpdateScene={handleUpdateScene}
                        onRemoveScene={handleRemoveScene}
                        onGenerateScene={onGenerateScene}
                        onEnhancePrompt={onEnhancePrompt}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardComposer;
