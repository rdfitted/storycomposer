import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {

    const formData = await request.formData();
    const userPrompt = formData.get("prompt") as string;
    const editType = formData.get("editType") as string; // "retouch", "filter", "adjustment"
    const imageFile = formData.get("imageFile") as File;
    
    if (!userPrompt || !editType || !imageFile) {
      return NextResponse.json(
        { error: "Missing required fields: prompt, editType, and imageFile" },
        { status: 400 }
      );
    }

    // Convert file to Gemini API Part
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(arrayBuffer).toString('base64');
    const originalImagePart = { 
      inlineData: {
        mimeType: imageFile.type,
        data: imageBase64
      }
    };
    
    let prompt = "";
    
    switch (editType) {
      case "retouch":
        const hotspotX = formData.get("hotspotX") as string;
        const hotspotY = formData.get("hotspotY") as string;
        
        if (!hotspotX || !hotspotY) {
          return NextResponse.json(
            { error: "Missing hotspot coordinates for retouch edit" },
            { status: 400 }
          );
        }
        
        prompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspotX}, y: ${hotspotY}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image (outside the immediate edit area) must remain identical to the original.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;
        break;
        
      case "filter":
        prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${userPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- You MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Chinese').

Output: Return ONLY the final filtered image. Do not return text.`;
        break;
        
      case "adjustment":
        prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${userPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid editType. Must be 'retouch', 'filter', or 'adjustment'" },
          { status: 400 }
        );
    }

    const textPart = { text: prompt };

    console.log(`Starting ${editType} generation...`);
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: { parts: [originalImagePart, textPart] },
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 1.0,
      },
    });
    
    console.log(`Received response from model for ${editType}.`);

    // Extract image data from the response
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      return NextResponse.json({ error: "No content returned from AI" }, { status: 500 });
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
      return NextResponse.json({ error: "No image returned from AI" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      image: {
        imageBytes: imageData,
        mimeType: "image/png"
      }
    });

  } catch (error) {
    console.error("Error in AI Editor API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}