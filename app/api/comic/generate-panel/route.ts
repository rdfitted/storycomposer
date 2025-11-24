import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface CharacterInfo {
  id?: string;
  name: string;
  description: string;
}

interface DialogueEntry {
  character: string;
  text: string;
}

const STYLE_PROMPTS: Record<string, string> = {
  manga: "Japanese manga style with dynamic poses, speed lines, expressive eyes, and dramatic shading. Characters should have anime-inspired features while maintaining their described physical characteristics",
  american: "American superhero comic style with bold colors, dynamic action, and strong linework. Characters must match their described physical attributes exactly",
  european: "European BD style like Tintin with clean lines, detailed backgrounds, and naturalistic proportions. Characters should look realistic while matching their descriptions precisely",
  webcomic: "Modern webcomic style with clean digital art, simple backgrounds, and expressive characters. Each character must be visually distinct and match their provided description",
  "graphic-novel": "Graphic novel style with mature themes, detailed artwork, and cinematic framing. Characters must be rendered with attention to their specific described features",
};

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 }
      );
    }

    const form = await req.formData();

    const prompt = (form.get("prompt") as string) || "";
    const style = (form.get("style") as string) || "webcomic";
    const charactersStr = form.get("characters") as string;
    const dialogueStr = form.get("dialogue") as string;
    const scenicContinuity = form.get("scenicContinuity") === "true";
    const scenicReferenceInfoStr = form.get("scenicReferenceInfo") as string;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Parse character info
    let characters: CharacterInfo[] = [];
    if (charactersStr) {
      try {
        characters = JSON.parse(charactersStr);
      } catch {
        // Ignore parse errors
      }
    }

    // Parse dialogue
    let dialogue: DialogueEntry[] = [];
    if (dialogueStr) {
      try {
        dialogue = JSON.parse(dialogueStr);
      } catch {
        // Ignore parse errors
      }
    }

    // Collect character reference images
    const characterImages: Array<{ characterId: string; data: string; mimeType: string }> = [];
    // Collect previous panel images for style continuity
    const previousPanelImages: Array<{ panelIndex: number; data: string; mimeType: string }> = [];
    // Scenic reference image
    let scenicReferenceImage: { data: string; mimeType: string } | null = null;

    for (const [key, value] of form.entries()) {
      if (key.startsWith("characterImage_") && value instanceof File) {
        const buffer = await value.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const parts = key.split("_");
        characterImages.push({
          characterId: parts[1],
          data: base64,
          mimeType: value.type || "image/png",
        });
      } else if (key.startsWith("previousPanel_") && value instanceof File) {
        const buffer = await value.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const panelIndex = parseInt(key.split("_")[1], 10);
        previousPanelImages.push({
          panelIndex,
          data: base64,
          mimeType: value.type || "image/png",
        });
      } else if (key === "scenicReferenceImage" && value instanceof File) {
        const buffer = await value.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        scenicReferenceImage = {
          data: base64,
          mimeType: value.type || "image/png",
        };
      }
    }

    // Parse scenic reference info
    let scenicReferenceInfo: { pageNumber: number; panelPosition: number } | null = null;
    if (scenicReferenceInfoStr) {
      try {
        scenicReferenceInfo = JSON.parse(scenicReferenceInfoStr);
      } catch {
        // Ignore parse errors
      }
    }

    // Sort previous panels by index
    previousPanelImages.sort((a, b) => a.panelIndex - b.panelIndex);

    // Build the enhanced prompt with strong character emphasis
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.webcomic;

    let enhancedPrompt = `You are creating a comic panel. Your PRIMARY responsibility is to accurately depict each character according to their detailed description below. Character accuracy is MORE IMPORTANT than artistic style.

## Art Style
${stylePrompt}

## Scene Description
${prompt}`;

    if (characters.length > 0) {
      enhancedPrompt += `

## CHARACTER DESCRIPTIONS (CRITICAL - FOLLOW EXACTLY)
The following character descriptions MUST be followed precisely. Each physical detail mentioned is intentional and required.
`;
      characters.forEach((char, index) => {
        enhancedPrompt += `
### CHARACTER ${index + 1}: ${char.name.toUpperCase()}
${char.description || "No specific description provided - use creative freedom"}

REQUIREMENTS for ${char.name}:
- Every physical attribute mentioned above MUST be visible in the artwork
- Maintain consistent appearance with any reference images provided
- Make this character visually distinct and recognizable
`;
      });

      enhancedPrompt += `
## CHARACTER CONSISTENCY CHECKLIST
Before finalizing, verify each character matches their description:
${characters.map(c => `- [ ] ${c.name}: All described features accurately depicted`).join('\n')}
`;
    }

    if (dialogue.length > 0) {
      enhancedPrompt += `

## DIALOGUE (Include in speech bubbles)`;
      dialogue.forEach((d) => {
        enhancedPrompt += `
- ${d.character} says: "${d.text}"`;
      });
    }

    enhancedPrompt += `

## FINAL INSTRUCTIONS
1. This is a SINGLE comic panel with clear panel borders
2. Character accuracy is the TOP PRIORITY - do not deviate from descriptions
3. Include speech bubbles for any dialogue
4. Apply the ${style} comic style while preserving character features
5. If reference images are provided, use them as the primary guide for character appearance`;

    // Build parts array with images properly associated to character context
    const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

    // If we have a specific scenic reference image, add it first with special emphasis
    if (scenicContinuity && scenicReferenceImage && scenicReferenceInfo) {
      parts.push({
        text: `## SCENE REFERENCE - CRITICAL
The following image is the SCENE REFERENCE from Page ${scenicReferenceInfo.pageNumber}, Panel ${scenicReferenceInfo.panelPosition}. The new panel MUST take place in the EXACT SAME LOCATION with IDENTICAL backgrounds.

SCENIC CONTINUITY REQUIREMENTS:
- The scene takes place in the SAME LOCATION as this reference
- Maintain IDENTICAL background elements, architecture, furniture, and environmental details
- Keep the same lighting conditions, time of day, and atmosphere
- Props and objects should remain in consistent positions unless the story requires movement
- Camera angle may change but the setting/location must be recognizably the same
- Match ALL visual details of the environment shown in this reference

Scene Reference Image:
`
      });
      parts.push({
        inlineData: {
          mimeType: scenicReferenceImage.mimeType,
          data: scenicReferenceImage.data,
        },
      });
      parts.push({ text: `\n---\nThe new panel MUST be set in this EXACT SAME LOCATION.\n\n` });
    }

    // If we have previous panel images, add them for style continuity
    if (previousPanelImages.length > 0) {
      parts.push({
        text: `## STYLE REFERENCE - PREVIOUS PANELS FROM THIS COMIC
The following images are previously generated panels from this same comic. You MUST match the exact art style, color palette, line weight, shading technique, and character rendering style used in these panels. This ensures visual continuity across the comic.

CRITICAL STYLE REQUIREMENTS:
- Match the exact same art style, line thickness, and coloring approach
- Characters should look identical to how they appear in previous panels
- Maintain the same level of detail and shading
- Use consistent panel border style
- Keep the same background treatment and color temperature

`
      });

      for (const panelImg of previousPanelImages) {
        parts.push({ text: `Previous Panel ${panelImg.panelIndex + 1}:` });
        parts.push({
          inlineData: {
            mimeType: panelImg.mimeType,
            data: panelImg.data,
          },
        });
      }

      parts.push({ text: `\n---\nThe new panel MUST match the visual style shown above.\n\n` });
    }

    // If we have character reference images, add them with context
    if (characterImages.length > 0) {
      // Group images by character
      const imagesByCharacter = new Map<string, typeof characterImages>();
      for (const img of characterImages) {
        const existing = imagesByCharacter.get(img.characterId) || [];
        existing.push(img);
        imagesByCharacter.set(img.characterId, existing);
      }

      // Add intro text about reference images
      parts.push({
        text: `## REFERENCE IMAGES FOR CHARACTERS
The following images show what each character should look like. Use these as the PRIMARY visual reference - the character in the generated panel MUST look like the person in these reference images.

`
      });

      // Add each character's images with their name
      for (const [characterId, images] of imagesByCharacter.entries()) {
        // Find the character by matching the ID in the image key
        const matchedChar = characters.find((c) => c.id && characterId.includes(c.id));
        const charName = matchedChar?.name || `Character`;
        const charDescription = matchedChar?.description || "";

        parts.push({ text: `### Reference images for ${charName}:` });
        if (charDescription) {
          parts.push({ text: `(Description: ${charDescription})` });
        }

        for (const img of images) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data,
            },
          });
        }

        parts.push({ text: `(The character ${charName} in the comic panel must match the appearance shown in the above reference image(s))\n` });
      }

      parts.push({ text: `---\nNow here is the full panel request:\n\n` });
    }

    // Add the main prompt
    parts.push({ text: enhancedPrompt });

    // Generate the panel
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    // Extract image from response
    const candidate = response.candidates?.[0];
    const responseParts = candidate?.content?.parts || [];

    for (const part of responseParts) {
      if (part.inlineData) {
        return NextResponse.json({
          image: {
            mimeType: part.inlineData.mimeType,
            imageBytes: part.inlineData.data,
          },
        });
      }
    }

    return NextResponse.json(
      { error: "No image generated. The model may have declined the request." },
      { status: 500 }
    );
  } catch (error: unknown) {
    console.error("Error in comic panel generation:", error);
    const errorMessage = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
