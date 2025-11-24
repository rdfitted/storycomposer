import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = (body?.prompt as string) || "";
    const model = (body?.model as string) || "gemini-3-pro-image-preview";

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const resp = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 1.0,
      },
    });

    // Extract image data from the response
    const candidate = resp.candidates?.[0];
    if (!candidate?.content?.parts) {
      return NextResponse.json({ error: "No content returned" }, { status: 500 });
    }

    // Find the image part in the response
    let imageData = null;
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data;
        break;
      }
    }

    if (!imageData) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }

    return NextResponse.json({
      image: {
        imageBytes: imageData,
        mimeType: "image/png",
      },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
