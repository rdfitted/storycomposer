import type { StoryboardCharacter } from '@/lib/types/storyboard-characters';

/**
 * Parse @mentions from prompt text
 * Returns array of character names mentioned
 */
export function parseMentions(text: string): string[] {
  // Match @Name or @"Name with spaces"
  const mentionRegex = /@(?:"([^"]+)"|(\w+))/g;
  const matches = text.matchAll(mentionRegex);
  return Array.from(matches, m => m[1] || m[2]);
}

/**
 * Find character IDs from @mentions in text
 */
export function findMentionedCharacterIds(
  text: string,
  characters: StoryboardCharacter[]
): string[] {
  const mentionedNames = parseMentions(text);
  const ids: string[] = [];

  for (const name of mentionedNames) {
    const char = characters.find(c =>
      c.name.toLowerCase() === name.toLowerCase()
    );
    if (char) {
      ids.push(char.id);
    }
  }

  return [...new Set(ids)]; // Dedupe
}

/**
 * Replace @mentions with character descriptions for enhanced prompts
 */
export function expandMentions(
  text: string,
  characters: StoryboardCharacter[]
): string {
  let expanded = text;

  for (const char of characters) {
    // Handle both @Name and @"Name with spaces"
    const patterns = [
      new RegExp(`@"${char.name}"`, 'gi'),
      new RegExp(`@${char.name.replace(/\s+/g, '')}`, 'gi'),
      new RegExp(`@${char.name}(?![a-zA-Z])`, 'gi'),
    ];

    for (const pattern of patterns) {
      if (char.description) {
        expanded = expanded.replace(pattern, `${char.name} (${char.description})`);
      } else {
        expanded = expanded.replace(pattern, char.name);
      }
    }
  }

  return expanded;
}

/**
 * Insert a character mention into text at cursor position
 */
export function insertMention(
  text: string,
  cursorPosition: number,
  characterName: string
): { text: string; newCursorPosition: number } {
  // Find the @ that triggered the autocomplete
  let atPosition = cursorPosition - 1;
  while (atPosition >= 0 && text[atPosition] !== '@') {
    atPosition--;
  }

  // Format the mention (use quotes if name has spaces)
  const mention = characterName.includes(' ')
    ? `@"${characterName}"`
    : `@${characterName}`;

  // Replace the @query with the full mention
  const before = text.slice(0, atPosition);
  const after = text.slice(cursorPosition);
  const newText = before + mention + ' ' + after;
  const newCursorPosition = atPosition + mention.length + 1;

  return { text: newText, newCursorPosition };
}

/**
 * Check if cursor is in a mention query (after @)
 */
export function getMentionQuery(
  text: string,
  cursorPosition: number
): { isInMention: boolean; query: string; startPosition: number } {
  // Look backwards from cursor for @
  let atPosition = -1;
  for (let i = cursorPosition - 1; i >= 0; i--) {
    if (text[i] === '@') {
      atPosition = i;
      break;
    }
    // Stop if we hit a space or newline (not in a mention)
    if (text[i] === ' ' || text[i] === '\n') {
      break;
    }
  }

  if (atPosition === -1) {
    return { isInMention: false, query: '', startPosition: -1 };
  }

  const query = text.slice(atPosition + 1, cursorPosition);
  return { isInMention: true, query, startPosition: atPosition };
}
