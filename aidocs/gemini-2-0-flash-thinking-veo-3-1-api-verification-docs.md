# Documentation: Gemini 2.0 Flash Thinking Experimental (Nano Banana Pro) and Veo 3.1 API Verification

Last Updated: 2025-11-20

## Search Summary
- **Query**: Gemini 2.0 Flash Thinking Experimental (Nano Banana Pro) and Veo 3.1 API availability verification
- **Scout Scale**: 6
- **Agents Used**: Gemini Flash Light #1, Gemini Flash Light #2, GPT-5.1-Codex-Mini #1, GPT-5.1-Codex-Mini #2
- **URLs Found**: 25+

---

## Key Findings

### Gemini 2.0 Flash Thinking Experimental
- **Status**: Available in experimental preview
- **Model ID**: `gemini-2.0-flash-thinking-exp`
- **Access**: Google AI Studio, Gemini API, Vertex AI
- **Context Window**: 1 million tokens (expanded from initial 32k)
- **Rate Limits**: 2 RPM, 50 RPD (free tier)
- **Configuration**: Uses `ThinkingConfig` parameter with `include_thoughts=True`
- **Thinking Budget**: 0 to 24,576 tokens (configurable)
- **Performance**: 73.3% on AIME2024 math benchmarks
- **Pricing**: Charged for all tokens including reasoning tokens
- **Knowledge Cutoff**: June 2024

**Important Note**: Gemini 2.5 models (Pro and Flash) now integrate thinking capabilities via `thinkingBudget` parameter rather than as a separate variant. This makes advanced reasoning available across the modern model lineup.

### Veo 3.1
- **Status**: Available in paid preview
- **Model IDs**:
  - `veo-3.1-generate-preview` (standard)
  - `veo-3.1-fast-generate-preview` (fast variant)
- **Pricing**:
  - Standard: $0.40/second with audio
  - Fast: $0.15/second with audio
- **Resolution**: 720p/1080p at 24 FPS
- **Duration**: 4-8 seconds per generation
- **Capabilities**:
  - Text-to-video
  - Image-to-video
  - Reference image guidance (up to 3 images)
  - Frame-specific generation
  - Video extension
  - Native audio with conversations
  - Cinematic style understanding
- **Persistence**: Videos persist for 2 days
- **Watermarking**: SynthID watermarking included
- **Regional Restrictions**: EU/UK/CH/MENA have personGeneration restrictions
- **Integration Pattern**: Asynchronous long-running operations with polling (5-second intervals recommended)

### Nano Banana Pro (Gemini 3 Pro Image)
- **Status**: Production-ready (released November 20, 2025)
- **Model ID**: `gemini-2.5-flash-image-preview` (legacy), Gemini 3 Pro Image (latest)
- **Pricing**: ~$0.039 per image (~1,290 tokens)
- **Access**: Google AI Studio, Gemini API, Vertex AI
- **Capabilities**:
  - Advanced image generation
  - Improved text rendering
  - Up to 4K resolution
  - Real-time web grounding (when enabled)
  - Multiple aspect ratio support
- **Use Cases**: Fast prototyping, integration with video workflows, lightweight image generation

### Gemini 3.0 Models (Latest)
- **Release Date**: November 18, 2025
- **Models**: Gemini 3.0 Pro, Gemini 3.0 Deep Think
- **Status**: Replaces Gemini 2.5 Pro and Flash as most powerful models

---

## Documentation Resources

### Official Documentation

#### Gemini Models & API
- **https://ai.google.dev/gemini-api/docs/models** - Complete catalog of all Gemini models with API identifiers, capabilities, and context window specifications
- **https://ai.google.dev/gemini-api/docs/thinking** - Official Gemini thinking mode documentation with ThinkingConfig usage examples and thinking budget control
- **https://ai.google.dev/gemini-api/docs/changelog** - Official release notes and changelog for all Gemini model updates
- **https://ai.google.dev/gemini-api/docs/pricing** - Official Gemini API pricing including Veo 3.1 rates
- **https://ai.google.dev/gemini-api/docs/rate-limits** - Official rate limits documentation for all Gemini models

#### Veo 3.1 Video Generation
- **https://ai.google.dev/gemini-api/docs/video** - Official Veo 3.1 video generation API documentation with code examples in Python, JavaScript, and Go; covers model identifiers, async operation patterns, input modalities (text, images, reference images), and output specifications
- **https://developers.googleblog.com/en/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/** - Official announcement blog detailing Veo 3.1 features including video extension, frame-specific generation, native audio with conversations, and cinematic style understanding
- **https://github.com/google-gemini/veo-3-gemini-api-quickstart** - Official GitHub quickstart repository with practical Next.js examples for Veo 3 video generation
- **https://github.com/google-gemini/veo-3-nano-banana-gemini-api-quickstart** - Official Next.js quickstart repository with complete implementation of video generation, image generation, and image editing workflows

#### Google Cloud & Vertex AI
- **https://cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate-preview** - Vertex AI specific documentation for Veo 3.1 preview access with technical specifications
- **https://cloud.google.com/vertex-ai/generative-ai/docs/thinking** - Google Cloud Vertex AI thinking documentation covering thinking configuration for enterprise deployments
- **https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions** - Model versions and lifecycle documentation for understanding deprecation and update schedules

#### Nano Banana Pro (Gemini 3 Pro Image)
- **https://deepmind.google/models/gemini-image/pro/** - Official model page with features and capabilities
- **https://blog.google/technology/developers/gemini-3-pro-image-developers/** - Developer guide for Nano Banana Pro with API integration details
- **https://developers.googleblog.com/en/gemini-2-5-flash-image-now-ready-for-production-with-new-aspect-ratios/** - Production readiness announcement with aspect ratio support

### Tutorials & Guides
- **https://www.datacamp.com/blog/gemini-2-0-flash-experimental** - Comprehensive DataCamp guide with feature overview, implementation examples, and use cases for Gemini 2.0 Flash Thinking model
- **https://apidog.com/blog/veo-3-1-api/** - Tutorial guide covering Veo 3.1 API usage patterns, request/response formats, and practical implementation examples
- **https://docs.aimlapi.com/api-references/video-models/google/veo-3-1-image-to-video** - Third-party provider documentation for Veo 3.1 image-to-video generation

### Official Announcements
- **https://blog.google/technology/google-deepmind/google-introduces-gemini-2-0-flash-thinking-experimental/** - Official announcement of Gemini 2.0 Flash Thinking Experimental model capabilities

---

## Agent Summaries

### Gemini Flash Light #1
Focused on official API documentation and specifications. Identified comprehensive documentation for Gemini 2.0 Flash Thinking Experimental with detailed coverage of the thinking mode's experimental status, 1M token context window, rate limits (2 RPM / 50 RPD for free tier), and native code execution capabilities. Found extensive Veo 3.1 documentation including model variants, pricing structure, async operation patterns, and API integration patterns. Highlighted Nano Banana (Gemini 2.5 Flash Image) with model ID and pricing details (~$0.039 per image).

### Gemini Flash Light #2
Concentrated on implementation tutorials and best practices. Discovered practical integration guides for Veo 3.1 featuring text-to-video, image-to-video, and reference image guidance patterns. Found comprehensive thinking mode examples showing ThinkingConfig usage with `include_thoughts=True` parameter for accessing reasoning processes. Identified production-ready documentation for Nano Banana with aspect ratio support and real-time web grounding capabilities.

### GPT-5.1-Codex-Mini #1
Searched for enterprise and cloud platform documentation. Located Vertex AI-specific resources for Veo 3.1 preview access with technical specifications for 720p/1080p generation at 24 FPS. Found cloud thinking documentation covering enterprise deployment patterns and thinking budget configuration (0-32,768 tokens or dynamic with -1). Identified Gemini 3.0 models (Pro and Deep Think) as the latest releases replacing Gemini 2.5 variants as the most powerful models.

### GPT-5.1-Codex-Mini #2
Focused on code examples and quickstart repositories. Discovered official GitHub quickstart at `google-gemini/veo-3-nano-banana-gemini-api-quickstart` with Next.js reference implementation demonstrating complete video and image generation workflows. Found examples of proper API polling patterns for long-running operations, state management for async video generation, and integration between Veo 3.1 and Nano Banana for combined video/image workflows. Highlighted SynthID watermarking and 2-day video persistence details.

---

## Implementation Considerations

### Current Codebase Status
Based on the codebase search, Story Composer currently uses:
- **Video**: `veo-3.0-generate-preview`, `veo-3.0-fast-generate-preview`, `veo-2.0-generate-001`
- **Image**: `gemini-2.5-flash-image-preview`, `gemini-2.5-flash-lite`
- **SDK**: `@google/genai` v1.8.0

**No references found to**:
- Gemini 2.0 Flash Thinking Experimental
- Nano Banana Pro (Gemini 3 Pro Image)
- Veo 3.1 models

### Migration Path
1. **Veo 3.0 → Veo 3.1**: Update model IDs from `veo-3.0-generate-preview` to `veo-3.1-generate-preview` and `veo-3.1-fast-generate-preview`
2. **Add Thinking Mode**: Integrate `ThinkingConfig` for reasoning-heavy tasks (experimental preview)
3. **Upgrade Nano Banana**: Update from `gemini-2.5-flash-image-preview` to Gemini 3 Pro Image for 4K support
4. **SDK Version**: Verify `@google/genai` SDK supports new model identifiers (likely requires update)

### Key Files to Update
- `app/api/veo/generate/route.ts` - Update Veo model IDs
- `components/ui/ModelSelector.tsx` - Add new model options to UI
- `services/geminiService.ts` - Add thinking mode configuration support
- `app/api/imagen/generate/route.ts` - Update to Gemini 3 Pro Image
- `package.json` - Update `@google/genai` SDK version
