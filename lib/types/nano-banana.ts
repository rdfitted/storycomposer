export type Resolution = "1K" | "2K" | "4K";

export interface ResolutionConfig {
  label: string;
  value: Resolution;
  pixels: { width: number; height: number };
  price: string;
}

export const RESOLUTIONS: ResolutionConfig[] = [
  { label: "1K", value: "1K", pixels: { width: 1024, height: 1024 }, price: "$0.134" },
  { label: "2K", value: "2K", pixels: { width: 2048, height: 2048 }, price: "$0.134" },
  { label: "4K", value: "4K", pixels: { width: 4096, height: 4096 }, price: "$0.24" },
];

export type CameraAngle =
  | "eye-level" | "low-angle" | "high-angle" | "birds-eye"
  | "worms-eye" | "dutch-angle" | "over-shoulder" | "close-up";

export type DepthOfField = "deep" | "shallow" | "bokeh" | "tilt-shift";

export type LightingPreset =
  | "natural" | "studio" | "golden-hour" | "blue-hour"
  | "dramatic" | "soft" | "hard" | "rim" | "neon" | "volumetric";

export type ColorGrading =
  | "natural" | "cinematic" | "vintage" | "vibrant"
  | "muted" | "noir" | "teal-orange";

export interface CameraControls {
  angle: CameraAngle;
  dof: DepthOfField;
  lighting: LightingPreset;
  colorGrading: ColorGrading;
  lens?: string; // "35mm", "50mm", "85mm", "135mm"
}

export interface TextOverlay {
  text: string;
  style: "headline" | "body" | "caption" | "logo";
  position: "top" | "center" | "bottom";
  font?: string;
}

export interface ReferenceObject {
  id: string;
  file: File;
  dataUrl: string;
  label: string;
  blendWeight?: number; // 0-1
}

export interface CharacterReference {
  id: string;
  name: string;
  images: Array<{ file: File; dataUrl: string }>;
}

export interface NanoBananaConfig {
  prompt: string;
  negativePrompt?: string;
  resolution: Resolution;
  aspectRatio: "16:9" | "1:1" | "9:16" | "4:3";
  cameraControls?: CameraControls;
  textOverlay?: TextOverlay;
  referenceObjects: ReferenceObject[]; // max 14
  characterReferences: CharacterReference[]; // max 5
  searchGrounding?: boolean; // Use Google Search for facts
}

// Default camera controls
export const DEFAULT_CAMERA_CONTROLS: CameraControls = {
  angle: "eye-level",
  dof: "deep",
  lighting: "natural",
  colorGrading: "natural",
};

// Camera angle options
export const CAMERA_ANGLES: { value: CameraAngle; label: string }[] = [
  { value: "eye-level", label: "Eye Level" },
  { value: "low-angle", label: "Low Angle" },
  { value: "high-angle", label: "High Angle" },
  { value: "birds-eye", label: "Bird's Eye" },
  { value: "worms-eye", label: "Worm's Eye" },
  { value: "dutch-angle", label: "Dutch Angle" },
  { value: "over-shoulder", label: "Over Shoulder" },
  { value: "close-up", label: "Close Up" },
];

// DOF options
export const DOF_OPTIONS: { value: DepthOfField; label: string }[] = [
  { value: "deep", label: "Deep (Sharp)" },
  { value: "shallow", label: "Shallow (Blurry BG)" },
  { value: "bokeh", label: "Bokeh" },
  { value: "tilt-shift", label: "Tilt-Shift" },
];

// Lighting presets
export const LIGHTING_PRESETS: { value: LightingPreset; label: string }[] = [
  { value: "natural", label: "Natural" },
  { value: "studio", label: "Studio" },
  { value: "golden-hour", label: "Golden Hour" },
  { value: "blue-hour", label: "Blue Hour" },
  { value: "dramatic", label: "Dramatic" },
  { value: "soft", label: "Soft" },
  { value: "hard", label: "Hard" },
  { value: "rim", label: "Rim Light" },
  { value: "neon", label: "Neon" },
  { value: "volumetric", label: "Volumetric" },
];

// Color grading options
export const COLOR_GRADINGS: { value: ColorGrading; label: string }[] = [
  { value: "natural", label: "Natural" },
  { value: "cinematic", label: "Cinematic" },
  { value: "vintage", label: "Vintage" },
  { value: "vibrant", label: "Vibrant" },
  { value: "muted", label: "Muted" },
  { value: "noir", label: "Noir" },
  { value: "teal-orange", label: "Teal & Orange" },
];

// Lens options
export const LENS_OPTIONS = ["24mm", "35mm", "50mm", "85mm", "135mm", "200mm"];
