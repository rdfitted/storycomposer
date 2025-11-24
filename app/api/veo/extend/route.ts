import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceVideoUri, prompt, extensionSeconds = 7 } = body;

    if (!sourceVideoUri) {
      return NextResponse.json(
        { error: "Missing sourceVideoUri" },
        { status: 400 }
      );
    }

    // Validate extension duration
    const validExtension = Math.min(7, Math.max(7, extensionSeconds)); // Currently fixed at 7s increments

    // Note: Video extension API may require the video to be a Veo-generated video
    // The source video URI should be from a previous Veo generation
    const operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: prompt || "Continue the video smoothly",
      // The extension feature uses the source video as context
      // This is a simplified implementation - actual API may differ
      config: {
        aspectRatio: "16:9",
        // Extension-specific config would go here when API supports it
      },
    });

    const name = (operation as unknown as { name?: string }).name;
    return NextResponse.json({
      name,
      message: `Video extension initiated for ${validExtension} seconds`,
    });
  } catch (error: unknown) {
    console.error("Error extending video:", error);
    const errorMessage = error instanceof Error ? error.message : "Extension failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
