// Comic Creator Types
export type ComicStyle = "manga" | "american" | "european" | "webcomic" | "graphic-novel";

export interface ComicCharacter {
  id: string;
  name: string;
  referenceImages: Array<{ file: File; dataUrl: string }>;
  description: string;
}

export interface ComicDialogue {
  character: string;
  text: string;
}

export interface ComicPanel {
  id: string;
  position: number;
  prompt: string;
  characters: string[]; // character IDs
  dialogue?: ComicDialogue[];
  imageUrl?: string;
  isGenerating?: boolean;
  scenicContinuity?: boolean; // Maintain same background/setting
  scenicReference?: { pageIndex: number; panelId: string } | null; // Specific panel to reference for scene
}

export interface ComicPage {
  id: string;
  pageNumber: number;
  panels: ComicPanel[];
  layout: "grid-2x2" | "grid-3x3" | "strip-horizontal" | "strip-vertical" | "single" | "custom";
}

export interface ComicProject {
  id: string;
  title: string;
  style: ComicStyle;
  characters: ComicCharacter[];
  pages: ComicPage[];
  // Legacy support - will be migrated to pages
  panels?: ComicPanel[];
}

export const PAGE_LAYOUTS: { value: ComicPage["layout"]; label: string; panelCount: number }[] = [
  { value: "single", label: "Single Panel", panelCount: 1 },
  { value: "strip-horizontal", label: "Horizontal Strip (3)", panelCount: 3 },
  { value: "strip-vertical", label: "Vertical Strip (3)", panelCount: 3 },
  { value: "grid-2x2", label: "2×2 Grid (4)", panelCount: 4 },
  { value: "grid-3x3", label: "3×3 Grid (9)", panelCount: 9 },
  { value: "custom", label: "Custom Layout", panelCount: 0 },
];

export const COMIC_STYLES: { value: ComicStyle; label: string; description: string }[] = [
  { value: "manga", label: "Manga", description: "Japanese comic style" },
  { value: "american", label: "American", description: "Marvel/DC style" },
  { value: "european", label: "European", description: "Tintin/BD style" },
  { value: "webcomic", label: "Webcomic", description: "Modern digital style" },
  { value: "graphic-novel", label: "Graphic Novel", description: "Mature, detailed" },
];

// Legacy - kept for backwards compatibility
export const COMIC_LAYOUTS: { value: string; label: string }[] = [
  { value: "grid", label: "Grid (2x2, 3x3)" },
  { value: "free", label: "Free Layout" },
  { value: "strip", label: "Comic Strip" },
];

// Voxel Generator Types
export type VoxelResolution = 16 | 32 | 64 | 128;
export type VoxelStyle = "blocky" | "smooth" | "stylized";
export type VoxelPalette = "original" | "limited-16" | "limited-32" | "custom";

export interface VoxelConfig {
  sourceImage: File | null;
  sourceImageUrl?: string;
  resolution: VoxelResolution;
  colorPalette: VoxelPalette;
  style: VoxelStyle;
  customColors?: string[];
}

export interface VoxelResult {
  voxelData: VoxelData;
  preview: string; // 3D render preview
}

export interface VoxelData {
  dimensions: [number, number, number];
  voxels: Array<{
    position: [number, number, number];
    color: [number, number, number]; // RGB
  }>;
}

export const VOXEL_RESOLUTIONS: { value: VoxelResolution; label: string }[] = [
  { value: 16, label: "16x16x16 (Low)" },
  { value: 32, label: "32x32x32 (Medium)" },
  { value: 64, label: "64x64x64 (High)" },
  { value: 128, label: "128x128x128 (Ultra)" },
];

export const VOXEL_STYLES: { value: VoxelStyle; label: string; description: string }[] = [
  { value: "blocky", label: "Blocky", description: "Minecraft-like" },
  { value: "smooth", label: "Smooth", description: "Rounded edges" },
  { value: "stylized", label: "Stylized", description: "Artistic interpretation" },
];

export const VOXEL_PALETTES: { value: VoxelPalette; label: string }[] = [
  { value: "original", label: "Original Colors" },
  { value: "limited-16", label: "16 Color Palette" },
  { value: "limited-32", label: "32 Color Palette" },
  { value: "custom", label: "Custom Palette" },
];

export const DEFAULT_VOXEL_CONFIG: VoxelConfig = {
  sourceImage: null,
  resolution: 32,
  colorPalette: "original",
  style: "blocky",
};
