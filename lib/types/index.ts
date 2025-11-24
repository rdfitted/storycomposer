// Nano Banana Pro types
export * from "./nano-banana";

// Veo Advanced types
export * from "./veo-advanced";

// Creative tabs types
export * from "./creative-tabs";

// Storyboard character types
export * from "./storyboard-characters";

// Common mode type
export type Mode =
  | "photo-editor"
  | "ai-editor"
  | "home-canvas"
  | "nano-banana"      // Advanced image generation
  | "single"
  | "storyboard"
  | "comic-creator"    // Multi-panel comics
  | "voxel-generator"; // 3D voxels
