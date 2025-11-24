# Documentation: Update modules to use latest Gemini 3.0 models

Last Updated: 2025-11-22

## Search Summary
- **Query**: Update modules to use latest Gemini 3.0 models
- **Scout Scale**: 6 (8 agents)
- **Agents Used**: Gemini Flash, Gemini Lite, Codex, Claude Haiku, 2x Gemini Flash Light, 2x GPT-5.1-Codex-Mini
- **URLs Found**: 20+

---

## Key Findings

### Model Name Updates Required
| Current Model | New Model | Purpose |
|---------------|-----------|---------|
| `gemini-2.5-flash-image-preview` | `gemini-3-pro-image-preview` | Image generation/editing |
| `gemini-2.5-flash-lite` | `gemini-2.5-flash` or `gemini-3-pro-preview` | Text/reasoning |
| `veo-3.0-generate-preview` | `veo-3.1-generate-preview` | Video generation |

### Critical Migration Notes
- **Temperature**: Must remain at 1.0 (lowering causes looping issues)
- **Thinking Parameter**: `thinking_budget` replaced by `thinking_level` (values: "low" or "high")
- **Image Generation**: MUST set `responseModalities: ['TEXT', 'IMAGE']` - image-only output not supported
- **SDK Requirement**: Upgrade `@google/genai` to v1.51.0+ for Gemini 3 features
- **Deprecation**: `gemini-2.5-flash-image-preview` retired October 31, 2025

### New Capabilities
- **Gemini 3 Pro Image**: 1K/2K/4K resolution, up to 14 reference images, human consistency
- **Veo 3.1**: 8-second 720p/1080p video, native audio, video extension, up to 3 reference images

---

## Documentation Resources

### Official Documentation
- **https://ai.google.dev/gemini-api/docs/gemini-3** - Official Gemini 3 Developer Guide
- **https://ai.google.dev/gemini-api/docs/models** - Complete Gemini models reference
- **https://ai.google.dev/gemini-api/docs/image-generation** - Image generation guide (Nano Banana)
- **https://ai.google.dev/gemini-api/docs/video** - Veo 3.1 video generation API

### Vertex AI Documentation
- **https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-pro** - Gemini 3 Pro
- **https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-pro-image** - Gemini 3 Pro Image
- **https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/get-started-with-gemini-3** - Getting started

### SDK & Libraries
- **https://www.npmjs.com/package/@google/genai** - Official npm package (v1.30.0+)
- **https://github.com/googleapis/js-genai** - TypeScript/JavaScript SDK source
- **https://ai.google.dev/gemini-api/docs/libraries** - Official client libraries

### Announcements & Blogs
- **https://blog.google/technology/developers/gemini-3-developers/** - Gemini 3 announcement
- **https://blog.google/technology/developers/gemini-3-pro-image-developers/** - Nano Banana Pro
- **https://developers.googleblog.com/en/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/** - Veo 3.1

---

## Codebase Files to Update

### Priority Files (Found by 4 agents)
1. `services/geminiService.ts` - Central model configuration
2. `app/api/ai-editor/edit/route.ts` - AI editor image generation
3. `app/api/home-canvas/generate/route.ts` - Home canvas generation
4. `app/api/photo-editor/generate/route.ts` - Photo editor generation
5. `app/api/imagen/generate/route.ts` - Imagen API route
6. `app/api/veo/generate/route.ts` - Veo video generation

### Secondary Files (Found by 2-3 agents)
7. `app/api/veo/operation/route.ts` - Veo operation polling
8. `app/api/veo/download/route.ts` - Video download handler
9. `app/page.tsx` - Main application (model defaults)
10. `components/ui/ModelSelector.tsx` - Model selection UI
11. `components/ui/Composer.tsx` - Input composer
12. `components/ui/PhotoEditor.tsx` - Photo editor component
