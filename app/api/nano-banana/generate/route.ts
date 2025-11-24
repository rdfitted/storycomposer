import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface CameraControls {
  angle?: string;
  dof?: string;
  lighting?: string;
  colorGrading?: string;
  lens?: string;
}

interface TextOverlay {
  text: string;
  style: string;
  position: string;
}

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
    const negativePrompt = (form.get("negativePrompt") as string) || undefined;
    // Resolution and aspect ratio are parsed but the Gemini 3 image API
    // handles dimensions automatically based on model capabilities
    const _resolution = (form.get("resolution") as string) || "2K";
    const _aspectRatio = (form.get("aspectRatio") as string) || "1:1";
    const cameraControlsStr = form.get("cameraControls") as string | null;
    const textOverlayStr = form.get("textOverlay") as string | null;
    const referenceObjects = form.getAll("referenceObjects") as File[];

    // Log config for debugging (resolution/aspectRatio can be used for future enhancements)
    console.log(`Generating image with resolution: ${_resolution}, aspect: ${_aspectRatio}`);

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Parse camera controls
    let cameraControls: CameraControls | null = null;
    if (cameraControlsStr) {
      try {
        cameraControls = JSON.parse(cameraControlsStr);
      } catch {
        // Ignore parse errors
      }
    }

    // Parse text overlay
    let textOverlay: TextOverlay | null = null;
    if (textOverlayStr) {
      try {
        textOverlay = JSON.parse(textOverlayStr);
      } catch {
        // Ignore parse errors
      }
    }

    // Build enhanced prompt with camera controls
    let enhancedPrompt = prompt;

    if (cameraControls) {
      if (cameraControls.angle && cameraControls.angle !== "eye-level") {
        enhancedPrompt += `. Shot from ${cameraControls.angle.replace("-", " ")} angle`;
      }
      if (cameraControls.dof && cameraControls.dof !== "deep") {
        enhancedPrompt += `, ${cameraControls.dof.replace("-", " ")} depth of field`;
      }
      if (cameraControls.lighting && cameraControls.lighting !== "natural") {
        enhancedPrompt += `, ${cameraControls.lighting.replace("-", " ")} lighting`;
      }
      if (cameraControls.colorGrading && cameraControls.colorGrading !== "natural") {
        enhancedPrompt += `, ${cameraControls.colorGrading.replace("-", " ")} color grading`;
      }
      if (cameraControls.lens) {
        enhancedPrompt += `, shot with ${cameraControls.lens} lens`;
      }
    }

    if (textOverlay && textOverlay.text) {
      enhancedPrompt += `. Include visible text that reads: "${textOverlay.text}" rendered as ${textOverlay.style} style text at the ${textOverlay.position} of the image`;
    }

    if (negativePrompt) {
      enhancedPrompt += `. Avoid: ${negativePrompt}`;
    }

    // Build parts array with reference images first
    const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

    // Add reference images
    for (const file of referenceObjects) {
      try {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        parts.push({
          inlineData: {
            mimeType: file.type || "image/png",
            data: base64,
          },
        });
      } catch (e) {
        console.error("Error processing reference image:", e);
      }
    }

    // Add the text prompt
    parts.push({ text: enhancedPrompt });

    // Generate image using Gemini 3 Pro Image Preview (Nano Banana Pro)
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
          enhancedPrompt,
        });
      }
    }

    return NextResponse.json(
      { error: "No image generated. The model may have declined the request." },
      { status: 500 }
    );
  } catch (error: unknown) {
    console.error("Error in Nano Banana Pro generation:", error);
    const errorMessage = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
