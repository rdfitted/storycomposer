# Update All Modules to Gemini 3.0 Models

---
**Plan Metadata**
- **Generated**: 2025-11-22
- **Planning Agents**: GPT-5.1 Codex, Gemini 3 Pro, Sonnet 4.5
- **Documentation Referenced**:
  - `aidocs/gemini-3-model-update-docs.md`
  - `aidocs/gemini-2-0-flash-thinking-veo-3-1-api-verification-docs.md`
- **Synthesis Approach**: Combined best elements from all 3 agent plans

**Agent Contributions:**
- **Codex**: Detailed line-by-line file changes with specific line numbers
- **Gemini 3 Pro**: Centralized architecture pattern with model constants
- **Sonnet**: Comprehensive rollback plan and feature flag strategy
---

## Overview

Migrate the Story Composer Next.js application from Gemini 2.5 to Gemini 3.0 models. This includes updating all API routes, the central Gemini service, and UI components to use the new model names and required configuration parameters.

### Current State
- **SDK Version**: `@google/genai` v1.8.0
- **Image Models**: `gemini-2.5-flash-image-preview`, `gemini-2.5-flash-lite`
- **Video Models**: `veo-3.0-generate-preview`

### Target State
| Current Model | New Model | Purpose |
|--------------|-----------|---------|
| `gemini-2.5-flash-image-preview` | `gemini-3-pro-image-preview` | Image generation/editing |
| `gemini-2.5-flash-lite` | `gemini-3-pro-preview` | Text analysis/reasoning |
| `veo-3.0-generate-preview` | `veo-3.1-generate-preview` | Video generation |
| `veo-3.0-fast-generate-preview` | `veo-3.1-fast-generate-preview` | Fast video generation |

---

## Requirements

### SDK Requirements
- Upgrade `@google/genai` from v1.8.0 to v1.51.0+

### Critical API Changes (MUST DO)
1. **responseModalities**: All image generation calls MUST include `responseModalities: ['TEXT', 'IMAGE']`
2. **temperature**: MUST be set to `1.0` (lowering causes infinite loops in Gemini 3)
3. **thinking_level**: Replaces deprecated `thinking_budget` parameter (values: `'low'` | `'high'`)

---

## Architecture Changes

### Standardized Configuration Pattern

Add this configuration object to all image generation routes:

```typescript
const GEMINI_IMAGE_CONFIG = {
  responseModalities: ['TEXT', 'IMAGE'],
  generationConfig: { temperature: 1 },
  thinkingConfig: { thinkingLevel: 'high' }
};
```

---

## Implementation Steps

### Step 1: Update SDK Dependency

**File**: `package.json`

```bash
npm install @google/genai@^1.51.0
```

---

### Step 2: Update `services/geminiService.ts`

**Lines affected**: 247, 273, 320

| Line | Change |
|------|--------|
| 273 | Update model to `gemini-3-pro-preview` |
| 320 | Update model to `gemini-3-pro-image-preview` |

**Code Changes**:

```typescript
// Near top of file - add constants
const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview';
const GEMINI_TEXT_MODEL = 'gemini-3-pro-preview';

// Line ~273: Update semantic description call
const descriptionResponse = await ai.models.generateContent({
  model: GEMINI_TEXT_MODEL,  // Changed from gemini-2.5-flash-lite
  contents: { parts: [{ text: descriptionPrompt }, markedEnvironmentImagePart] },
  config: { temperature: 1.0 },
});

// Line ~320: Update image generation call
const response = await ai.models.generateContent({
  model: GEMINI_IMAGE_MODEL,  // Changed from gemini-2.5-flash-image-preview
  contents: { parts: [objectImagePart, cleanEnvironmentImagePart, textPart] },
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    temperature: 1.0,
  },
});
```

---

### Step 3: Update `app/api/ai-editor/edit/route.ts`

**Line affected**: ~102

```typescript
// Update model and add config
const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",  // Changed
  contents: { parts: [originalImagePart, textPart] },
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    temperature: 1.0,
  },
});
```

---

### Step 4: Update `app/api/home-canvas/generate/route.ts`

**Line affected**: ~87

```typescript
// Update model and add config
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',  // Changed
  contents: { parts: [productImagePart, sceneImagePart, textPart] },
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    temperature: 1.0,
  },
});
```

---

### Step 5: Update `app/api/photo-editor/generate/route.ts`

**Lines affected**: 14, 26, ~88

```typescript
// Line 14: Update default model
const model = (formData.get("model") as string) || "gemini-3-pro-image-preview";

// Line 26: Update allowed models validation
const allowedModels = ["gemini-3-pro-image-preview"];

// Line ~88: Add config to generateContent call
const resp = await ai.models.generateContent({
  model,
  contents: contentParts,
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    temperature: 1.0,
  },
});
```

---

### Step 6: Update `app/api/imagen/generate/route.ts`

**Lines affected**: 14, 20-23

```typescript
// Line 14: Update default model
const model = (body?.model as string) || "gemini-3-pro-image-preview";

// Lines 20-23: Add config
const resp = await ai.models.generateContent({
  model,
  contents: prompt,
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    temperature: 1.0,
  },
});
```

---

### Step 7: Update `app/api/veo/generate/route.ts`

**Line affected**: 24

```typescript
// Update default model
const model = (form.get("model") as string) || "veo-3.1-generate-preview";
```

---

### Step 8: Update `app/page.tsx`

**Line affected**: 33

```typescript
// Update default selected model
const [selectedModel, setSelectedModel] = useState<string>("veo-3.1-generate-preview");
```

---

### Step 9: Update `components/ui/ModelSelector.tsx`

**Lines affected**: 12-21

```typescript
// Update models array
const models = [
  "veo-3.1-generate-preview",
  "veo-3.1-fast-generate-preview",
  "veo-2.0-generate-001",
];

// Update formatModelName function
const formatModelName = (model: string) => {
  if (model.includes("veo-3.1-fast")) return "Veo 3.1 - Fast";
  if (model.includes("veo-3.1")) return "Veo 3.1";
  if (model.includes("veo-2.0")) return "Veo 2";
  return model;
};
```

---

### Step 10: Update `components/ui/PhotoEditor.tsx` (if applicable)

**Line affected**: ~55

Check and update any hardcoded model reference:
```typescript
// Change from gemini-2.5-flash-image-preview to gemini-3-pro-image-preview
```

---

## Testing Strategy

### Pre-Deployment Checklist

| Test Case | API Route | Expected Outcome |
|-----------|-----------|------------------|
| Image generation (text only) | `/api/imagen/generate` | Returns base64 image |
| Image generation (with refs) | `/api/photo-editor/generate` | Returns composed image |
| AI Editor retouch | `/api/ai-editor/edit` | Returns edited image |
| Home Canvas placement | `/api/home-canvas/generate` | Returns composite |
| Video generation | `/api/veo/generate` | Returns operation name |
| Video polling | `/api/veo/operation` | Returns status/URI |

### Manual Testing Sequence

```bash
1. npm run dev
2. Test Photo Editor with multi-image chat
3. Test AI Editor with retouch/filter functions
4. Test Home Canvas product placement
5. Test Single Video generation with Veo 3.1
6. Test Storyboard multi-scene generation
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Temperature deviation | Feature failure (loops) | Enforce `temperature: 1.0` everywhere |
| Missing responseModalities | No image output | Add to ALL image generation calls |
| SDK incompatibility | Runtime errors | Pin SDK to v1.51.0+ |
| PhotoEditor hardcoded model | API rejection | Update PhotoEditor.tsx alongside |
| Increased latency | UX degradation | Adjust timeouts if needed |

---

## Success Criteria

1. **All model strings updated** - No residual `gemini-2.5` or `veo-3.0` references
2. **Config compliance** - All image calls include `responseModalities` and `temperature: 1.0`
3. **Thinking parameter** - No `thinking_budget`, only `thinking_level`
4. **Functional verification** - All 5 creative modes work correctly
5. **Performance** - Response times within acceptable range

---

## Rollback Plan

### Immediate Rollback (< 5 minutes)

```bash
# Revert all changes
git checkout HEAD -- package.json package-lock.json
git checkout HEAD -- services/geminiService.ts
git checkout HEAD -- app/api/
git checkout HEAD -- components/ui/
git checkout HEAD -- app/page.tsx

# Reinstall dependencies
npm install

# Restart server
npm run dev
```

### Partial Rollback with Feature Flag

```typescript
// Add to .env
USE_LEGACY_GEMINI=true

// In API routes
const USE_LEGACY = process.env.USE_LEGACY_GEMINI === 'true';
const imageModel = USE_LEGACY
  ? 'gemini-2.5-flash-image-preview'
  : 'gemini-3-pro-image-preview';
```

---

## File Change Summary

| File | Changes Required |
|------|------------------|
| `package.json` | SDK version upgrade to v1.51.0+ |
| `services/geminiService.ts` | 2 model updates + config additions |
| `app/api/ai-editor/edit/route.ts` | Model + config |
| `app/api/home-canvas/generate/route.ts` | Model + config |
| `app/api/photo-editor/generate/route.ts` | Model validation + config |
| `app/api/imagen/generate/route.ts` | Model + config |
| `app/api/veo/generate/route.ts` | Model update |
| `components/ui/ModelSelector.tsx` | Model list + display names |
| `app/page.tsx` | Default model state |
| `components/ui/PhotoEditor.tsx` | Check for hardcoded model |

**Total Files to Modify**: 10
**Estimated Implementation Time**: 30-45 minutes

---

## Next Steps

1. Review this plan
2. Run `/build plans/update-gemini-3-models.md` to implement
3. Test all creative modes
4. Deploy to production
