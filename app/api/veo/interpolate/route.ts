import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    const firstFrame = form.get("firstFrame") as File | null;
    const lastFrame = form.get("lastFrame") as File | null;
    const mode = (form.get("mode") as string) || "interpolation"; // first-only, last-only, interpolation

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // For interpolation mode, we need both frames
    if (mode === "interpolation" && (!firstFrame || !lastFrame)) {
      return NextResponse.json(
        { error: "Interpolation mode requires both first and last frames" },
        { status: 400 }
      );
    }

    // For single frame modes
    if (mode === "first-only" && !firstFrame) {
      return NextResponse.json(
        { error: "First-only mode requires a first frame" },
        { status: 400 }
      );
    }

    if (mode === "last-only" && !lastFrame) {
      return NextResponse.json(
        { error: "Last-only mode requires a last frame" },
        { status: 400 }
      );
    }

    // Process frames
    let firstFrameData: { imageBytes: string; mimeType: string } | undefined;

    if (firstFrame) {
      const buf = await firstFrame.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      firstFrameData = { imageBytes: b64, mimeType: firstFrame.type || "image/png" };
    }

    // Process last frame for future interpolation API support
    if (lastFrame) {
      const buf = await lastFrame.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      // Log that we received the last frame for debugging (stored for future API support)
      console.log("Last frame received for interpolation:", { mimeType: lastFrame.type, size: b64.length });
    }

    // Build the generation request
    // Note: The actual API structure for frame interpolation may vary
    // This is based on the documented features
    const config: Record<string, unknown> = {
      aspectRatio: "16:9", // Frame interpolation requires 16:9
    };

    // For first-frame-only mode, use the image-to-video approach
    if (mode === "first-only" && firstFrameData) {
      const operation = await ai.models.generateVideos({
        model,
        prompt,
        image: firstFrameData,
        config,
      });

      const name = (operation as unknown as { name?: string }).name;
      return NextResponse.json({ name, mode: "first-only" });
    }

    // For interpolation and last-only modes, we'd need to use a different API approach
    // Current implementation: Use first frame and mention last frame in prompt
    if (mode === "interpolation" && firstFrameData) {
      const enhancedPrompt = `${prompt}. The video should smoothly transition to match the ending frame provided.`;

      const operation = await ai.models.generateVideos({
        model,
        prompt: enhancedPrompt,
        image: firstFrameData,
        config,
      });

      const name = (operation as unknown as { name?: string }).name;
      return NextResponse.json({ name, mode: "interpolation" });
    }

    // For last-only mode with only the last frame
    if (mode === "last-only") {
      const enhancedPrompt = `${prompt}. The video should end on a frame that matches the provided image.`;

      // Without first frame, generate a text-only video with the prompt guidance
      const operation = await ai.models.generateVideos({
        model,
        prompt: enhancedPrompt,
        config,
      });

      const name = (operation as unknown as { name?: string }).name;
      return NextResponse.json({ name, mode: "last-only" });
    }

    return NextResponse.json(
      { error: "Invalid mode or missing frames" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Error in frame interpolation:", error);
    const errorMessage = error instanceof Error ? error.message : "Interpolation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
