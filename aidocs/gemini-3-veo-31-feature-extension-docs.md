# Documentation: Gemini 3 Nano Banana Pro and Veo 3.1 Feature Extension

Last Updated: 2025-11-22

## Search Summary
- **Query**: Extend Story Composer with Gemini 3 Nano Banana Pro and Veo 3.1 features
- **Scout Scale**: 6 (8 agents)
- **Agents Used**: Gemini Flash, Gemini Lite, Codex, Claude Haiku, 2x Gemini Flash Light, 2x GPT-5.1-Codex-Mini

---

## Key Findings

### Gemini 3 Pro Image (Nano Banana Pro) Capabilities

| Feature | Details |
|---------|---------|
| **Multi-Image Blending** | Up to 14 reference images for complex composition |
| **Resolution Output** | 1K, 2K, and 4K image generation |
| **Text Rendering** | Advanced text in images - taglines, paragraphs, multilingual |
| **Person Consistency** | Maintain resemblance of up to 5 people across images |
| **Google Search Grounding** | Real-time data for infographics, weather, stocks |
| **Response Modalities** | Configure `responseModalities: ['TEXT', 'IMAGE']` |

### Veo 3.1 Video Generation Capabilities

| Feature | Details |
|---------|---------|
| **Reference Images** | Up to 3 images for character/style consistency |
| **Frames-to-Video** | First and last frame → smooth transition video |
| **Scene Extension** | Continue videos using last 24 frames |
| **Native Audio** | Synchronized dialogue, ambient, effects in single pass |
| **Resolution** | 720p or 1080p at 24 FPS |
| **Duration** | 4, 6, or 8 seconds per generation |
| **Aspect Ratios** | 16:9 (landscape) or 9:16 (portrait) |

### Google AI Studio Demo Apps (Reference)

1. **Product Mockup** - Logos + products → mockup designs with reference images
2. **Personalized Comics** - Photos + genre → multi-page comic books
3. **Infographics Generator** - Topics → data-grounded visual explanations
4. **Voxel Toy Box** - 3D voxel art generation (via code generation)
5. **SVG Generator** - Text → SVG graphics (via code generation, not native)

### Key Limitations Discovered

- **SVG Generation**: Not native to Gemini API - achieved via code generation
- **Image-to-Voxel**: Achieved via Three.js/code generation, not native API
- **Style Reference for Veo**: Use `veo-2.0-generate-exp` for style images (not 3.1)
- **Scene Extension Voice**: Cannot extend voice if not in last 1 second

---

## Documentation Resources

### Official Gemini API
- **https://ai.google.dev/gemini-api/docs/image-generation** - Nano Banana image generation
- **https://ai.google.dev/gemini-api/docs/video** - Veo 3.1 video generation
- **https://ai.google.dev/gemini-api/docs/models/gemini** - Model specifications

### Vertex AI Enterprise
- **https://cloud.google.com/vertex-ai/generative-ai/docs** - Enterprise documentation
- **https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images** - Image resolution settings

### Developer Blogs & Announcements
- **https://blog.google/technology/developers/gemini-3-pro-image-developers/** - Nano Banana Pro announcement
- **https://developers.googleblog.com/en/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/** - Veo 3.1 features
- **https://developers.googleblog.com/en/veo-3-fast-image-to-video-capabilities-now-available-gemini-api/** - Veo 3 Fast

### Implementation References
- **https://github.com/google-gemini/cookbook** - Official examples and notebooks
- **https://github.com/google-gemini/starter-applets** - Starter app source code
- **https://dev.to/googleai/build-with-nano-banana-pro-our-gemini-3-pro-image-model-4gj7** - Developer guide

### Next.js Integration
- **https://ai.google.dev/gemini-api/docs/quickstart** - Quickstart guide
- **https://www.npmjs.com/package/react-images-uploading** - Multi-image upload
- **https://primereact.org/fileupload/** - Advanced file upload component

---

## Codebase Files Identified (Consensus from 4 Agents)

### Core Architecture
- `app/page.tsx` - Main VeoStudio component, mode selection
- `components/ui/ModeSelector.tsx` - Tab switching between modes

### Photo Editor Mode
- `components/ui/PhotoEditor.tsx` - Main photo editor
- `components/ui/PhotoEditorComposer.tsx` - Input interface
- `app/api/photo-editor/generate/route.ts` - API route

### AI Editor Mode
- `components/ui/AIEditor.tsx` - Main AI editor
- `components/ui/AIEditorCanvas.tsx` - Canvas component
- `components/ui/AIEditorTabs.tsx` - Tab interface
- `app/api/ai-editor/edit/route.ts` - API route

### Home Canvas Mode
- `components/ui/HomeCanvas.tsx` - Product placement canvas
- `app/api/home-canvas/generate/route.ts` - API route

### Video Generation
- `components/ui/VideoPlayer.tsx` - Player with trimming
- `components/ui/Composer.tsx` - Video input interface
- `components/ui/StoryboardComposer.tsx` - Multi-scene interface
- `app/api/veo/generate/route.ts` - Veo generation
- `app/api/veo/operation/route.ts` - Polling route

### Supporting Components
- `components/ui/ImageUploader.tsx` - Upload handling
- `components/ui/ImageGallery.tsx` - Multi-image display
- `components/ui/AspectRatioSelector.tsx` - Resolution settings
- `services/geminiService.ts` - Central Gemini service

---

## Feature Mapping to Existing Architecture

| New Feature | Existing Mode to Extend | New Mode? |
|-------------|------------------------|-----------|
| Multi-image blending (14 refs) | Photo Editor | Extend |
| 4K resolution output | All image modes | Extend |
| Advanced text rendering | Photo Editor / AI Editor | Extend |
| SVG generation | - | **New Tab** |
| Image-to-voxel 3D | - | **New Tab** |
| Personalized comics | - | **New Tab** |
| Video reference images | Single Video / Storyboard | Extend |
| Frames-to-video | - | **New Tab** or Storyboard |
| Scene extension | Storyboard | Extend |
