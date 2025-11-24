# Story Composer Feature Expansion: Gemini 3.0 / Nano Banana Pro / Veo 3.1

---
**Plan Metadata**
- **Generated**: 2025-11-22
- **Planning Agents**: GPT-5.1 Codex, Gemini 3 Pro, Sonnet 4.5
- **Documentation Referenced**:
  - `aidocs/gemini-3-veo-31-ai-studio-apps-docs.md`
  - `aidocs/gemini-3-veo-31-feature-extension-docs.md`
  - `aidocs/gemini-3-model-update-docs.md`
- **Synthesis Approach**: Combined best elements from all 3 agent plans

**Agent Contributions:**
- **Codex**: Job tracking architecture, websocket updates for long-running operations, asset management patterns
- **Gemini 3 Pro**: Next.js App Router structure, Zustand state management for character consistency, API cost considerations, prompt engineering for camera controls
- **Sonnet**: Comprehensive TypeScript interfaces, detailed component hierarchy, phased implementation with story points, success metrics, risk mitigation strategies
---

## 1. Executive Summary

This plan extends Story Composer with Google's latest AI capabilities:
1. **NANO BANANA PRO** - Advanced 4K image generation with professional controls
2. **VEO 3.1 ADVANCED** - Director-mode video with frame interpolation and extension
3. **NEW CREATIVE TABS** - SVG Generator, Comic Creator, 3D Voxel Generator

**Estimated Effort:** 24-37 developer days (~5-7 weeks)
**New Files:** 32 | **Modified Files:** 6 | **New Components:** 22

---

## 2. Current Architecture Analysis

### Existing Mode Structure
```typescript
// Current (app/page.tsx:26)
type Mode = "single" | "storyboard" | "photo-editor" | "ai-editor" | "home-canvas";
```

### Existing File Structure
```
app/
├── api/
│   ├── ai-editor/edit/route.ts          # Localized image editing
│   ├── home-canvas/generate/route.ts    # Product placement (gemini-3-pro-image-preview)
│   ├── imagen/generate/route.ts         # Simple text-to-image
│   ├── photo-editor/generate/route.ts   # Multi-image context generation
│   └── veo/
│       ├── generate/route.ts            # Video generation (veo-3.1-generate-preview)
│       ├── operation/route.ts           # Operation polling
│       └── download/route.ts            # Video download
├── page.tsx                             # Main app with mode switching
components/ui/
├── ModeSelector.tsx                     # 5-mode switcher
├── ModelSelector.tsx                    # Video model dropdown (Veo 3.1/Fast/2.0)
├── Composer.tsx                         # Single video input
├── PhotoEditor.tsx                      # Chat-based image editor
├── AIEditor.tsx                         # Point-and-click retouching
├── HomeCanvas.tsx                       # Product placement
└── StoryboardComposer.tsx               # Multi-scene video management
services/
└── geminiService.ts                     # Composite image generation with semantic positioning
```

### Current Model Usage
- **Image**: `gemini-3-pro-image-preview` (Nano Banana Pro) - already integrated
- **Scene Analysis**: `gemini-3-pro-preview`
- **Video**: `veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview`

---

## 3. Feature Requirements

### 3.1 NANO BANANA PRO Enhancements

| Feature | Description | API Parameter | Priority |
|---------|-------------|---------------|----------|
| **4K Resolution** | 1K/2K/4K output selector | Config: image dimensions | P0 |
| **Text Rendering** | Marketing text overlay with styles | Prompt engineering | P0 |
| **Camera Controls** | Angle, DOF, lighting, color grading | Prompt modifiers | P1 |
| **Image Blending** | Up to 14 reference objects | Multiple `inlineData` parts | P1 |
| **Character Consistency** | Up to 5 people tracking | Reference image array | P1 |

### 3.2 VEO 3.1 Advanced Features

| Feature | Description | API Support | Priority |
|---------|-------------|-------------|----------|
| **Frame Direction** | First/last frame specification | Interpolation endpoint | P0 |
| **Reference Images** | Up to 3 subject references | `referenceImages[]` | P0 |
| **Video Extension** | 7s increments, max 148s | Extension endpoint | P1 |
| **1080p Resolution** | HD output (8s videos only) | `resolution` param | P0 |
| **Portrait Mode** | 9:16 aspect ratio | `aspectRatio` param | P0 |

### 3.3 New Creative Tabs

| Tab | Description | Technology | Priority |
|-----|-------------|------------|----------|
| **SVG Generator** | Text-to-vector graphics | Gemini + SVG parsing | P1 |
| **Comic Creator** | Multi-panel with character consistency | Gemini + panel layout | P2 |
| **3D Voxel Generator** | Image-to-voxel conversion | Gemini + Three.js | P2 |

---

## 4. Architecture Design

### 4.1 Updated Mode Type
```typescript
// New mode type (expanded from 5 to 9 modes)
type Mode =
  | "photo-editor"
  | "ai-editor"
  | "home-canvas"
  | "nano-banana"      // NEW: Advanced image generation
  | "single"
  | "storyboard"
  | "svg-generator"    // NEW: Vector graphics
  | "comic-creator"    // NEW: Multi-panel comics
  | "voxel-generator"; // NEW: 3D voxels
```

### 4.2 TypeScript Interfaces

#### `lib/types/nano-banana.ts`
```typescript
export type Resolution = "1K" | "2K" | "4K";

export interface ResolutionConfig {
  label: string;
  value: Resolution;
  pixels: { width: number; height: number };
  price: string; // "$0.134" | "$0.134" | "$0.24"
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
```

#### `lib/types/veo-advanced.ts`
```typescript
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
```

#### `lib/types/creative-tabs.ts`
```typescript
// SVG Generator
export type SVGStyle = "flat" | "gradient" | "outline" | "isometric" | "detailed";

export interface SVGConfig {
  prompt: string;
  style: SVGStyle;
  colorScheme: string[];
  dimensions: { width: number; height: number };
}

export interface SVGResult {
  svgCode: string;
  preview: string; // data URL
}

// Comic Creator
export type ComicStyle = "manga" | "american" | "european" | "webcomic" | "graphic-novel";

export interface ComicCharacter {
  id: string;
  name: string;
  referenceImages: Array<{ file: File; dataUrl: string }>;
  description: string;
}

export interface ComicPanel {
  id: string;
  position: number;
  prompt: string;
  characters: string[]; // character IDs
  dialogue?: { character: string; text: string }[];
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface ComicProject {
  id: string;
  title: string;
  style: ComicStyle;
  characters: ComicCharacter[];
  panels: ComicPanel[];
  layout: "grid" | "free" | "strip";
}

// Voxel Generator
export type VoxelResolution = 16 | 32 | 64 | 128;
export type VoxelStyle = "blocky" | "smooth" | "stylized";

export interface VoxelConfig {
  sourceImage: File;
  resolution: VoxelResolution;
  colorPalette: "original" | "limited-16" | "limited-32" | "custom";
  style: VoxelStyle;
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
```

### 4.3 New Directory Structure

```
lib/
└── types/
    ├── index.ts                        # Barrel exports
    ├── nano-banana.ts                  # Image generation types
    ├── veo-advanced.ts                 # Video types
    └── creative-tabs.ts                # SVG, Comic, Voxel types

app/api/
├── nano-banana/
│   └── generate/route.ts               # NEW: Advanced image generation
├── veo/
│   ├── generate/route.ts               # MODIFY: Add advanced options
│   ├── extend/route.ts                 # NEW: Video extension
│   ├── interpolate/route.ts            # NEW: Frame interpolation
│   ├── operation/route.ts              # Existing
│   └── download/route.ts               # Existing
├── svg/
│   └── generate/route.ts               # NEW: SVG generation
├── comic/
│   ├── generate-panel/route.ts         # NEW: Panel generation
│   └── character/route.ts              # NEW: Character consistency
└── voxel/
    └── generate/route.ts               # NEW: Voxel conversion

components/ui/
├── ModeSelector.tsx                    # MODIFY: Add 4 new modes
├── NanoBananaPro/
│   ├── NanoBananaPro.tsx               # Main container
│   ├── ResolutionSelector.tsx          # 1K/2K/4K toggle
│   ├── CameraControlPanel.tsx          # Camera settings accordion
│   ├── TextOverlayEditor.tsx           # Text tool
│   ├── ObjectBlendingPanel.tsx         # 14-object grid
│   └── CharacterConsistencyPanel.tsx   # 5-character manager
├── VeoAdvanced/
│   ├── VeoAdvancedComposer.tsx         # Enhanced composer
│   ├── FrameDirectionPanel.tsx         # First/last frame UI
│   ├── ReferenceImagePanel.tsx         # 3-image manager
│   ├── VideoExtensionPanel.tsx         # Extension controls
│   └── ResolutionAspectSelector.tsx    # 1080p + 9:16 options
├── SVGGenerator/
│   ├── SVGGenerator.tsx                # Main container
│   ├── SVGPreview.tsx                  # Live rendering
│   ├── SVGStyleSelector.tsx            # Style options
│   └── SVGExportPanel.tsx              # Download options
├── ComicCreator/
│   ├── ComicCreator.tsx                # Main container
│   ├── ComicTimeline.tsx               # Panel sequence
│   ├── PanelEditor.tsx                 # Single panel editor
│   ├── CharacterManager.tsx            # Character bank
│   └── ComicExportPanel.tsx            # Export PDF/CBZ
└── VoxelGenerator/
    ├── VoxelGenerator.tsx              # Main container
    ├── VoxelViewer.tsx                 # Three.js renderer
    ├── VoxelControls.tsx               # Resolution/style
    └── VoxelExportPanel.tsx            # Export OBJ/GLTF

stores/
└── useCreativeStore.ts                 # NEW: Zustand store for cross-mode state
```

---

## 5. Implementation Phases

### Phase 1: Foundation & Infrastructure (3 days)

#### Step 1.1: Create Type Definitions
**Files to create:**
- `lib/types/nano-banana.ts`
- `lib/types/veo-advanced.ts`
- `lib/types/creative-tabs.ts`
- `lib/types/index.ts`

#### Step 1.2: Create Zustand Store
**File:** `stores/useCreativeStore.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CreativeStore {
  // Character bank (shared across modes)
  characters: CharacterReference[];
  addCharacter: (char: CharacterReference) => void;
  removeCharacter: (id: string) => void;

  // Recent generations
  recentImages: string[];
  recentVideos: string[];
  addRecentImage: (url: string) => void;
  addRecentVideo: (url: string) => void;
}
```

#### Step 1.3: Update ModeSelector
**File:** `components/ui/ModeSelector.tsx`
- Add 4 new modes with icons
- Redesign to collapsible sidebar with categories:
  - **Image**: Photo Editor, AI Editor, Home Canvas, Nano Banana Pro
  - **Video**: Single Video, Storyboard
  - **Creative**: SVG Generator, Comic Creator, Voxel Generator

#### Step 1.4: Update Main Page
**File:** `app/page.tsx`
- Extend mode type
- Add imports for new components
- Add conditional rendering blocks

---

### Phase 2: NANO BANANA PRO Tab (5-7 days)

#### Step 2.1: Create API Route
**File:** `app/api/nano-banana/generate/route.ts`

```typescript
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const prompt = formData.get("prompt") as string;
  const resolution = formData.get("resolution") as string;
  const cameraControls = JSON.parse(formData.get("cameraControls") as string || "{}");
  const textOverlay = JSON.parse(formData.get("textOverlay") as string || "null");
  const referenceObjects = formData.getAll("referenceObjects") as File[];

  // Build enhanced prompt with camera controls
  let enhancedPrompt = prompt;
  if (cameraControls.angle) {
    enhancedPrompt += `. Shot from ${cameraControls.angle} angle`;
  }
  if (cameraControls.dof) {
    enhancedPrompt += `, ${cameraControls.dof} depth of field`;
  }
  if (cameraControls.lighting) {
    enhancedPrompt += `, ${cameraControls.lighting} lighting`;
  }
  if (cameraControls.lens) {
    enhancedPrompt += `, ${cameraControls.lens} lens`;
  }
  if (textOverlay) {
    enhancedPrompt += `. Include text: "${textOverlay.text}" as ${textOverlay.style} style`;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // Build parts array with reference images
  const parts = [];
  for (const file of referenceObjects) {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    parts.push({
      inlineData: { mimeType: file.type, data: base64 }
    });
  }
  parts.push({ text: enhancedPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: {
      responseModalities: ['IMAGE'],
      // Resolution config based on selection
    },
  });

  // Extract and return image
  const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (imagePart?.inlineData) {
    return NextResponse.json({
      image: {
        mimeType: imagePart.inlineData.mimeType,
        imageBytes: imagePart.inlineData.data,
      }
    });
  }

  return NextResponse.json({ error: "No image generated" }, { status: 500 });
}
```

#### Step 2.2: Create UI Components
**Files:**
1. `components/ui/NanoBananaPro/NanoBananaPro.tsx` - Main container with two-column layout
2. `components/ui/NanoBananaPro/ResolutionSelector.tsx` - Toggle button group
3. `components/ui/NanoBananaPro/CameraControlPanel.tsx` - Collapsible with 4 dropdowns
4. `components/ui/NanoBananaPro/TextOverlayEditor.tsx` - Text input + style selector
5. `components/ui/NanoBananaPro/ObjectBlendingPanel.tsx` - 14-slot grid with drag-drop
6. `components/ui/NanoBananaPro/CharacterConsistencyPanel.tsx` - 5 character cards

---

### Phase 3: VEO 3.1 Advanced Video (4-5 days)

#### Step 3.1: Update Generate Route
**File:** `app/api/veo/generate/route.ts`

Add parameters:
- `resolution`: "720p" | "1080p"
- `duration`: 4 | 6 | 8
- `firstFrame`, `lastFrame`: Optional frame images
- `referenceImages[]`: Up to 3 reference images

#### Step 3.2: Create Extension Route
**File:** `app/api/veo/extend/route.ts`

```typescript
// Accept source video + extension duration
// Validate: source is Veo-generated, current <= 141s
// Return operation name for polling
```

#### Step 3.3: Create Interpolation Route
**File:** `app/api/veo/interpolate/route.ts`

```typescript
// Accept first/last frame images + prompt
// Fixed 8s duration, 16:9 aspect required
// Return operation name for polling
```

#### Step 3.4: Create UI Components
**Files:**
1. `components/ui/VeoAdvanced/VeoAdvancedComposer.tsx` - Enhanced with director controls
2. `components/ui/VeoAdvanced/FrameDirectionPanel.tsx` - First/last frame upload
3. `components/ui/VeoAdvanced/ReferenceImagePanel.tsx` - 3-slot image manager
4. `components/ui/VeoAdvanced/VideoExtensionPanel.tsx` - Duration slider + iteration count
5. `components/ui/VeoAdvanced/ResolutionAspectSelector.tsx` - 720p/1080p + 16:9/9:16

---

### Phase 4: New Creative Tabs (8-10 days)

#### Step 4.1: SVG Generator (2-3 days)

**API Route:** `app/api/svg/generate/route.ts`
- Prompt Gemini to output valid SVG XML
- Parse and validate SVG structure
- Return SVG code string

**Components:**
- `SVGGenerator.tsx` - Main with prompt input
- `SVGPreview.tsx` - Live rendering with dangerouslySetInnerHTML (sanitized)
- `SVGStyleSelector.tsx` - Style presets
- `SVGExportPanel.tsx` - Download as SVG/PNG/PDF

#### Step 4.2: Comic Creator (3-4 days)

**API Routes:**
- `app/api/comic/generate-panel/route.ts` - Generate panel with character references
- `app/api/comic/character/route.ts` - Store/retrieve character definitions

**Components:**
- `ComicCreator.tsx` - Main with panel grid
- `ComicTimeline.tsx` - Drag-drop panel reordering
- `PanelEditor.tsx` - Individual panel prompt + character selection
- `CharacterManager.tsx` - Define characters with reference images
- `ComicExportPanel.tsx` - Export as PDF/CBZ/image sequence

**State Management:** Use Zustand store for character bank persistence

#### Step 4.3: 3D Voxel Generator (3 days)

**API Route:** `app/api/voxel/generate/route.ts`
- Analyze source image with Gemini
- Generate voxel data (position + color arrays)
- Return JSON for Three.js rendering

**Components:**
- `VoxelGenerator.tsx` - Main with source image upload
- `VoxelViewer.tsx` - Three.js canvas with OrbitControls
- `VoxelControls.tsx` - Resolution/style/palette selectors
- `VoxelExportPanel.tsx` - Export OBJ/GLTF/VOX

**New Dependencies:**
```json
{
  "three": "^0.160.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.92.0",
  "zustand": "^4.4.0"
}
```

---

### Phase 5: Integration & Polish (3-4 days)

#### Step 5.1: Mode Navigation Redesign
- Convert ModeSelector to sidebar with categories
- Add keyboard shortcuts (1-9 for modes)
- Add mode transition animations

#### Step 5.2: Shared Components
- `ImageUploadGrid.tsx` - Reusable multi-image upload
- `CollapsiblePanel.tsx` - Expandable control sections
- `GenerationProgress.tsx` - Unified loading states

#### Step 5.3: Error Handling & Rate Limiting
- Implement request queue for expensive operations
- Add clear rate limit feedback
- Graceful degradation for API failures

---

## 6. Testing Strategy

### 6.1 Unit Tests (Jest + RTL)
- Resolution selector state changes
- Camera control prompt string generation
- Reference image limit enforcement
- Video extension duration validation
- SVG output parsing

### 6.2 Integration Tests (Playwright)
- Full Nano Banana Pro workflow: Configure -> Generate -> Download
- Veo advanced: Frame direction -> Generate -> Extend
- Comic Creator: Define characters -> Generate panels -> Export
- Mode switching preserves state

### 6.3 API Tests
- Mock Gemini responses for each resolution
- Error handling for 429 rate limits
- Timeout handling for long generations

### 6.4 Performance Tests
- 4K image rendering doesn't crash browser
- Three.js voxel viewer handles 128^3 voxels
- 14-image upload doesn't exceed payload limits

---

## 7. Risks & Mitigations

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **API rate limits** | High | Request queue, clear feedback, retry with backoff |
| **4K generation latency** | Medium | Progress indicator, background processing |
| **Video extension instability** | High | Exponential backoff, graceful degradation |
| **Three.js bundle size** | Medium | Dynamic import, lazy load voxel viewer |
| **14-image payload limits** | High | Upload to temp storage, pass URLs not base64 |

### UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Feature overload (9 modes)** | High | Progressive disclosure, category grouping, onboarding |
| **Long generation times** | High | Background processing, notification when complete |
| **Character consistency quality** | Medium | Reference image guidelines, allow regeneration |

---

## 8. Success Criteria

### Functional

| Feature | Acceptance Criteria |
|---------|---------------------|
| **4K Generation** | Output resolution matches request (4096x4096) |
| **Camera Controls** | Visual inspection confirms style applied |
| **Video Extension** | Duration increases by 7s per extension |
| **Frame Direction** | First/last frames visually match input |
| **SVG Output** | Valid SVG renders in browser |
| **Comic Consistency** | Characters recognizable across 3+ panels |
| **Voxel Generation** | 3D model resembles source image |

### Performance

| Metric | Target |
|--------|--------|
| 1K Image Generation | < 15s |
| 4K Image Generation | < 45s |
| Video Generation (8s) | < 120s |
| SVG Generation | < 10s |
| Mode Switch | < 100ms |

---

## 9. Effort Summary

| Phase | Story Points | Dev Days | Dependencies |
|-------|--------------|----------|--------------|
| **Phase 1**: Foundation | 8 | 3 | None |
| **Phase 2**: Nano Banana Pro | 21 | 5-7 | Phase 1 |
| **Phase 3**: Veo Advanced | 13 | 4-5 | Phase 1 |
| **Phase 4**: Creative Tabs | 34 | 8-10 | Phases 1-3 |
| **Phase 5**: Integration | 13 | 3-4 | All |
| **Testing** | 13 | 3-5 | All |
| **TOTAL** | **102** | **24-37** | ~5-7 weeks |

### Recommended Timeline

| Week | Focus |
|------|-------|
| **Week 1** | Phase 1 (Foundation) |
| **Week 2-3** | Phase 2 (Nano Banana Pro) |
| **Week 3-4** | Phase 3 (Veo Advanced) |
| **Week 4-6** | Phase 4 (Creative Tabs: SVG -> Comic -> Voxel) |
| **Week 6-7** | Phase 5 (Integration) + Testing |

### New Package Dependencies

```json
{
  "three": "^0.160.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.92.0",
  "zustand": "^4.4.0"
}
```

---

## 10. File Checklist

### New Files to Create (32)

**Types (4)**
- [ ] `lib/types/nano-banana.ts`
- [ ] `lib/types/veo-advanced.ts`
- [ ] `lib/types/creative-tabs.ts`
- [ ] `lib/types/index.ts`

**API Routes (7)**
- [ ] `app/api/nano-banana/generate/route.ts`
- [ ] `app/api/veo/extend/route.ts`
- [ ] `app/api/veo/interpolate/route.ts`
- [ ] `app/api/svg/generate/route.ts`
- [ ] `app/api/comic/generate-panel/route.ts`
- [ ] `app/api/comic/character/route.ts`
- [ ] `app/api/voxel/generate/route.ts`

**Components (20)**
- [ ] 6x NanoBananaPro components
- [ ] 5x VeoAdvanced components
- [ ] 4x SVGGenerator components
- [ ] 5x ComicCreator components
- [ ] 4x VoxelGenerator components

**Store (1)**
- [ ] `stores/useCreativeStore.ts`

### Files to Modify (6)
- [ ] `app/page.tsx` - Add new mode rendering
- [ ] `components/ui/ModeSelector.tsx` - Add 4 new modes
- [ ] `app/api/veo/generate/route.ts` - Add advanced options
- [ ] `components/ui/ModelSelector.tsx` - Add resolution option
- [ ] `package.json` - Add dependencies
- [ ] `tsconfig.json` - Add path aliases if needed

---

## 11. Agent Consensus & Divergence

### Areas of Agreement (All 3 Agents)
- TypeScript interfaces for type safety
- Phased implementation approach
- Need for Zustand/state management for character consistency
- Three.js for voxel rendering
- API rate limiting concerns need mitigation
- Mode navigation needs redesign for 9 modes

### Key Differences Resolved

| Topic | Codex | Gemini Pro | Sonnet | Resolution |
|-------|-------|------------|--------|------------|
| **Architecture** | Generic client/server | Next.js App Router | Next.js App Router | **Next.js App Router** (matches existing) |
| **State Management** | Custom hooks | Zustand | Zustand | **Zustand** (recommended by 2/3) |
| **Effort Estimate** | 19-23 days | 3-4 weeks | 24-37 days | **24-37 days** (most conservative) |
| **Camera Controls** | API params | Prompt engineering | Prompt engineering | **Prompt engineering** (matches Gemini API) |
| **File Storage** | S3/GCS | Temp storage | Cloud storage | **Temp storage** (simpler for MVP) |

---

**Full synthesized plan**: `plans/extend-story-composer-gemini-3-features.md`
**Documentation**: `aidocs/gemini-3-veo-31-ai-studio-apps-docs.md`
**Agents consulted**: 3 (GPT-5.1 Codex, Gemini 3 Pro, Sonnet 4.5)
