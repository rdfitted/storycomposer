# Story Composer: Veo 3.1 & Gemini Thinking Mode Implementation Plan

---
**Plan Metadata**
- **Generated**: 2025-11-20
- **Planning Agents**: GPT-5.1 Codex, Gemini 2.5 Pro, Claude Sonnet 4.5
- **Documentation Referenced**: `aidocs/gemini-2-0-flash-thinking-veo-3-1-api-verification-docs.md`
- **Synthesis Approach**: Combined best elements from all 3 agent plans with focus on production readiness and cost optimization

**Agent Contributions:**
- **Codex**: Detailed file-level implementation steps, SDK integration patterns, thinking orchestrator architecture
- **Gemini Pro**: Comprehensive architecture design, risk mitigation strategies, phased rollout approach
- **Sonnet**: Cost-quality trade-off analysis, model selection strategy, regional compliance considerations
---

## Overview

This plan outlines the comprehensive upgrade of Story Composer from Veo 3.0 to **Veo 3.1**, integration of **Gemini 2.0 Flash Thinking Experimental** for creative reasoning tasks, and migration to **Gemini 3 Pro Image** (Nano Banana Pro) across all three creative modes: **Photo Editor** (50 reference images), **Single Video** (text/image-to-video), and **Storyboard** (multi-scene projects).

### Key Objectives
1. **Video Quality Enhancement**: Migrate to Veo 3.1 with dual variants (standard $0.40/sec, fast $0.15/sec)
2. **Intelligent Creative Assistance**: Deploy thinking mode for prompt optimization, storyboard coherence, and composition reasoning
3. **Image Generation Upgrade**: Leverage Gemini 3 Pro Image for 4K resolution and improved text rendering
4. **Cost Optimization**: Smart model selection per creative mode to balance quality and cost
5. **Production Readiness**: Feature flags, fallback mechanisms, and gradual rollout strategy

### Impact Summary
- **Photo Editor**: Enhanced multi-image composition with up to 50 references and thinking-powered analysis
- **Single Video**: Improved video quality with intelligent prompt refinement
- **Storyboard**: Multi-scene coherence validation and narrative flow optimization
- **Cost Structure**: Dynamic model selection optimizes cost-to-quality ratio per use case

---

## Requirements

### Functional Requirements

#### FR1: Veo 3.1 Video Generation
- **FR1.1**: Support two Veo 3.1 model variants:
  - `veo-3.1-generate-preview` (standard quality, $0.40/second with audio)
  - `veo-3.1-fast-generate-preview` (rapid iteration, $0.15/second with audio)
- **FR1.2**: Enable text-to-video generation with enhanced cinematic understanding
- **FR1.3**: Enable image-to-video generation with up to 3 reference images
- **FR1.4**: Support video extension and frame-specific generation capabilities
- **FR1.5**: Maintain 720p/1080p output at 24 FPS for 4-8 second videos
- **FR1.6**: Preserve SynthID watermarking and 2-day video persistence

#### FR2: Gemini 2.0 Flash Thinking Integration
- **FR2.1**: Implement thinking mode with configurable budget (0-24,576 tokens)
- **FR2.2**: **Prompt Optimization**: Analyze and enhance user prompts for clarity and visual detail
- **FR2.3**: **Storyboard Coherence**: Validate multi-scene narrative flow and continuity
- **FR2.4**: **Composition Reasoning**: Analyze multiple reference images for creative guidance
- **FR2.5**: Display thinking process and optimization suggestions to users
- **FR2.6**: Handle experimental API rate limits (2 RPM / 50 RPD free tier)

#### FR3: Gemini 3 Pro Image Integration
- **FR3.1**: Migrate from `gemini-2.5-flash-image-preview` to Gemini 3 Pro Image
- **FR3.2**: Support 4K resolution image generation with fallback to 1080p
- **FR3.3**: Enable multiple aspect ratios (1:1, 16:9, 3:2, 4:3)
- **FR3.4**: Leverage improved text rendering capabilities
- **FR3.5**: Optional real-time web grounding for enhanced results

#### FR4: Creative Mode Enhancements
- **FR4.1 Photo Editor**:
  - Handle up to 50 reference images per session
  - Thinking mode for composition analysis and enhancement suggestions
  - Gemini 3 Pro Image for final generation
- **FR4.2 Single Video**:
  - Text/image-to-video with Veo 3.1
  - Optional thinking mode for complex prompt optimization
  - Smart model selection (fast for preview, standard for final)
- **FR4.3 Storyboard**:
  - Multi-scene planning with thinking-powered coherence validation
  - Scene-by-scene model selection (Gemini 3 for stills, Veo 3.1 for video)
  - Transition and continuity verification

### Non-Functional Requirements

#### NFR1: Performance
- **NFR1.1**: Thinking mode overhead <3 seconds for prompt optimization
- **NFR1.2**: Veo 3.1 fast variant generates preview in <15 seconds (4-sec video)
- **NFR1.3**: Maintain 5-second polling interval for async operations
- **NFR1.4**: Support concurrent multi-scene storyboard generation

#### NFR2: Cost Management
- **NFR2.1**: Implement cost estimation before generation
- **NFR2.2**: Track token usage (prompt + thinking + generation)
- **NFR2.3**: Enable cost analytics per creative mode and user
- **NFR2.4**: Optimize thinking budget allocation per task complexity

#### NFR3: API Compatibility
- **NFR3.1**: Upgrade to `@google/genai` SDK version supporting Veo 3.1
- **NFR3.2**: Implement robust error handling for experimental APIs
- **NFR3.3**: Handle regional restrictions (EU/UK/CH/MENA personGeneration limits)
- **NFR3.4**: Support content safety filtering and error recovery

#### NFR4: Reliability & Rollout
- **NFR4.1**: Feature flags for gradual enablement (thinking mode, new models)
- **NFR4.2**: Fallback to Veo 3.0 and Gemini 2.5 if new models unavailable
- **NFR4.3**: Comprehensive telemetry and error logging
- **NFR4.4**: Zero-downtime deployment strategy

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Story Composer (Next.js)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Photo Editor │  │ Single Video │  │  Storyboard  │         │
│  │   (50 refs)  │  │  (text/img)  │  │ (multi-scene)│         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │   Composer UI   │                          │
│                    │  + ModelSelector│                          │
│                    │  + ThinkingToggle│                         │
│                    └───────┬─────────┘                          │
│                            │                                     │
├────────────────────────────┼─────────────────────────────────────┤
│                    API Layer (app/api/)                         │
│         ┌──────────────────┼──────────────────┐                │
│         │                  │                  │                 │
│   ┌─────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐          │
│   │   /veo    │    │   /gemini   │    │  /imagen  │          │
│   │ /generate │    │   /think    │    │ /generate │          │
│   │ /operation│    │  /optimize  │    └───────────┘          │
│   └─────┬─────┘    └──────┬──────┘                            │
│         │                  │                                    │
├─────────┼──────────────────┼────────────────────────────────────┤
│    Service Layer (services/)                                   │
│         │                  │                                    │
│   ┌─────▼─────┐    ┌──────▼──────┐    ┌───────────┐          │
│   │veoService │    │thinkingService│   │imageService│          │
│   │           │    │               │   │           │          │
│   │- Veo 3.1  │    │- Gemini 2.0   │   │- Gemini 3 │          │
│   │  standard │    │  Thinking Exp │   │  Pro Image│          │
│   │- Veo 3.1  │    │- Budget mgmt  │   │- 4K support│         │
│   │  fast     │    │- Task routing │   │- Multi AR │          │
│   └─────┬─────┘    └──────┬──────┘    └─────┬─────┘          │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │geminiService.ts│                           │
│                    │ (Unified SDK)  │                           │
│                    └───────┬────────┘                           │
│                            │                                     │
├────────────────────────────┼─────────────────────────────────────┤
│                   @google/genai SDK                             │
│         ┌──────────────────┼──────────────────┐                │
│         │                  │                  │                 │
│   ┌─────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐          │
│   │  Veo 3.1  │    │Gemini 2.0   │    │Gemini 3   │          │
│   │   Models  │    │Flash Thinking│   │Pro Image  │          │
│   └───────────┘    └─────────────┘    └───────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### 1. Thinking Orchestrator (`services/thinking/thinkingOrchestrator.ts`)

**Purpose**: Centralized thinking mode coordination for all creative tasks

```typescript
interface ThinkingConfig {
  enabled: boolean;
  budget: number; // 0-24576 tokens
  taskType: 'prompt-optimization' | 'coherence-analysis' | 'composition-reasoning';
  mode: 'photo-editor' | 'single-video' | 'storyboard';
  includeThoughts: boolean; // Show reasoning process
}

interface ThinkingResult {
  originalPrompt: string;
  optimizedPrompt?: string;
  coherenceScore?: number;
  compositionSuggestions?: string[];
  reasoningProcess?: string;
  tokensUsed: number;
  costEstimate: number;
}

class ThinkingOrchestrator {
  async optimizePrompt(prompt: string, context: CreativeContext): Promise<ThinkingResult>;
  async analyzeStoryboardCoherence(scenes: Scene[]): Promise<ThinkingResult>;
  async reasonAboutComposition(images: Image[], prompt: string): Promise<ThinkingResult>;
}
```

#### 2. Model Selection Strategy

**Decision Logic per Creative Mode**:

| Creative Mode | Primary Model | Thinking Budget | Rationale |
|---|---|---|---|
| **Photo Editor** (preview) | Veo 3.1 Fast | 12,000 tokens | Rapid iteration with composition reasoning |
| **Photo Editor** (final) | Gemini 3 Pro Image | 8,000 tokens | High quality with multi-image analysis |
| **Single Video** (preview) | Veo 3.1 Fast | 8,000 tokens | Quick prototyping with prompt refinement |
| **Single Video** (final) | Veo 3.1 Standard | 10,000 tokens | Premium quality with optimization |
| **Storyboard** (all scenes) | Veo 3.1 Standard | 14,000 tokens | Coherence critical for multi-scene flow |

**Implementation**:
```typescript
function selectModel(mode: CreativeMode, quality: 'preview' | 'final'): ModelConfig {
  const matrix = {
    'photo-editor': {
      preview: { model: 'veo-3.1-fast-generate-preview', thinkingBudget: 12000 },
      final: { model: 'gemini-3-pro-image', thinkingBudget: 8000 }
    },
    'single-video': {
      preview: { model: 'veo-3.1-fast-generate-preview', thinkingBudget: 8000 },
      final: { model: 'veo-3.1-generate-preview', thinkingBudget: 10000 }
    },
    'storyboard': {
      preview: { model: 'veo-3.1-generate-preview', thinkingBudget: 14000 },
      final: { model: 'veo-3.1-generate-preview', thinkingBudget: 14000 }
    }
  };
  return matrix[mode][quality];
}
```

#### 3. Data Flow Patterns

**Thinking-Enhanced Generation Flow**:
```
1. User Input → Composer Component
2. IF thinking enabled:
   ├── Call ThinkingOrchestrator
   ├── Display optimization suggestions
   ├── User confirms/modifies
   └── Proceed with optimized prompt
3. Model Selection (fast vs standard)
4. API Route → Service Layer
5. @google/genai SDK Call
6. Async Operation Polling (5-sec interval)
7. Result → VideoPlayer + Metadata Display
```

---

## Implementation Steps

### Phase 1: Foundation & SDK Updates (Weeks 1-2)

#### Step 1.1: Dependency Upgrade
**Files**: `package.json`, `package-lock.json`

```bash
npm update @google/genai@latest
npm install --save-dev @types/google-genai@latest
npm audit fix --force
```

**Verification**:
- Confirm SDK supports `veo-3.1-generate-preview` model IDs
- Test ThinkingConfig parameter compatibility
- Validate TypeScript type definitions

#### Step 1.2: Environment Configuration
**Files**: `.env.example`, `.env.development`, `.env.production`

Add new environment variables:
```env
# Veo 3.1 Models
VEO_31_STANDARD=veo-3.1-generate-preview
VEO_31_FAST=veo-3.1-fast-generate-preview

# Gemini Thinking
GEMINI_THINKING_MODEL=gemini-2.0-flash-thinking-exp
GEMINI_THINKING_DEFAULT_BUDGET=10000

# Gemini 3 Pro Image
GEMINI_3_PRO_IMAGE=gemini-3-pro-image
GEMINI_3_IMAGE_RESOLUTION=high

# Feature Flags
ENABLE_THINKING_MODE=false
ENABLE_VEO_31=false
ENABLE_GEMINI_3_IMAGE=false

# Rate Limits
THINKING_RATE_LIMIT_RPM=2
THINKING_RATE_LIMIT_RPD=50
```

#### Step 1.3: Model Configuration
**Files**: `config/models.ts`

```typescript
export const MODEL_CONFIG = {
  video: {
    veo30: 'veo-3.0-generate-preview',
    veo30fast: 'veo-3.0-fast-generate-preview',
    veo31: process.env.VEO_31_STANDARD,
    veo31fast: process.env.VEO_31_FAST,
  },
  image: {
    gemini25flash: 'gemini-2.5-flash-image-preview',
    gemini3pro: process.env.GEMINI_3_PRO_IMAGE,
  },
  thinking: {
    experimental: process.env.GEMINI_THINKING_MODEL,
    defaultBudget: parseInt(process.env.GEMINI_THINKING_DEFAULT_BUDGET || '10000'),
  },
  fallback: {
    video: 'veo-3.0-generate-preview',
    image: 'gemini-2.5-flash-image-preview',
  }
};
```

### Phase 2: Service Layer Implementation (Weeks 2-3)

#### Step 2.1: Thinking Service
**New File**: `services/thinking/thinkingOrchestrator.ts`

```typescript
import { GoogleGenerativeAI } from '@google/genai';
import { MODEL_CONFIG } from '@/config/models';

interface ThinkingConfig {
  enabled: boolean;
  budget: number;
  taskType: 'prompt-optimization' | 'coherence-analysis' | 'composition-reasoning';
  mode: 'photo-editor' | 'single-video' | 'storyboard';
  includeThoughts: boolean;
}

interface ThinkingResult {
  originalPrompt: string;
  optimizedPrompt?: string;
  coherenceScore?: number;
  compositionSuggestions?: string[];
  reasoningProcess?: string;
  tokensUsed: number;
  costEstimate: number;
}

export class ThinkingOrchestrator {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async optimizePrompt(
    prompt: string,
    context: { mode: string; referenceImages?: number }
  ): Promise<ThinkingResult> {
    const model = this.genAI.getGenerativeModel({
      model: MODEL_CONFIG.thinking.experimental,
    });

    const systemPrompt = `You are a creative prompt optimization expert. Analyze and enhance the user's prompt for ${context.mode} mode. Focus on:
    - Visual clarity and detail
    - Cinematic elements (lighting, composition, camera angles)
    - Emotional tone and atmosphere
    ${context.referenceImages ? `- Integration with ${context.referenceImages} reference images` : ''}

    Return ONLY the optimized prompt, nothing else.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nOriginal prompt: ${prompt}` }] }],
      generationConfig: {
        thinkingConfig: {
          enabled: true,
          budget: MODEL_CONFIG.thinking.defaultBudget,
        }
      }
    });

    const response = result.response;
    const optimizedPrompt = response.text();
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

    return {
      originalPrompt: prompt,
      optimizedPrompt,
      tokensUsed,
      costEstimate: this.calculateCost(tokensUsed),
    };
  }

  async analyzeStoryboardCoherence(scenes: Scene[]): Promise<ThinkingResult> {
    // Implementation for storyboard coherence analysis
    const model = this.genAI.getGenerativeModel({
      model: MODEL_CONFIG.thinking.experimental,
    });

    const scenesText = scenes.map((s, i) => `Scene ${i+1}: ${s.prompt}`).join('\n');
    const systemPrompt = `Analyze this storyboard for narrative coherence, visual continuity, and pacing. Provide:
    1. Coherence score (0-100)
    2. Continuity issues
    3. Pacing recommendations
    4. Transition suggestions`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${scenesText}` }] }],
      generationConfig: {
        thinkingConfig: {
          enabled: true,
          budget: 14000, // Higher budget for complex multi-scene analysis
        }
      }
    });

    const response = result.response;
    const analysis = response.text();

    // Parse coherence score from response
    const coherenceMatch = analysis.match(/score[:\s]*(\d+)/i);
    const coherenceScore = coherenceMatch ? parseInt(coherenceMatch[1]) : 0;

    return {
      originalPrompt: scenesText,
      coherenceScore,
      reasoningProcess: analysis,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      costEstimate: this.calculateCost(response.usageMetadata?.totalTokenCount || 0),
    };
  }

  async reasonAboutComposition(images: Image[], prompt: string): Promise<ThinkingResult> {
    // Implementation for multi-image composition reasoning
    const model = this.genAI.getGenerativeModel({
      model: MODEL_CONFIG.thinking.experimental,
    });

    const systemPrompt = `Analyze ${images.length} reference images and provide composition guidance for: "${prompt}"

    Consider:
    - Common visual themes and elements
    - Suggested composition techniques
    - How to blend or synthesize these references
    - Style consistency recommendations`;

    const parts = [
      { text: systemPrompt },
      ...images.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.base64Data } }))
    ];

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        thinkingConfig: {
          enabled: true,
          budget: 12000,
        }
      }
    });

    const response = result.response;
    const suggestions = response.text().split('\n').filter(s => s.trim());

    return {
      originalPrompt: prompt,
      compositionSuggestions: suggestions,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      costEstimate: this.calculateCost(response.usageMetadata?.totalTokenCount || 0),
    };
  }

  private calculateCost(tokens: number): number {
    // Approximate cost calculation (thinking tokens are billable)
    const costPerMillion = 1.0; // Placeholder - adjust based on actual pricing
    return (tokens / 1_000_000) * costPerMillion;
  }
}
```

#### Step 2.2: Update Veo Service
**File**: `services/veoService.ts`

```typescript
import { GoogleGenerativeAI } from '@google/genai';
import { MODEL_CONFIG } from '@/config/models';

export interface VideoGenerationRequest {
  prompt: string;
  referenceImages?: string[]; // Up to 3 for Veo 3.1
  quality: 'preview' | 'final';
  mode: 'photo-editor' | 'single-video' | 'storyboard';
}

export class VeoService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generateVideo(request: VideoGenerationRequest): Promise<string> {
    const modelId = this.selectModel(request.quality);
    const model = this.genAI.getGenerativeModel({ model: modelId });

    const parts = [{ text: request.prompt }];

    // Add reference images if provided (max 3 for Veo 3.1)
    if (request.referenceImages && request.referenceImages.length > 0) {
      const imagesParts = request.referenceImages.slice(0, 3).map(img => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: img,
        }
      }));
      parts.push(...imagesParts);
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
    });

    // Return operation ID for polling
    return result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private selectModel(quality: 'preview' | 'final'): string {
    if (process.env.ENABLE_VEO_31 === 'true') {
      return quality === 'preview'
        ? MODEL_CONFIG.video.veo31fast
        : MODEL_CONFIG.video.veo31;
    }
    // Fallback to Veo 3.0
    return quality === 'preview'
      ? MODEL_CONFIG.video.veo30fast
      : MODEL_CONFIG.video.veo30;
  }
}
```

#### Step 2.3: Update Image Service
**File**: `services/imageService.ts`

```typescript
import { GoogleGenerativeAI } from '@google/genai';
import { MODEL_CONFIG } from '@/config/models';

export interface ImageGenerationRequest {
  prompt: string;
  referenceImages?: string[]; // Up to 50 for Photo Editor
  resolution: 'high' | 'ultra'; // ultra = 4K
  aspectRatio: '1:1' | '16:9' | '3:2' | '4:3';
}

export class ImageService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generateImage(request: ImageGenerationRequest): Promise<string> {
    const modelId = process.env.ENABLE_GEMINI_3_IMAGE === 'true'
      ? MODEL_CONFIG.image.gemini3pro
      : MODEL_CONFIG.image.gemini25flash;

    const model = this.genAI.getGenerativeModel({ model: modelId });

    const parts = [{ text: request.prompt }];

    // Add reference images if provided
    if (request.referenceImages && request.referenceImages.length > 0) {
      const imagesParts = request.referenceImages.map(img => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: img,
        }
      }));
      parts.push(...imagesParts);
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        resolution: request.resolution,
        aspectRatio: request.aspectRatio,
      }
    });

    return result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
  }
}
```

### Phase 3: API Routes (Weeks 3-4)

#### Step 3.1: Create Thinking Endpoint
**New File**: `app/api/gemini/think/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ThinkingOrchestrator } from '@/services/thinking/thinkingOrchestrator';

export async function POST(request: NextRequest) {
  try {
    const { prompt, taskType, mode, referenceImages } = await request.json();

    // Check feature flag
    if (process.env.ENABLE_THINKING_MODE !== 'true') {
      return NextResponse.json({
        error: 'Thinking mode not enabled'
      }, { status: 403 });
    }

    const orchestrator = new ThinkingOrchestrator();
    let result;

    switch (taskType) {
      case 'prompt-optimization':
        result = await orchestrator.optimizePrompt(prompt, { mode, referenceImages: referenceImages?.length });
        break;
      case 'coherence-analysis':
        result = await orchestrator.analyzeStoryboardCoherence(JSON.parse(prompt));
        break;
      case 'composition-reasoning':
        result = await orchestrator.reasonAboutComposition(referenceImages, prompt);
        break;
      default:
        return NextResponse.json({ error: 'Invalid task type' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Thinking mode error:', error);
    return NextResponse.json({
      error: 'Thinking mode failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

#### Step 3.2: Update Veo Generate Route
**File**: `app/api/veo/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { VeoService } from '@/services/veoService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const quality = formData.get('quality') as 'preview' | 'final';
    const mode = formData.get('mode') as 'photo-editor' | 'single-video' | 'storyboard';

    // Extract reference images (up to 3)
    const referenceImages: string[] = [];
    for (let i = 0; i < 3; i++) {
      const img = formData.get(`referenceImage${i}`);
      if (img) referenceImages.push(img as string);
    }

    const veoService = new VeoService();
    const operationId = await veoService.generateVideo({
      prompt,
      referenceImages,
      quality,
      mode,
    });

    return NextResponse.json({ operationId });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json({
      error: 'Video generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

#### Step 3.3: Update Imagen Route
**File**: `app/api/imagen/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ImageService } from '@/services/imageService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const resolution = formData.get('resolution') as 'high' | 'ultra';
    const aspectRatio = formData.get('aspectRatio') as '1:1' | '16:9' | '3:2' | '4:3';

    // Extract reference images (up to 50 for Photo Editor)
    const referenceImages: string[] = [];
    let i = 0;
    while (formData.has(`referenceImage${i}`) && i < 50) {
      referenceImages.push(formData.get(`referenceImage${i}`) as string);
      i++;
    }

    const imageService = new ImageService();
    const imageData = await imageService.generateImage({
      prompt,
      referenceImages,
      resolution,
      aspectRatio,
    });

    return NextResponse.json({ imageData });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({
      error: 'Image generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

### Phase 4: UI Components (Weeks 4-5)

#### Step 4.1: Thinking Toggle Component
**New File**: `components/ui/ThinkingToggle.tsx`

```typescript
import React, { useState } from 'react';

interface ThinkingToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  budget: number;
  onBudgetChange: (budget: number) => void;
  taskType: 'prompt-optimization' | 'coherence-analysis' | 'composition-reasoning';
}

export function ThinkingToggle({ enabled, onToggle, budget, onBudgetChange, taskType }: ThinkingToggleProps) {
  const taskDescriptions = {
    'prompt-optimization': 'Enhance your prompt for better visual results',
    'coherence-analysis': 'Validate narrative flow across scenes',
    'composition-reasoning': 'Analyze reference images for composition guidance',
  };

  return (
    <div className="thinking-toggle">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="toggle"
        />
        <div>
          <label className="font-semibold">Intelligent Thinking Mode</label>
          <p className="text-sm text-gray-600">{taskDescriptions[taskType]}</p>
        </div>
      </div>

      {enabled && (
        <div className="mt-4">
          <label className="text-sm">Thinking Budget: {budget} tokens</label>
          <input
            type="range"
            min="0"
            max="24576"
            step="1000"
            value={budget}
            onChange={(e) => onBudgetChange(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Fast (0)</span>
            <span>Balanced (12K)</span>
            <span>Deep (24K)</span>
          </div>
          <p className="text-xs mt-2 text-gray-600">
            Higher budget = more thorough reasoning but slightly longer processing time
          </p>
        </div>
      )}
    </div>
  );
}
```

#### Step 4.2: Enhanced Model Selector
**File**: `components/ui/ModelSelector.tsx`

```typescript
import React from 'react';
import { MODEL_CONFIG } from '@/config/models';

interface ModelOption {
  id: string;
  name: string;
  description: string;
  costPerSecond?: number;
  recommended?: boolean;
}

interface ModelSelectorProps {
  mode: 'photo-editor' | 'single-video' | 'storyboard';
  quality: 'preview' | 'final';
  onQualityChange: (quality: 'preview' | 'final') => void;
}

export function ModelSelector({ mode, quality, onQualityChange }: ModelSelectorProps) {
  const videoModels: Record<string, ModelOption> = {
    'veo-3.1-fast': {
      id: MODEL_CONFIG.video.veo31fast,
      name: 'Veo 3.1 Fast',
      description: 'Rapid iteration for quick previews',
      costPerSecond: 0.15,
      recommended: mode === 'photo-editor',
    },
    'veo-3.1-standard': {
      id: MODEL_CONFIG.video.veo31,
      name: 'Veo 3.1 Standard',
      description: 'Premium quality with enhanced cinematics',
      costPerSecond: 0.40,
      recommended: mode === 'single-video' || mode === 'storyboard',
    },
  };

  return (
    <div className="model-selector">
      <label className="font-semibold">Quality</label>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <button
          className={`p-4 border rounded ${quality === 'preview' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onClick={() => onQualityChange('preview')}
        >
          <div className="font-semibold">Preview</div>
          <div className="text-sm text-gray-600">{videoModels['veo-3.1-fast'].description}</div>
          <div className="text-xs text-gray-500 mt-1">
            ${videoModels['veo-3.1-fast'].costPerSecond}/sec
          </div>
        </button>
        <button
          className={`p-4 border rounded ${quality === 'final' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onClick={() => onQualityChange('final')}
        >
          <div className="font-semibold">Final</div>
          <div className="text-sm text-gray-600">{videoModels['veo-3.1-standard'].description}</div>
          <div className="text-xs text-gray-500 mt-1">
            ${videoModels['veo-3.1-standard'].costPerSecond}/sec
          </div>
        </button>
      </div>
    </div>
  );
}
```

#### Step 4.3: Update Composer Component
**File**: `components/ui/Composer.tsx`

Add thinking mode integration to existing Composer component:

```typescript
import { ThinkingToggle } from './ThinkingToggle';
import { useState } from 'react';

// Inside Composer component
const [thinkingEnabled, setThinkingEnabled] = useState(false);
const [thinkingBudget, setThinkingBudget] = useState(10000);
const [thinkingResult, setThinkingResult] = useState<any>(null);

// Add thinking step before generation
const handleOptimizePrompt = async () => {
  if (!thinkingEnabled) return;

  const response = await fetch('/api/gemini/think', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      taskType: 'prompt-optimization',
      mode,
      referenceImages: images.length,
    }),
  });

  const result = await response.json();
  setThinkingResult(result);

  // Show optimization modal
  // User can accept, modify, or reject
};

// Render
<ThinkingToggle
  enabled={thinkingEnabled}
  onToggle={setThinkingEnabled}
  budget={thinkingBudget}
  onBudgetChange={setThinkingBudget}
  taskType="prompt-optimization"
/>
```

### Phase 5: Testing & Validation (Weeks 5-6)

#### Step 5.1: Unit Tests

**Test File**: `__tests__/services/thinkingOrchestrator.test.ts`

```typescript
import { ThinkingOrchestrator } from '@/services/thinking/thinkingOrchestrator';

describe('ThinkingOrchestrator', () => {
  let orchestrator: ThinkingOrchestrator;

  beforeEach(() => {
    orchestrator = new ThinkingOrchestrator();
  });

  it('should optimize prompt with valid input', async () => {
    const result = await orchestrator.optimizePrompt(
      'a sunset over mountains',
      { mode: 'single-video' }
    );

    expect(result.optimizedPrompt).toBeDefined();
    expect(result.optimizedPrompt).not.toBe('a sunset over mountains');
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  it('should analyze storyboard coherence', async () => {
    const scenes = [
      { prompt: 'character enters room' },
      { prompt: 'character finds clue' },
      { prompt: 'character leaves building' },
    ];

    const result = await orchestrator.analyzeStoryboardCoherence(scenes);

    expect(result.coherenceScore).toBeDefined();
    expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
    expect(result.coherenceScore).toBeLessThanOrEqual(100);
  });

  it('should handle rate limiting gracefully', async () => {
    // Test rate limit handling
    const promises = Array(5).fill(null).map(() =>
      orchestrator.optimizePrompt('test', { mode: 'single-video' })
    );

    await expect(Promise.all(promises)).rejects.toThrow(/rate limit/i);
  });
});
```

#### Step 5.2: Integration Tests

**Test File**: `__tests__/api/thinking.test.ts`

```typescript
import { POST } from '@/app/api/gemini/think/route';

describe('Thinking API', () => {
  it('should optimize prompt via API', async () => {
    const request = new Request('http://localhost/api/gemini/think', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'a beautiful landscape',
        taskType: 'prompt-optimization',
        mode: 'single-video',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(data.optimizedPrompt).toBeDefined();
    expect(data.tokensUsed).toBeGreaterThan(0);
  });
});
```

#### Step 5.3: End-to-End Tests

**Test scenarios**:
1. Photo Editor with 50 reference images + thinking mode
2. Single Video with prompt optimization
3. Storyboard with coherence analysis
4. Cost estimation accuracy
5. Fallback to legacy models when new models fail

### Phase 6: Deployment & Monitoring (Weeks 6-7)

#### Step 6.1: Feature Flag Rollout Strategy

**Week 6**: Internal testing
- Enable `ENABLE_VEO_31=true` for development environment
- Enable `ENABLE_THINKING_MODE=true` for internal team
- Monitor error rates and performance

**Week 7**: Staged production rollout
- Day 1-2: Enable Veo 3.1 for 10% of users
- Day 3-4: Enable thinking mode for Photo Editor (20% of users)
- Day 5-6: Enable thinking mode for Single Video (30% of users)
- Day 7: Full rollout if metrics are positive

#### Step 6.2: Monitoring & Telemetry

**Metrics to track**:
- Thinking mode adoption rate per creative mode
- Average thinking token usage
- Cost per generation (with/without thinking)
- User satisfaction scores
- Error rates (experimental API failures)
- Veo 3.1 generation quality feedback

**Alerting**:
- Alert if thinking mode error rate >5%
- Alert if Veo 3.1 API unavailable
- Alert if cost per user exceeds budget threshold

---

## Testing Strategy

### Test Coverage Matrix

| Component | Unit Tests | Integration Tests | E2E Tests | Performance Tests |
|-----------|-----------|-------------------|-----------|-------------------|
| ThinkingOrchestrator | ✓ | ✓ | ✓ | ✓ |
| VeoService | ✓ | ✓ | ✓ | ✓ |
| ImageService | ✓ | ✓ | ✓ | - |
| API Routes | ✓ | ✓ | ✓ | - |
| UI Components | ✓ | - | ✓ | - |
| Model Selection | ✓ | ✓ | - | - |

### Key Test Scenarios

#### 1. Thinking Mode Validation
- **Test**: Prompt optimization improves video quality
- **Metric**: User preference survey (optimized vs original)
- **Success**: >70% prefer optimized prompts

#### 2. Veo 3.1 Quality Comparison
- **Test**: Generate same prompt with Veo 3.0 vs 3.1
- **Metric**: Blind quality comparison
- **Success**: >75% prefer Veo 3.1 output

#### 3. Photo Editor Multi-Image Handling
- **Test**: Upload 50 reference images and generate composition
- **Metric**: Memory usage, generation time, success rate
- **Success**: <2GB memory, <30sec thinking, >95% success

#### 4. Cost Optimization
- **Test**: Compare cost per generation across quality settings
- **Metric**: Total cost (thinking + generation)
- **Success**: Preview mode <50% cost of final mode

#### 5. Storyboard Coherence
- **Test**: Generate 10-scene storyboard with thinking validation
- **Metric**: Coherence score, user feedback
- **Success**: >80 coherence score, >4/5 user rating

---

## Risks & Considerations

### Risk Assessment Matrix

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Experimental API Instability** | HIGH | MEDIUM | Feature flags, fallback to Veo 3.0/Gemini 2.5, monitoring |
| **Thinking Rate Limits (2 RPM)** | HIGH | HIGH | Queue system, caching, budget throttling, user education |
| **Cost Overruns** | HIGH | MEDIUM | Token budget controls, cost estimation UI, analytics dashboard |
| **Regional Restrictions (EU/UK)** | MEDIUM | MEDIUM | Geo-detection, alternative model routing, user notifications |
| **SDK Breaking Changes** | MEDIUM | LOW | Pin SDK version, thorough testing, changelog monitoring |
| **Memory Leaks (50 images)** | MEDIUM | MEDIUM | Proper cleanup, streaming, pagination, memory profiling |
| **User Confusion (Too Many Options)** | LOW | HIGH | Smart defaults, mode-specific recommendations, tooltips |
| **Thinking Mode Latency** | LOW | MEDIUM | Async processing, progress indicators, cancellation support |

### Technical Considerations

#### 1. Experimental API Stability
- **Challenge**: Veo 3.1 and Gemini 2.0 Thinking are preview/experimental
- **Impact**: Potential API changes, deprecation, instability
- **Mitigation**:
  - Implement robust error handling with detailed logging
  - Feature flags for safe rollback to Veo 3.0 / Gemini 2.5
  - Monitor Google AI Platform announcements
  - Maintain compatibility layer for multiple API versions

#### 2. Thinking Budget Optimization
- **Challenge**: Balance between reasoning quality and cost
- **Impact**: Higher budgets = better results but higher cost
- **Recommendations**:
  - **Photo Editor**: 12,000 tokens (complex composition analysis)
  - **Single Video**: 8,000 tokens (prompt refinement)
  - **Storyboard**: 14,000 tokens (multi-scene coherence critical)
- **Cost Control**: User-visible budget slider with cost estimation

#### 3. Regional Compliance
- **Challenge**: EU/UK/CH/MENA personGeneration restrictions
- **Impact**: Cannot generate person-focused content in restricted regions
- **Mitigation**:
  - Implement geo-detection in API routes
  - Provide alternative generation path (landscape, abstract, etc.)
  - Clear user notifications about regional limitations
  - Fallback to Gemini 2.5 for restricted content types

#### 4. Cost Management
- **Thinking Mode**: Charged for all tokens (reasoning + response)
  - Average cost: $0.001-0.003 per optimization
- **Veo 3.1 Fast**: $0.15/second
- **Veo 3.1 Standard**: $0.40/second
- **Total Example**: 8-second video with thinking = $0.40 (thinking) + $3.20 (video) = $3.60

**Cost Optimization Strategies**:
- Cache thinking results for similar prompts
- Smart model selection based on use case
- Budget throttling per user tier
- Cost analytics and reporting

#### 5. Performance Optimization
- **Thinking Mode Overhead**: Target <3 seconds
  - Async processing with progress indicators
  - Optional - user can skip and use original prompt
- **50 Reference Images**: Memory management critical
  - Stream images to API instead of loading all into memory
  - Implement pagination if necessary
  - Proper cleanup of blob URLs

---

## Success Criteria

### Quantitative Metrics

#### Implementation Completeness
- ✅ All API routes updated to support Veo 3.1 models
- ✅ Thinking mode integrated across all 3 creative modes
- ✅ Gemini 3 Pro Image migration complete
- ✅ Test coverage >85% for new/modified code
- ✅ Zero regressions in existing functionality

#### Performance Benchmarks
- ✅ Thinking mode latency <3 seconds overhead
- ✅ Veo 3.1 Fast generates 4-second preview in <15 seconds
- ✅ Photo Editor handles 50 reference images without memory issues
- ✅ API polling maintains 5-second interval
- ✅ System uptime >99.5% after deployment

#### Cost Efficiency
- ✅ Average cost per generation within 120% of baseline
- ✅ Thinking budget optimization reduces unnecessary token usage
- ✅ Preview mode costs <50% of final mode
- ✅ No runaway costs from rate limit retries

#### User Adoption
- ✅ >40% of Storyboard users enable thinking mode
- ✅ >30% of Single Video users try prompt optimization
- ✅ >25% of Photo Editor users leverage composition reasoning
- ✅ >4.0/5.0 average user satisfaction rating

### Qualitative Metrics

#### Video Quality Improvement
- ✅ Blind comparison: >75% prefer Veo 3.1 over Veo 3.0
- ✅ Users report improved cinematic quality
- ✅ Better handling of complex prompts with thinking mode
- ✅ Enhanced visual coherence in multi-scene storyboards

#### User Experience
- ✅ Thinking mode suggestions perceived as helpful (>4/5 rating)
- ✅ Model selection UI intuitive and clear
- ✅ Cost estimation transparency builds user trust
- ✅ No critical bugs or production incidents

#### Documentation & Support
- ✅ Technical documentation complete and clear
- ✅ User guides published for thinking mode
- ✅ Code maintainability scores >80%
- ✅ Team onboarding time <1 week for new developers

---

## Estimated Effort

### Timeline Breakdown

| Phase | Duration | Team Resources | Key Deliverables |
|-------|----------|----------------|------------------|
| **Phase 1: Foundation** | 2 weeks | 1 Backend Dev (60%), 1 Frontend Dev (20%) | SDK updates, env config, model definitions |
| **Phase 2: Service Layer** | 1.5 weeks | 1 Backend Dev (100%) | ThinkingOrchestrator, VeoService, ImageService |
| **Phase 3: API Routes** | 1.5 weeks | 1 Backend Dev (80%) | /gemini/think, updated /veo & /imagen routes |
| **Phase 4: UI Components** | 1.5 weeks | 1 Frontend Dev (100%) | ThinkingToggle, ModelSelector, Composer updates |
| **Phase 5: Testing** | 2 weeks | 1 Backend Dev (40%), 1 Frontend Dev (40%), 1 QA (100%) | Unit, integration, E2E, performance tests |
| **Phase 6: Deployment** | 1 week | DevOps (50%), Product (30%), QA (30%) | Feature flags, monitoring, staged rollout |
| **Total** | **9.5 weeks** | - | Production-ready implementation |

### Resource Requirements

#### Team Composition
- **Backend Engineer**: 60% allocation (~24 person-days)
- **Frontend Engineer**: 40% allocation (~16 person-days)
- **QA Engineer**: 30% allocation (~12 person-days)
- **Product Manager**: 10% allocation (~4 person-days)
- **DevOps Engineer**: 20% allocation (~8 person-days)

#### Infrastructure Costs (Pre-Launch Testing)
- **Thinking mode testing**: ~$100-150 (1000 optimizations)
- **Video generation testing**: ~$300-400 (100 videos)
- **Image generation testing**: ~$50-75 (500 images)
- **Performance testing**: ~$200-300 (load testing)
- **Total estimated**: ~$650-925

### Critical Path

```
Week 1-2:  SDK Updates → Env Config → Model Definitions
Week 2-3:  ThinkingOrchestrator → Service Layer
Week 3-4:  API Routes → Integration Points
Week 4-5:  UI Components → User Flows
Week 5-6:  Testing Suite → Bug Fixes
Week 6-7:  Deployment → Monitoring → Rollout
```

**Earliest Completion**: 9.5 weeks with full team allocation
**Conservative Estimate**: 12 weeks with potential delays and iteration

---

## Key Files Modified/Created

### Modified Files
1. `package.json` - SDK version updates
2. `app/api/veo/generate/route.ts` - Veo 3.1 model IDs, reference image support
3. `app/api/veo/operation/route.ts` - Enhanced polling for Veo 3.1 metadata
4. `app/api/imagen/generate/route.ts` - Gemini 3 Pro Image migration
5. `components/ui/ModelSelector.tsx` - New model options and quality selection
6. `components/ui/Composer.tsx` - Thinking toggle integration
7. `services/geminiService.ts` - Unified SDK wrapper with thinking support
8. `.env.example` - New environment variables
9. `config/models.ts` - Model configuration and selection logic
10. `CLAUDE.md` - Updated project documentation

### New Files Created
1. `services/thinking/thinkingOrchestrator.ts` - Thinking mode coordination
2. `app/api/gemini/think/route.ts` - Thinking API endpoint
3. `components/ui/ThinkingToggle.tsx` - Thinking mode UI control
4. `hooks/useThinkingMode.ts` - React hook for thinking state management
5. `__tests__/services/thinkingOrchestrator.test.ts` - Unit tests
6. `__tests__/api/thinking.test.ts` - Integration tests

---

## Migration Checklist

### Pre-Deployment
- [ ] SDK updated to latest version supporting Veo 3.1
- [ ] Environment variables configured across all environments
- [ ] Feature flags set to `false` initially
- [ ] Model configuration verified
- [ ] All tests passing (unit, integration, E2E)
- [ ] Cost analytics dashboard ready
- [ ] Monitoring alerts configured

### Deployment Day 1
- [ ] Enable `ENABLE_VEO_31=true` for 10% of users
- [ ] Monitor error rates and latency
- [ ] Collect initial quality feedback
- [ ] Verify cost projections accurate

### Week 1 Post-Deployment
- [ ] Enable thinking mode for Photo Editor (20% users)
- [ ] Enable thinking mode for Single Video (30% users)
- [ ] Monitor adoption rates and user feedback
- [ ] Analyze cost per generation trends

### Week 2 Post-Deployment
- [ ] Full rollout of Veo 3.1 (100% users)
- [ ] Full rollout of thinking mode (100% users)
- [ ] Enable Gemini 3 Pro Image (100% users)
- [ ] Publish user documentation
- [ ] Retrospective meeting with team

---

## Appendix: Code Snippets

### Environment Variables Template

```env
# .env.production

# Gemini API
GEMINI_API_KEY=your_api_key_here

# Veo 3.1 Models
VEO_31_STANDARD=veo-3.1-generate-preview
VEO_31_FAST=veo-3.1-fast-generate-preview

# Gemini Thinking
GEMINI_THINKING_MODEL=gemini-2.0-flash-thinking-exp
GEMINI_THINKING_DEFAULT_BUDGET=10000

# Gemini 3 Pro Image
GEMINI_3_PRO_IMAGE=gemini-3-pro-image
GEMINI_3_IMAGE_RESOLUTION=high

# Feature Flags
ENABLE_THINKING_MODE=true
ENABLE_VEO_31=true
ENABLE_GEMINI_3_IMAGE=true

# Rate Limits
THINKING_RATE_LIMIT_RPM=2
THINKING_RATE_LIMIT_RPD=50

# Regional Compliance
ENABLE_GEO_RESTRICTION=true
RESTRICTED_REGIONS=EU,UK,CH,MENA

# Cost Management
MAX_THINKING_BUDGET=24576
COST_ALERT_THRESHOLD_USD=100.00
```

---

## Conclusion

This synthesized implementation plan combines the **technical depth of Codex**, the **architectural rigor of Gemini Pro**, and the **cost-conscious trade-off analysis of Sonnet** to deliver a production-ready upgrade path for Story Composer.

### Key Takeaways
1. **Phased Approach**: 6 phases over 9.5 weeks minimizes risk
2. **Feature Flags**: Enable safe rollback and gradual adoption
3. **Cost Optimization**: Smart model selection balances quality and cost
4. **Thinking Mode**: Strategic integration for high-value creative tasks
5. **Testing Rigor**: >85% code coverage ensures reliability

### Next Steps
1. Review and approve this plan with stakeholders
2. Allocate team resources per timeline
3. Begin Phase 1: SDK updates and environment configuration
4. Schedule weekly check-ins to track progress
5. Prepare monitoring dashboard for post-deployment analytics

**Plan Status**: Ready for implementation
**Risk Level**: Medium (experimental APIs, managed with mitigation strategies)
**Expected Impact**: HIGH - significant quality and UX improvements across all creative modes