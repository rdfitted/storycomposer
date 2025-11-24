# Add Character Management to Storyboard

---
**Plan Metadata**
- **Generated**: 2025-11-23
- **Planning Agents**: GPT-5.1 Codex, Gemini 3 Pro, Sonnet 4.5
- **Documentation Referenced**: plans/extend-story-composer-gemini-3-features.md
- **Synthesis Approach**: Combined best elements from all 3 agent plans

**Agent Contributions:**
- **Codex**: Detailed Zustand store implementation, mention parsing utilities, reorder functionality
- **Gemini 3 Pro**: Architecture diagram, API integration strategy, prompt preprocessing
- **Sonnet 4.5**: Phase-based implementation, component structure, MentionAutocomplete design
---

## Overview

Add a comprehensive character management system to Storyboard mode, mirroring the ComicCreator pattern. Users can create persistent characters with multiple reference images (up to 5) and invoke them in scene prompts via @mention autocomplete or dropdown selector. Character references are passed to the Veo video generation API to improve visual consistency across scenes.

**Key Features:**
1. Character creation with name, description, and up to 5 reference images
2. Full edit functionality (add/remove images, update name/description)
3. @mention autocomplete in scene prompt inputs
4. Per-scene character dropdown selector (max 3 characters per scene)
5. Character persistence using existing Zustand store pattern
6. Integration with Veo API for reference image injection

---

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Create characters with name, description, up to 5 reference images | High |
| FR-2 | Edit existing characters (add/remove images, update description/name) | High |
| FR-3 | Delete characters from storyboard project | High |
| FR-4 | @mention autocomplete in scene prompts | High |
| FR-5 | Character selector dropdown per scene (max 3 characters) | High |
| FR-6 | Visual character cards with image thumbnails | Medium |
| FR-7 | Pass character references to Veo API | High |
| FR-8 | Reorder reference images within a character | Low |

### Technical Requirements

- Extend `useCreativeStore` Zustand store with CharacterSlice
- TypeScript interfaces for `StoryboardCharacter` and extended `Scene`
- Components using existing Shadcn/UI patterns
- API route updates to include character reference images in Veo payload

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        StoryboardComposer                           │
│  ┌──────────────────┐    ┌────────────────────────────────────────┐ │
│  │  CharacterBank   │    │              Scene Cards               │ │
│  │  ┌────────────┐  │    │  ┌────────────────────────────────────┐│ │
│  │  │CharacterCard│ │    │  │           SceneCard                ││ │
│  │  │  [Avatar]   │ │    │  │  ┌─────────────────────────────┐   ││ │
│  │  │  Name       │ │    │  │  │  MentionAutocomplete        │   ││ │
│  │  │  [Edit]     │ │    │  │  │  (prompt input with @)      │   ││ │
│  │  └────────────┘  │    │  │  └─────────────────────────────┘   ││ │
│  │  ┌────────────┐  │    │  │  ┌─────────────────────────────┐   ││ │
│  │  │CharacterCard│ │    │  │  │  CharacterSelector          │   ││ │
│  │  └────────────┘  │    │  │  │  (dropdown, max 3)          │   ││ │
│  │  [+ Add New]     │    │  │  └─────────────────────────────┘   ││ │
│  └──────────────────┘    │  └────────────────────────────────────┘│ │
│                          └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CharacterModal (Create/Edit)                   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Name: [________________]                                       ││
│  │  Description: [__________________________________]              ││
│  │                                                                 ││
│  │  Reference Images (up to 5):                                    ││
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                       ││
│  │  │ img │ │ img │ │ + │ │     │ │     │                       ││
│  │  │  ✕  │ │  ✕  │ │     │ │     │ │     │                       ││
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                       ││
│  │                                                                 ││
│  │  [Cancel]                              [Save Character]         ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action (Create/Edit Character)
    ↓
CharacterModal → Zustand Store (useCreativeStore.characters)
    ↓
StoryboardComposer reads characters → Passes to SceneCards
    ↓
SceneCard: CharacterSelector/MentionAutocomplete updates scene.characterIds
    ↓
Generate Scene → API receives prompt + characterIds
    ↓
API Route resolves characterIds → Fetches reference images from FormData
    ↓
Veo API receives prompt + reference images
```

---

## File Structure

### New Files

| File | Description |
|------|-------------|
| `lib/types/storyboard-characters.ts` | TypeScript interfaces for characters |
| `components/ui/storyboard/CharacterModal.tsx` | Creation/edit modal with image upload |
| `components/ui/storyboard/CharacterCard.tsx` | Visual card with avatar and actions |
| `components/ui/storyboard/CharacterBank.tsx` | Sidebar panel listing all characters |
| `components/ui/storyboard/CharacterSelector.tsx` | Per-scene dropdown (max 3) |
| `components/ui/storyboard/MentionAutocomplete.tsx` | @mention enhanced textarea |
| `lib/characters/parseMention.ts` | Utility for parsing @mentions from text |

### Modified Files

| File | Changes |
|------|---------|
| `lib/storyboard.ts` | Add `characterIds: string[]` to Scene type |
| `stores/useCreativeStore.ts` | Add CharacterSlice with CRUD actions |
| `components/ui/StoryboardComposer.tsx` | Integrate CharacterBank, pass characters to scenes |
| `components/ui/SceneCard.tsx` | Add CharacterSelector + MentionAutocomplete |
| `app/api/veo/generate/route.ts` | Handle character references, enhance prompt |
| `app/page.tsx` | Add characters state to generation FormData |

---

## TypeScript Interfaces

### `lib/types/storyboard-characters.ts`

```typescript
export interface CharacterImage {
  id: string;
  url: string;         // Data URL or blob URL
  file?: File;         // Original file for upload
  createdAt: number;
}

export interface StoryboardCharacter {
  id: string;
  name: string;
  description: string;
  images: CharacterImage[];  // Max 5
  createdAt: number;
  updatedAt: number;
}

export interface CharacterSlice {
  characters: StoryboardCharacter[];
  addCharacter: (char: Omit<StoryboardCharacter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCharacter: (id: string, updates: Partial<Omit<StoryboardCharacter, 'id' | 'createdAt'>>) => void;
  deleteCharacter: (id: string) => void;
  addImageToCharacter: (charId: string, image: CharacterImage) => void;
  removeImageFromCharacter: (charId: string, imageId: string) => void;
  reorderCharacterImages: (charId: string, imageIds: string[]) => void;
  getCharacterById: (id: string) => StoryboardCharacter | undefined;
  searchCharacters: (query: string) => StoryboardCharacter[];
}
```

### Scene Type Extension (`lib/storyboard.ts`)

```typescript
export interface Scene {
  id: string;
  prompt: string;
  duration: number;
  aspectRatio: string;
  // NEW: Character references for this scene
  characterIds: string[];  // Max 3 per scene
  // ... existing fields
}
```

---

## Implementation Steps

### Phase 1: Type Definitions (Step 1)

**File:** `lib/types/storyboard-characters.ts`

1. Create `CharacterImage` interface with id, url, optional file reference
2. Create `StoryboardCharacter` interface with id, name, description, images array (max 5)
3. Create `CharacterSlice` interface for Zustand actions
4. Export all types

**File:** `lib/storyboard.ts`

5. Add `characterIds: string[]` field to `Scene` interface
6. Update `isScene` type guard to include characterIds validation

### Phase 2: Zustand Store (Step 2)

**File:** `stores/useCreativeStore.ts`

1. Import `StoryboardCharacter`, `CharacterSlice` types
2. Add `characters: StoryboardCharacter[]` to store state
3. Implement `addCharacter` - generate UUID, set timestamps
4. Implement `updateCharacter` - merge updates, update `updatedAt`
5. Implement `deleteCharacter` - filter by id, warn if used in scenes
6. Implement `addImageToCharacter` - validate max 5 images
7. Implement `removeImageFromCharacter` - filter image by id
8. Implement `reorderCharacterImages` - reorder based on new id array
9. Implement selectors: `getCharacterById`, `searchCharacters`
10. Add `persist` middleware for localStorage persistence

### Phase 3: CharacterModal Component (Steps 3-4)

**File:** `components/ui/storyboard/CharacterModal.tsx`

1. Create modal component using existing UI patterns (Dialog)
2. Form fields: name input, description textarea
3. Image upload grid (5 slots) with:
   - Drag-drop support using react-dropzone
   - Click to upload fallback
   - Remove button (X) on each image
   - Visual placeholder for empty slots
4. Validation: name required, at least 1 image recommended
5. Props: `isOpen`, `onClose`, `character?` (for edit mode)
6. On save: call `addCharacter` or `updateCharacter` from store

### Phase 4: CharacterCard & CharacterBank (Steps 5-6)

**File:** `components/ui/storyboard/CharacterCard.tsx`

1. Display character avatar (first image or initials fallback)
2. Show name and truncated description
3. Edit button → opens CharacterModal in edit mode
4. Delete button with confirmation dialog
5. Hover state with action buttons

**File:** `components/ui/storyboard/CharacterBank.tsx`

1. Sidebar panel component
2. Header with "Characters" title and "+ Add" button
3. List of CharacterCard components
4. Empty state: "No characters yet. Add one to get started."
5. Collapsible/expandable design for space efficiency

### Phase 5: CharacterSelector (Step 7)

**File:** `components/ui/storyboard/CharacterSelector.tsx`

1. Multi-select dropdown component
2. Shows character avatars + names
3. Max 3 selections per scene (with validation)
4. Selected characters displayed as pills/tags
5. Props: `selectedIds`, `onChange`, `characters`

### Phase 6: MentionAutocomplete (Step 8)

**File:** `components/ui/storyboard/MentionAutocomplete.tsx`

1. Enhanced textarea with @mention detection
2. Trigger autocomplete on `@` character
3. Filter characters by typed query after `@`
4. Dropdown positioned near cursor/caret
5. Select character → insert `@CharacterName` into text
6. Track mentioned character IDs internally

**File:** `lib/characters/parseMention.ts`

```typescript
// Parse @mentions from prompt text
export function parseMentions(text: string): string[] {
  const mentionRegex = /@(\w+(?:\s+\w+)?)/g;
  const matches = text.matchAll(mentionRegex);
  return Array.from(matches, m => m[1]);
}

// Replace @mentions with character descriptions
export function expandMentions(
  text: string,
  characters: StoryboardCharacter[]
): string {
  let expanded = text;
  for (const char of characters) {
    const pattern = new RegExp(`@${char.name}`, 'gi');
    expanded = expanded.replace(pattern, `${char.name} (${char.description})`);
  }
  return expanded;
}
```

### Phase 7: Integration - StoryboardComposer (Step 9)

**File:** `components/ui/StoryboardComposer.tsx`

1. Import CharacterBank, useCreativeStore
2. Add CharacterBank to layout (left sidebar or collapsible panel)
3. Pass `characters` to each SceneCard
4. Add "Characters" toggle button to toolbar

### Phase 8: Integration - SceneCard (Step 10)

**File:** `components/ui/SceneCard.tsx`

1. Replace standard textarea with MentionAutocomplete
2. Add CharacterSelector below prompt input
3. Update scene state when characters selected
4. Show selected character avatars as visual indicator

### Phase 9: API Integration (Step 11)

**File:** `app/api/veo/generate/route.ts`

1. Accept `characterData` in request body (array of character objects)
2. Extract reference images from characters
3. Preprocess prompt: expand @mentions with descriptions
4. Include primary reference image in Veo API payload
5. Strategy: Use first image of first character for consistency

```typescript
// Inside POST handler
const { prompt, characters } = await req.json();

// Expand mentions in prompt
let enhancedPrompt = prompt;
if (characters?.length > 0) {
  enhancedPrompt = expandMentions(prompt, characters);
}

// Get reference image (first image of first character)
let referenceImage = null;
if (characters?.[0]?.images?.[0]?.url) {
  referenceImage = characters[0].images[0].url;
}

// Include in Veo payload
const veoPayload = {
  prompt: enhancedPrompt,
  ...(referenceImage && { referenceImage_0: referenceImage }),
  // ... other params
};
```

### Phase 10: Integration - app/page.tsx (Step 12)

**File:** `app/page.tsx`

1. Get characters from store in Storyboard generation flow
2. Filter characters by scene's `characterIds`
3. Include filtered characters in FormData for API call
4. Handle character data serialization (JSON stringify for complex objects)

---

## Testing Strategy

### Unit Tests

| Test | Target |
|------|--------|
| Store CRUD | `addCharacter`, `updateCharacter`, `deleteCharacter` |
| Image limits | Max 5 images validation |
| Mention parsing | `parseMentions`, `expandMentions` |
| Character search | `searchCharacters` fuzzy matching |

### Component Tests

| Test | Target |
|------|--------|
| CharacterModal | Form validation, image upload, edit mode |
| CharacterCard | Edit/delete button behavior |
| CharacterSelector | Max 3 selection enforcement |
| MentionAutocomplete | @trigger, selection, insertion |

### Integration Tests

| Test | Flow |
|------|------|
| Create → Edit | Create character, edit description, verify persistence |
| Character → Scene | Create character, add to scene, verify characterIds |
| Generation | Generate scene with character, verify API payload |

### E2E Tests (Playwright)

1. Complete character creation flow
2. Edit character (add/remove images)
3. @mention in scene prompt
4. Generate video with character reference

---

## Risks & Considerations

| Risk | Impact | Mitigation |
|------|--------|------------|
| File objects can't persist to localStorage | Characters lost on reload if using File refs | Store data URLs, warn about browser storage limits |
| Large images may exceed localStorage quota | Persistence failure | Compress images before storing, use IndexedDB for larger data |
| Veo API may not support reference images well | Visual inconsistency | Enhance prompts with detailed descriptions as backup |
| @mention parsing false positives (emails) | Unintended expansions | Strict regex pattern, require space before @ |
| Deleted character still referenced in scenes | Orphaned references | Cascade delete from scenes, or graceful null handling |
| Concurrent tab edits | Store desync | Consider storage event listeners for cross-tab sync |

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Character CRUD | Users can create, edit, delete characters |
| Persistence | Characters survive page reload |
| Image upload | Drag-drop works, max 5 enforced |
| @mention UX | Autocomplete appears within 50ms |
| Scene integration | Up to 3 characters selectable per scene |
| API integration | Reference images sent to Veo API |
| Visual consistency | Generated videos show recognizable likeness |

---

## Estimated Effort

| Phase | Components | Complexity |
|-------|------------|------------|
| Phase 1-2 | Types + Store | Low |
| Phase 3 | CharacterModal | Medium |
| Phase 4 | CharacterCard + Bank | Low |
| Phase 5 | CharacterSelector | Medium |
| Phase 6 | MentionAutocomplete | High |
| Phase 7-10 | Integration | Medium |

**Total: Medium-High complexity**

---

## Next Steps

1. Review this plan and approve approach
2. Run `/build plans/add-character-management-to-storyboard.md`
3. Test character creation flow
4. Test scene integration
5. Verify API payload with character references
