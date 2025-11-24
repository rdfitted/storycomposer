import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CharacterReference } from '@/lib/types';
import type { StoryboardCharacter, CharacterImage } from '@/lib/types/storyboard-characters';
import { MAX_STORYBOARD_CHARACTERS, MAX_CHARACTER_IMAGES } from '@/lib/types/storyboard-characters';

interface CreativeStore {
  // Character bank (shared across modes - NanoBanana)
  characters: CharacterReference[];
  addCharacter: (char: CharacterReference) => void;
  removeCharacter: (id: string) => void;
  updateCharacter: (id: string, updates: Partial<CharacterReference>) => void;
  clearCharacters: () => void;

  // Storyboard characters (separate, with descriptions and persistence)
  storyboardCharacters: StoryboardCharacter[];
  addStoryboardCharacter: (char: Omit<StoryboardCharacter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStoryboardCharacter: (id: string, updates: Partial<Omit<StoryboardCharacter, 'id' | 'createdAt'>>) => void;
  deleteStoryboardCharacter: (id: string) => void;
  addImageToStoryboardCharacter: (charId: string, image: Omit<CharacterImage, 'id' | 'createdAt'>) => void;
  removeImageFromStoryboardCharacter: (charId: string, imageId: string) => void;

  // Recent generations
  recentImages: string[];
  recentVideos: string[];
  addRecentImage: (url: string) => void;
  addRecentVideo: (url: string) => void;
  clearRecentImages: () => void;
  clearRecentVideos: () => void;

  // Comic projects
  comicProjects: Array<{
    id: string;
    title: string;
    createdAt: number;
    panelCount: number;
  }>;
  addComicProject: (project: { id: string; title: string; panelCount: number }) => void;
  removeComicProject: (id: string) => void;

  // SVG history
  svgHistory: Array<{
    id: string;
    prompt: string;
    svgCode: string;
    createdAt: number;
  }>;
  addSvgToHistory: (svg: { id: string; prompt: string; svgCode: string }) => void;
  clearSvgHistory: () => void;

  // Voxel models
  voxelModels: Array<{
    id: string;
    name: string;
    preview: string;
    createdAt: number;
  }>;
  addVoxelModel: (model: { id: string; name: string; preview: string }) => void;
  removeVoxelModel: (id: string) => void;
}

// Note: We can't persist File objects, so NanoBanana characters will be session-only
// Storyboard characters store data URLs for persistence
export const useCreativeStore = create<CreativeStore>()(
  persist(
    (set, get) => ({
      // Character bank (NanoBanana - session only)
      characters: [],
      addCharacter: (char) =>
        set((state) => ({
          characters: [...state.characters.slice(0, 4), char].slice(0, 5), // max 5
        })),
      removeCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
        })),
      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      clearCharacters: () => set({ characters: [] }),

      // Storyboard characters (persistent with data URLs)
      storyboardCharacters: [],
      addStoryboardCharacter: (char) =>
        set((state) => {
          if (state.storyboardCharacters.length >= MAX_STORYBOARD_CHARACTERS) {
            return state; // Max reached
          }
          const now = Date.now();
          return {
            storyboardCharacters: [
              ...state.storyboardCharacters,
              {
                ...char,
                id: crypto.randomUUID(),
                createdAt: now,
                updatedAt: now,
              },
            ],
          };
        }),
      updateStoryboardCharacter: (id, updates) =>
        set((state) => ({
          storyboardCharacters: state.storyboardCharacters.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          ),
        })),
      deleteStoryboardCharacter: (id) =>
        set((state) => ({
          storyboardCharacters: state.storyboardCharacters.filter((c) => c.id !== id),
        })),
      addImageToStoryboardCharacter: (charId, image) =>
        set((state) => ({
          storyboardCharacters: state.storyboardCharacters.map((c) => {
            if (c.id !== charId) return c;
            if (c.images.length >= MAX_CHARACTER_IMAGES) return c; // Max 5 images
            return {
              ...c,
              images: [
                ...c.images,
                {
                  ...image,
                  id: crypto.randomUUID(),
                  createdAt: Date.now(),
                },
              ],
              updatedAt: Date.now(),
            };
          }),
        })),
      removeImageFromStoryboardCharacter: (charId, imageId) =>
        set((state) => ({
          storyboardCharacters: state.storyboardCharacters.map((c) => {
            if (c.id !== charId) return c;
            return {
              ...c,
              images: c.images.filter((img) => img.id !== imageId),
              updatedAt: Date.now(),
            };
          }),
        })),

      // Recent generations (keep last 20)
      recentImages: [],
      recentVideos: [],
      addRecentImage: (url) =>
        set((state) => ({
          recentImages: [url, ...state.recentImages].slice(0, 20),
        })),
      addRecentVideo: (url) =>
        set((state) => ({
          recentVideos: [url, ...state.recentVideos].slice(0, 20),
        })),
      clearRecentImages: () => set({ recentImages: [] }),
      clearRecentVideos: () => set({ recentVideos: [] }),

      // Comic projects (keep last 10)
      comicProjects: [],
      addComicProject: (project) =>
        set((state) => ({
          comicProjects: [
            { ...project, createdAt: Date.now() },
            ...state.comicProjects,
          ].slice(0, 10),
        })),
      removeComicProject: (id) =>
        set((state) => ({
          comicProjects: state.comicProjects.filter((p) => p.id !== id),
        })),

      // SVG history (keep last 50)
      svgHistory: [],
      addSvgToHistory: (svg) =>
        set((state) => ({
          svgHistory: [
            { ...svg, createdAt: Date.now() },
            ...state.svgHistory,
          ].slice(0, 50),
        })),
      clearSvgHistory: () => set({ svgHistory: [] }),

      // Voxel models (keep last 20)
      voxelModels: [],
      addVoxelModel: (model) =>
        set((state) => ({
          voxelModels: [
            { ...model, createdAt: Date.now() },
            ...state.voxelModels,
          ].slice(0, 20),
        })),
      removeVoxelModel: (id) =>
        set((state) => ({
          voxelModels: state.voxelModels.filter((m) => m.id !== id),
        })),
    }),
    {
      name: 'story-composer-creative-store',
      // Only persist non-File data
      partialize: (state) => ({
        recentImages: state.recentImages,
        recentVideos: state.recentVideos,
        comicProjects: state.comicProjects,
        svgHistory: state.svgHistory,
        voxelModels: state.voxelModels,
        // NanoBanana characters are not persisted because they contain File objects
        // Storyboard characters are persisted (they use data URLs, not File objects)
        storyboardCharacters: state.storyboardCharacters.map(char => ({
          ...char,
          // Strip any File objects from images, keep only data URLs
          images: char.images.map(img => ({
            id: img.id,
            url: img.url,
            createdAt: img.createdAt,
          })),
        })),
      }),
    }
  )
);

// Helper hooks for specific features
export const useCharacterBank = () => {
  const characters = useCreativeStore((state) => state.characters);
  const addCharacter = useCreativeStore((state) => state.addCharacter);
  const removeCharacter = useCreativeStore((state) => state.removeCharacter);
  const updateCharacter = useCreativeStore((state) => state.updateCharacter);
  const clearCharacters = useCreativeStore((state) => state.clearCharacters);

  return {
    characters,
    addCharacter,
    removeCharacter,
    updateCharacter,
    clearCharacters,
    canAddMore: characters.length < 5,
  };
};

export const useRecentGenerations = () => {
  const recentImages = useCreativeStore((state) => state.recentImages);
  const recentVideos = useCreativeStore((state) => state.recentVideos);
  const addRecentImage = useCreativeStore((state) => state.addRecentImage);
  const addRecentVideo = useCreativeStore((state) => state.addRecentVideo);

  return {
    recentImages,
    recentVideos,
    addRecentImage,
    addRecentVideo,
  };
};

export const useStoryboardCharacters = () => {
  const characters = useCreativeStore((state) => state.storyboardCharacters);
  const addCharacter = useCreativeStore((state) => state.addStoryboardCharacter);
  const updateCharacter = useCreativeStore((state) => state.updateStoryboardCharacter);
  const deleteCharacter = useCreativeStore((state) => state.deleteStoryboardCharacter);
  const addImageToCharacter = useCreativeStore((state) => state.addImageToStoryboardCharacter);
  const removeImageFromCharacter = useCreativeStore((state) => state.removeImageFromStoryboardCharacter);

  const getCharacterById = (id: string) => characters.find((c) => c.id === id);

  const searchCharacters = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addImageToCharacter,
    removeImageFromCharacter,
    getCharacterById,
    searchCharacters,
    canAddMore: characters.length < 10,
  };
};
