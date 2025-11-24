import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string;
    const model = (formData.get("model") as string) || "gemini-3-pro-image-preview";
    
    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: "Missing or invalid prompt" }, { status: 400 });
    }
    
    if (prompt.length > 4000) { // Reasonable prompt length limit
      return NextResponse.json({ error: "Prompt too long" }, { status: 400 });
    }
    
    // Validate model parameter
    const allowedModels = ["gemini-3-pro-image-preview"];
    if (!allowedModels.includes(model)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    // Prepare content parts for the request
    const contentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: prompt }
    ];

    // Handle multiple reference images
    const imageFiles = formData.getAll("imageFiles") as File[];
    const imageBase64s = formData.getAll("imageBase64") as string[];
    const imageMimeTypes = formData.getAll("imageMimeType") as string[];

    // Process uploaded files with validation
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: "File too large" }, { status: 400 });
        }
        
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        contentParts.push({
          inlineData: {
            mimeType: file.type,
            data: base64
          }
        });
      }
    }
    
    // Limit total number of images
    if (contentParts.length > 51) { // 1 text + 50 images max
      return NextResponse.json({ error: "Too many images" }, { status: 400 });
    }

    // Process base64 images (from previous generations or other sources)
    for (let i = 0; i < imageBase64s.length; i++) {
      const base64 = imageBase64s[i];
      const mimeType = imageMimeTypes[i] || "image/png";
      
      if (base64) {
        contentParts.push({
          inlineData: {
            mimeType,
            data: base64
          }
        });
      }
    }

    console.log(`Generating image with ${contentParts.length - 1} reference images`);

    const resp = await ai.models.generateContent({
      model,
      contents: contentParts,
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
    // Don't expose internal error details to client
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}