import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type FrameMode = "start-only" | "end-only" | "interpolation";

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
    const model = (form.get("model") as string) || "veo-3.1-generate-preview";
    const negativePrompt = (form.get("negativePrompt") as string) || undefined;
    const aspectRatio = (form.get("aspectRatio") as string) || undefined;
    const frameMode = (form.get("frameMode") as FrameMode) || undefined;

    // Character data for storyboard character consistency
    const characterDataStr = (form.get("characterData") as string) || undefined;
    let characterData: Array<{ name: string; description: string; imageUrl?: string }> | undefined;
    if (characterDataStr) {
      try {
        characterData = JSON.parse(characterDataStr);
      } catch {
        console.warn("[Veo] Failed to parse character data");
      }
    }

    // Advanced Veo 3.1 options
    const resolution = (form.get("resolution") as string) || "720p";
    const duration = parseInt(form.get("duration") as string) || 8;
    const personGeneration = (form.get("personGeneration") as string) || "allow";

    // Legacy single image support (for storyboard and backwards compatibility)
    const imageFile = form.get("imageFile");
    const imageBase64 = (form.get("imageBase64") as string) || undefined;
    const imageMimeType = (form.get("imageMimeType") as string) || undefined;

    // New dual frame support
    const startingFrame = form.get("startingFrame");
    const startingFrameBase64 = (form.get("startingFrameBase64") as string) || undefined;
    const startingFrameMimeType = (form.get("startingFrameMimeType") as string) || undefined;

    const endingFrame = form.get("endingFrame");
    const endingFrameBase64 = (form.get("endingFrameBase64") as string) || undefined;
    const endingFrameMimeType = (form.get("endingFrameMimeType") as string) || undefined;

    // Reference images (up to 3)
    const referenceImages: File[] = [];
    for (let i = 0; i < 3; i++) {
      const refImg = form.get(`referenceImage_${i}`);
      if (refImg && refImg instanceof File) {
        referenceImages.push(refImg);
      }
    }

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Process starting frame
    let startImage: { imageBytes: string; mimeType: string } | undefined;
    if (startingFrame && startingFrame instanceof File) {
      const buf = await startingFrame.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      startImage = { imageBytes: b64, mimeType: startingFrame.type || "image/png" };
    } else if (startingFrameBase64) {
      const cleaned = startingFrameBase64.includes(",")
        ? startingFrameBase64.split(",")[1]
        : startingFrameBase64;
      startImage = { imageBytes: cleaned, mimeType: startingFrameMimeType || "image/png" };
    }

    // Process ending frame
    let endImage: { imageBytes: string; mimeType: string } | undefined;
    if (endingFrame && endingFrame instanceof File) {
      const buf = await endingFrame.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      endImage = { imageBytes: b64, mimeType: endingFrame.type || "image/png" };
    } else if (endingFrameBase64) {
      const cleaned = endingFrameBase64.includes(",")
        ? endingFrameBase64.split(",")[1]
        : endingFrameBase64;
      endImage = { imageBytes: cleaned, mimeType: endingFrameMimeType || "image/png" };
    }

    // Legacy single image processing (for backwards compatibility with storyboard)
    let legacyImage: { imageBytes: string; mimeType: string } | undefined;
    if (imageFile && imageFile instanceof File) {
      const buf = await imageFile.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      legacyImage = { imageBytes: b64, mimeType: imageFile.type || "image/png" };
    } else if (imageBase64) {
      const cleaned = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;
      legacyImage = { imageBytes: cleaned, mimeType: imageMimeType || "image/png" };
    }

    // Determine which image to use for generation
    let image: { imageBytes: string; mimeType: string } | undefined;

    // If using new frame mode system
    if (frameMode) {
      if (frameMode === "start-only" && startImage) {
        image = startImage;
      } else if (frameMode === "end-only" && endImage) {
        // For end-only mode, we can't directly use the ending frame as a starting image
        // Instead, we'll enhance the prompt to guide toward the ending frame
        // and not pass an image (text-to-video)
        image = undefined;
      } else if (frameMode === "interpolation" && startImage) {
        // For interpolation, use the starting frame as the image
        // The ending frame context is added to the prompt
        image = startImage;
      }
    } else if (legacyImage) {
      // Legacy single image mode
      image = legacyImage;
    }

    // Build config with advanced options
    const config: Record<string, unknown> = {};

    if (aspectRatio) config.aspectRatio = aspectRatio;
    if (negativePrompt) config.negativePrompt = negativePrompt;

    // Resolution is only available for 8-second videos
    if (duration === 8 && resolution === "1080p") {
      config.resolution = "1080p";
    }

    // Person generation setting
    if (personGeneration === "block") {
      config.personGeneration = "dont_allow";
    }

    // Build enhanced prompt based on frame mode
    let enhancedPrompt = prompt;

    if (frameMode === "end-only" && endImage) {
      enhancedPrompt = `${prompt}. The video should conclude at a specific target frame - ensure smooth motion that naturally arrives at the final composition described. End with a stable, well-composed final frame.`;
    } else if (frameMode === "interpolation" && endImage) {
      enhancedPrompt = `${prompt}. The video should smoothly transition from the starting frame toward the ending composition. Create fluid motion that naturally bridges these two frames while maintaining visual consistency throughout.`;
    }

    // Add reference image context
    if (referenceImages.length > 0) {
      enhancedPrompt += "\n\nReference images are provided for visual consistency.";
    }

    // Add character descriptions for consistency
    if (characterData && characterData.length > 0) {
      const characterDescriptions = characterData
        .map((char) => {
          if (char.description) {
            return `- ${char.name}: ${char.description}`;
          }
          return `- ${char.name}`;
        })
        .join("\n");

      enhancedPrompt += `\n\nFeatured characters in this scene:\n${characterDescriptions}\n\nMaintain visual consistency for these characters throughout the video.`;
      console.log("[Veo] Enhanced prompt with character data:", characterData.map(c => c.name));
    }

    // Build the generation request
    const generateRequest: Record<string, unknown> = {
      model,
      prompt: enhancedPrompt,
      config,
    };

    // Add starting frame (image)
    if (image) {
      generateRequest.image = image;
    }

    // Add ending frame (lastFrame) for interpolation mode
    if (frameMode === "interpolation" && endImage) {
      generateRequest.lastFrame = endImage;
      console.log("[Veo] Using interpolation mode with start and end frames");
    }

    const operation = await ai.models.generateVideos(generateRequest as unknown as Parameters<typeof ai.models.generateVideos>[0]);

    const name = (operation as unknown as { name?: string }).name;
    return NextResponse.json({ name, frameMode: frameMode || "none" });
  } catch (error: unknown) {
    console.error("Error starting Veo generation:", error);
    return NextResponse.json(
      { error: "Failed to start generation" },
      { status: 500 }
    );
  }
}
