export type SceneFrameMode = "single" | "start-only" | "end-only" | "interpolation";

export interface Scene {
  id: string;
  // Legacy single image (backwards compatible)
  imageFile: File | null;
  // Dual frame support
  frameMode: SceneFrameMode;
  firstFrameFile: File | null;
  lastFrameFile: File | null;
  // Prompt
  prompt: string;
  isEnhancingPrompt: boolean;
  // Video settings
  aspectRatio: string;
  // Character references for this scene (max 3)
  characterIds: string[];
  // Generation state
  operationName: string | null;
  isGenerating: boolean;
  videoUrl: string | null;
  videoBlobRef: Blob | null;
  originalVideoUrlRef: string | null;
  trimmedBlobRef: Blob | null;
  trimmedUrlRef: string | null;
}

export interface SceneCreationData {
  imageFile?: File | null;
  firstFrameFile?: File | null;
  lastFrameFile?: File | null;
  frameMode?: SceneFrameMode;
  prompt: string;
  aspectRatio?: string;
  characterIds?: string[];
}

export const createScene = (data: SceneCreationData): Scene => {
  return {
    id: crypto.randomUUID(),
    imageFile: data.imageFile || null,
    frameMode: data.frameMode || "single",
    firstFrameFile: data.firstFrameFile || null,
    lastFrameFile: data.lastFrameFile || null,
    prompt: data.prompt,
    isEnhancingPrompt: false,
    aspectRatio: data.aspectRatio || "16:9",
    characterIds: data.characterIds || [],
    operationName: null,
    isGenerating: false,
    videoUrl: null,
    videoBlobRef: null,
    originalVideoUrlRef: null,
    trimmedBlobRef: null,
    trimmedUrlRef: null,
  };
};

export const updateScene = (
  scenes: Scene[],
  sceneId: string,
  updates: Partial<Scene>
): Scene[] => {
  return scenes.map((scene) =>
    scene.id === sceneId ? { ...scene, ...updates } : scene
  );
};

export const removeScene = (scenes: Scene[], sceneId: string): Scene[] => {
  return scenes.filter((scene) => scene.id !== sceneId);
};

export const reorderScenes = (
  scenes: Scene[],
  fromIndex: number,
  toIndex: number
): Scene[] => {
  const result = [...scenes];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

export const cleanupSceneUrls = (scene: Scene): void => {
  if (scene.videoUrl && scene.videoBlobRef) {
    URL.revokeObjectURL(scene.videoUrl);
  }
  if (scene.originalVideoUrlRef) {
    URL.revokeObjectURL(scene.originalVideoUrlRef);
  }
  if (scene.trimmedUrlRef) {
    URL.revokeObjectURL(scene.trimmedUrlRef);
  }
};

export const cleanupAllSceneUrls = (scenes: Scene[]): void => {
  scenes.forEach(cleanupSceneUrls);
};

// Helper to check if a scene can generate based on its frame mode
export const canSceneGenerate = (scene: Scene): boolean => {
  if (!scene.prompt.trim()) return false;
  if (scene.isGenerating) return false;

  switch (scene.frameMode) {
    case "single":
      return !!scene.imageFile;
    case "start-only":
      return !!scene.firstFrameFile;
    case "end-only":
      return !!scene.lastFrameFile;
    case "interpolation":
      return !!scene.firstFrameFile && !!scene.lastFrameFile;
    default:
      return false;
  }
};
