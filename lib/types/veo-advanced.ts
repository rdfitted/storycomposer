export type VeoModel =
  | "veo-3.1-generate-preview"
  | "veo-3.1-fast-generate-preview"
  | "veo-2.0-generate-001";

export type VideoResolution = "720p" | "1080p";
export type VideoAspectRatio = "16:9" | "9:16";
export type VideoDuration = 4 | 6 | 8;

export interface FrameImage {
  file: File;
  dataUrl: string;
}

export interface FrameDirection {
  mode: "first-only" | "last-only" | "interpolation";
  firstFrame?: FrameImage;
  lastFrame?: FrameImage;
}

export interface ReferenceImage {
  id: string;
  file: File;
  dataUrl: string;
  role: "subject" | "style" | "scene";
}

export interface VideoExtension {
  sourceVideoUri: string;
  currentDuration: number;
  extensionSeconds: number; // 7s increments
  iterations: number; // max 20, total max 148s
}

export interface VeoAdvancedConfig {
  prompt: string;
  negativePrompt?: string;
  model: VeoModel;
  resolution: VideoResolution;
  aspectRatio: VideoAspectRatio;
  duration: VideoDuration;
  frameDirection?: FrameDirection;
  referenceImages: ReferenceImage[]; // max 3
  extension?: VideoExtension;
  personGeneration?: "allow" | "block";
}

// Validation helpers
export const canUse1080p = (duration: VideoDuration) => duration === 8;
export const canUseFrameDirection = (duration: VideoDuration) => duration === 8;
export const canUseReferenceImages = (duration: VideoDuration) => duration === 8;
export const maxExtensionDuration = 148;
export const extensionIncrement = 7;

// Model options
export const VEO_MODELS: { value: VeoModel; label: string; description: string }[] = [
  {
    value: "veo-3.1-generate-preview",
    label: "Veo 3.1",
    description: "Highest quality, dialogue support"
  },
  {
    value: "veo-3.1-fast-generate-preview",
    label: "Veo 3.1 Fast",
    description: "Faster generation, good quality"
  },
  {
    value: "veo-2.0-generate-001",
    label: "Veo 2.0",
    description: "Legacy model"
  },
];

// Duration options
export const DURATION_OPTIONS: { value: VideoDuration; label: string; supports1080p: boolean }[] = [
  { value: 4, label: "4 seconds", supports1080p: false },
  { value: 6, label: "6 seconds", supports1080p: false },
  { value: 8, label: "8 seconds", supports1080p: true },
];

// Resolution options
export const RESOLUTION_OPTIONS: { value: VideoResolution; label: string }[] = [
  { value: "720p", label: "720p HD" },
  { value: "1080p", label: "1080p Full HD" },
];

// Aspect ratio options
export const ASPECT_RATIO_OPTIONS: { value: VideoAspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9 Landscape" },
  { value: "9:16", label: "9:16 Portrait" },
];

// Reference image role options
export const REFERENCE_ROLES: { value: ReferenceImage["role"]; label: string }[] = [
  { value: "subject", label: "Subject (Person/Object)" },
  { value: "style", label: "Style Reference" },
  { value: "scene", label: "Scene/Background" },
];

// Default config
export const DEFAULT_VEO_CONFIG: Omit<VeoAdvancedConfig, "prompt"> = {
  model: "veo-3.1-generate-preview",
  resolution: "720p",
  aspectRatio: "16:9",
  duration: 8,
  referenceImages: [],
};
