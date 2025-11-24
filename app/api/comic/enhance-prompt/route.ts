import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface CharacterContext {
  name: string;
  description: string;
}

interface PanelContext {
  position: number;
  prompt: string;
  hasImage: boolean;
}

interface StoryContext {
  projectTitle: string;
  style: string;
  characters: CharacterContext[];
  panelCharacters: string[]; // Names of characters in current panel
  previousPanels: PanelContext[];
  currentPanelPosition: number;
  scenicReference?: {
    pageNumber: number;
    panelPosition: number;
    prompt: string;
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, storyContext } = body as { prompt: string; storyContext: StoryContext };

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Build the enhancement prompt with full story context
    const systemPrompt = buildEnhancementPrompt(storyContext);

    const fullPrompt = `${systemPrompt}\n\nUser's brief prompt to enhance:\n"${prompt}"\n\nProvide ONLY the enhanced, detailed prompt with no preamble or explanation:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ],
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    const candidate = response.candidates?.[0];
    const responseText = candidate?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("No text in response:", JSON.stringify(response, null, 2));
      return NextResponse.json({ error: "No response from AI model" }, { status: 500 });
    }

    // Clean up the response - remove any "Enhanced prompt:" prefix if present
    let enhancedPrompt = responseText.trim();
    const prefixPatterns = [
      /^Enhanced prompt:\s*/i,
      /^Here's the enhanced prompt:\s*/i,
      /^Here is the enhanced prompt:\s*/i,
    ];
    for (const pattern of prefixPatterns) {
      enhancedPrompt = enhancedPrompt.replace(pattern, "");
    }

    return NextResponse.json({ enhancedPrompt });
  } catch (error: unknown) {
    console.error("Error enhancing prompt:", error);
    const errorMessage = error instanceof Error ? error.message : "Enhancement failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function buildEnhancementPrompt(context: StoryContext): string {
  let prompt = `You are an expert comic panel prompt writer. Your task is to take a brief, simple prompt from a user and transform it into a richly detailed, visually descriptive prompt that will help an AI image generator create the perfect comic panel.

## Your Role
- Expand vague descriptions into specific, visual details
- Add environmental details, lighting, mood, and atmosphere
- Describe character poses, expressions, and body language precisely
- Maintain consistency with the established story and characters
- Keep the enhanced prompt focused on a SINGLE comic panel
- Do NOT add dialogue or speech bubbles in your enhancement
- Output ONLY the enhanced prompt, no explanations or preamble

## Story Context`;

  prompt += `\n\n### Project: "${context.projectTitle}"`;
  prompt += `\n### Art Style: ${context.style}`;

  // Add character descriptions
  if (context.characters.length > 0) {
    prompt += `\n\n### Characters in This Story:`;
    context.characters.forEach((char) => {
      prompt += `\n- **${char.name}**: ${char.description || "No description provided"}`;
    });
  }

  // Add characters in current panel
  if (context.panelCharacters.length > 0) {
    prompt += `\n\n### Characters in THIS Panel: ${context.panelCharacters.join(", ")}`;
    prompt += `\nMake sure to describe these specific characters and their actions/expressions in detail.`;
  }

  // Add previous panels for story continuity
  if (context.previousPanels.length > 0) {
    prompt += `\n\n### Story So Far (Previous Panels):`;
    context.previousPanels.forEach((panel) => {
      if (panel.prompt) {
        prompt += `\n- Panel ${panel.position + 1}: ${panel.prompt}`;
      }
    });
    prompt += `\n\nUse this context to ensure the new panel follows logically from the story.`;
  }

  // Add scenic reference if set
  if (context.scenicReference) {
    prompt += `\n\n### Scene Location Reference:`;
    prompt += `\nThis panel takes place in the SAME LOCATION as Page ${context.scenicReference.pageNumber}, Panel ${context.scenicReference.panelPosition}.`;
    if (context.scenicReference.prompt) {
      prompt += `\nThat panel's description: "${context.scenicReference.prompt}"`;
    }
    prompt += `\nMaintain the same environmental details, setting, and atmosphere.`;
  }

  prompt += `\n\n### Current Panel Position: Panel ${context.currentPanelPosition + 1}`;

  prompt += `\n\n## Enhancement Guidelines
1. **Visual Specificity**: Replace vague words like "happy" with specific expressions like "beaming with a wide smile, eyes crinkled with joy"
2. **Composition**: Suggest framing (close-up, medium shot, wide shot) appropriate to the action
3. **Atmosphere**: Add lighting details (harsh shadows, soft ambient light, dramatic backlighting)
4. **Action Clarity**: Describe the exact moment being captured - the peak of action
5. **Environmental Details**: Add relevant background elements that enhance the scene
6. **Style Consistency**: Frame descriptions to match the ${context.style} art style
7. **Character Accuracy**: Reference the specific character descriptions provided above
8. **Story Flow**: Ensure the panel makes sense following the previous panels`;

  return prompt;
}
