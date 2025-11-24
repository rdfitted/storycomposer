// Storyboard Character Management Types

export interface CharacterImage {
  id: string;
  url: string;         // Data URL for display
  file?: File;         // Original file for upload (not persisted)
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

// For Zustand store actions
export interface StoryboardCharacterActions {
  // Storyboard characters (separate from NanoBanana characters)
  storyboardCharacters: StoryboardCharacter[];
  addStoryboardCharacter: (char: Omit<StoryboardCharacter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStoryboardCharacter: (id: string, updates: Partial<Omit<StoryboardCharacter, 'id' | 'createdAt'>>) => void;
  deleteStoryboardCharacter: (id: string) => void;
  addImageToStoryboardCharacter: (charId: string, image: Omit<CharacterImage, 'id' | 'createdAt'>) => void;
  removeImageFromStoryboardCharacter: (charId: string, imageId: string) => void;
  getStoryboardCharacterById: (id: string) => StoryboardCharacter | undefined;
  searchStoryboardCharacters: (query: string) => StoryboardCharacter[];
}

// Max limits
export const MAX_STORYBOARD_CHARACTERS = 10;
export const MAX_CHARACTER_IMAGES = 5;
export const MAX_CHARACTERS_PER_SCENE = 3;
