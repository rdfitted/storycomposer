# Documentation: Gemini 3.0, Nano Banana Pro, Veo 3.1 & AI Studio Apps

Last Updated: 2025-11-22

## Search Summary
- **Query**: Explore Gemini 3.0, Nano Banana Pro, Veo 3.1 new features for extending photo/video features
- **Scout Scale**: 6 (8 agents)
- **Agents Used**: Gemini Flash, Gemini Lite, Codex, Claude Haiku, 2x Gemini Flash Light, 2x GPT-5.1-Codex-Mini

---

## Key Findings

### Gemini 3.0 Pro (Released November 18, 2025)
- Google's most advanced reasoning model with 1M token context window
- Multimodal understanding (text, audio, images, video, PDFs, code)
- New `thinking_level` parameter (low/high) replaces previous `thinking_budget`
- Tops LMArena with 1501 Elo score
- New `media_resolution` parameter (low/medium/high) for vision processing

### Nano Banana Pro / Gemini 3 Pro Image (Released November 20, 2025)
- State-of-the-art image generation model built on Gemini 3 Pro
- **Resolution Support**: 1K, 2K, and 4K visuals (vs 1024x1024 in Nano Banana)
- **Advanced Text Rendering**: Legible, stylized text for infographics, menus, diagrams, marketing
- **Image Blending**: 6 high-fidelity shots or blend up to 14 objects
- **Character Consistency**: Maintain resemblance of up to 5 people
- **Professional Control**: Camera angles, scene lighting, depth of field, focus, color grading
- **Google Search Integration**: Real-time data grounding (weather maps, stock charts, events)
- **Multilingual Support**: Generate/localize text in multiple languages
- **Pricing**: $0.24 for 4K, $0.134 for 1K/2K
- **Model ID**: `gemini-3-pro-image-preview`

### Veo 3.1 (Released October 15, 2025)
- **Duration**: 4, 6, or 8 seconds (8s required for advanced features)
- **Resolution**: 720p (default) or 1080p (8-second videos only)
- **Native Audio**: Rich audio generation with natural conversations and synchronized SFX
- **Aspect Ratios**: 16:9 (landscape) and 9:16 (portrait)
- **Model Variants**: `veo-3.1` and `veo-3.1-fast`
- **Pricing**: $0.15/second (Fast), $0.40/second (Standard)

#### Veo 3.1 Advanced Features
1. **Image-to-Video**: Transform static images into videos, initial image as first frame
2. **First & Last Frame Direction**: Specify start and end frames for precise shot composition
3. **Reference Images**: Up to 3 reference images for subject preservation
4. **Video Extension**: Extend by 7 seconds, up to 20 times (max 148 seconds total)
5. **Character Consistency**: Maintain appearance across multiple scenes

---

## Google AI Studio Example Apps (Target Features)

Based on app names and Gemini capabilities, here's what each likely demonstrates:

### Creative Generation Apps
| App | Likely Capability | Relevance to Story Composer |
|-----|-------------------|----------------------------|
| **research_visualization** | Data → visual infographics | New tab: Data Visualization |
| **lumina** | Lighting/ambiance generation | Enhance: Photo Editor lighting controls |
| **aura_quiet_living** | Interior/lifestyle scene generation | Enhance: HomeCanvas scene types |
| **product_mockup** | Product placement/mockups | Already have: HomeCanvas (Product Placement) |
| **personalized_comics** | Multi-panel comic generation | New tab: Comic/Storyboard Creator |
| **svg_generator** | Vector graphics from prompts | New feature: SVG export option |

### 3D & Gaming Apps
| App | Likely Capability | Relevance to Story Composer |
|-----|-------------------|----------------------------|
| **voxel_toy_box** | Image → voxel 3D models | New tab: 3D Voxel Generator |
| **image_to_voxel** | Convert images to voxel art | Integrate into voxel tab |
| **sky_metropolis** | City/architectural generation | Enhance: Scene generation presets |
| **shader_pilot** | GLSL shader generation | New feature: Video effects/shaders |
| **gemini_runner** | Interactive game generation | Research: Real-time generation |
| **tempo_strike** | Music/rhythm synchronized content | New feature: Audio-synced video |

### Utility Apps
| App | Likely Capability | Relevance to Story Composer |
|-----|-------------------|----------------------------|
| **info_genius** | Information extraction/summarization | Enhance: Image analysis features |

---

## Documentation Resources

### Official Google Documentation
- https://ai.google.dev/gemini-api/docs/gemini-3 - Gemini 3 Developer Guide
- https://ai.google.dev/gemini-api/docs/models - Gemini Models Overview
- https://ai.google.dev/gemini-api/docs/video - Veo 3.1 Video Generation
- https://ai.google.dev/gemini-api/docs/image-generation - Image Generation Guide
- https://ai.google.dev/gemini-api/docs/changelog - API Release Notes
- https://cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate - Vertex AI Veo Docs

### Google Blog Announcements
- https://blog.google/technology/ai/nano-banana-pro/ - Nano Banana Pro Launch
- https://blog.google/technology/developers/gemini-3-pro-image-developers/ - Developer Guide
- https://developers.googleblog.com/en/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/ - Veo 3.1 Announcement
- https://blog.google/technology/ai/veo-updates-flow/ - Veo Updates in Flow

### Third-Party Resources
- https://simonwillison.net/2025/Nov/20/nano-banana-pro/ - Best image generation model review
- https://techcrunch.com/2025/11/20/google-releases-nano-banana-pro/ - TechCrunch coverage

### Integration Examples
- https://github.com/google-gemini/gemini-image-editing-nextjs-quickstart - Next.js Image Editing
- https://blog.adobe.com/en/publish/2025/11/20/google-gemini-3-nano-banana-pro-firefly-photoshop - Adobe Integration

---

## Current Story Composer Architecture

### Existing Modes
1. **Photo Editor** - Multi-image chat with up to 50 reference images
2. **AI Editor** - Point-and-click retouching, filters, adjustments, crop
3. **Home Canvas** - Product placement with semantic positioning
4. **Single Video** - Text-to-video and image-to-video with Veo
5. **Storyboard** - Multi-scene video project management

### Current Model Usage
- **Image Generation**: `gemini-3-pro-image-preview` (Nano Banana Pro)
- **Scene Analysis**: `gemini-3-pro-preview`
- **Video Generation**: `veo-3.1-generate-preview`, `veo-3.1-fast-generate-preview`, `veo-2.0-generate-001`

### Key Files
- `services/geminiService.ts` - Composite image generation with semantic positioning
- `components/ui/ModelSelector.tsx` - Video model selection (Veo 3.1, Fast, 2.0)
- `components/ui/AIEditor.tsx` - AI-powered photo editing with history
- `components/ui/HomeCanvas.tsx` - Product placement interface
- `app/page.tsx` - Main app with mode switching and video polling

---

## Feature Extension Opportunities

### High Priority (Leverage New Capabilities)

1. **Upgrade to Nano Banana Pro (4K)**
   - Add resolution selector (1K/2K/4K) to image generation
   - Implement text rendering feature for marketing assets
   - Add camera control parameters (angles, DOF, lighting)

2. **Veo 3.1 Advanced Features**
   - First/Last Frame Direction UI
   - Reference image upload (up to 3)
   - Video extension capability
   - 1080p resolution option
   - Portrait (9:16) aspect ratio support

3. **Character/Subject Consistency**
   - Maintain character appearance across video scenes
   - Multi-image blending for consistent subjects

### Medium Priority (New Tabs/Features)

4. **SVG Generator Tab**
   - Text-to-SVG generation
   - Logo and icon creation
   - Vector export for scalable graphics

5. **Comic/Storyboard Creator**
   - Multi-panel comic generation
   - Consistent character styles
   - Speech bubble and text integration

6. **3D Voxel Generator**
   - Image-to-voxel conversion
   - Voxel art style generation
   - Export options for 3D formats

### Lower Priority (Experimental)

7. **Shader/Effects Generator**
   - GLSL shader generation from descriptions
   - Apply real-time effects to videos
   - WebGL integration

8. **Data Visualization**
   - Generate infographics from data
   - Chart and diagram creation
   - Research visualization tools

---

## API Parameter Updates Needed

### Image Generation (Nano Banana Pro)
```typescript
// New parameters to add
{
  model: 'gemini-3-pro-image-preview',
  resolution: '1k' | '2k' | '4k',  // NEW
  cameraControl: {  // NEW
    angle: string,
    depthOfField: string,
    lighting: string,
    colorGrading: string
  },
  textRendering: boolean,  // NEW
  searchGrounding: boolean,  // NEW
  blendImages: File[],  // NEW (up to 14)
  characterConsistency: File[]  // NEW (up to 5 people)
}
```

### Video Generation (Veo 3.1)
```typescript
// New parameters to add
{
  model: 'veo-3.1-generate-preview',
  image: File,  // First frame (existing)
  lastFrame: File,  // NEW - End frame
  referenceImages: File[],  // NEW - Up to 3
  video: File,  // NEW - For extension
  resolution: '720p' | '1080p',  // NEW
  durationSeconds: 4 | 6 | 8,  // NEW
  personGeneration: 'allow' | 'block'  // NEW
}
```

---

## Agent Summaries

### Gemini Flash (Codebase)
Found 19 relevant files including all API routes, services, and UI components for video/image generation.

### Gemini Lite (Codebase)
Identified model selector, photo editor, and creative UI components with line ranges for editing.

### Codex (Codebase)
Located existing documentation in aidocs folder including previous Gemini 3/Veo 3.1 research.

### Claude Haiku (Codebase)
Comprehensive file list with API routes, services, and all editor components.

### Documentation Scouts
Gathered extensive documentation on Nano Banana Pro capabilities, Veo 3.1 features, and integration patterns from official Google sources and third-party reviews.
