import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface VoxelData {
  dimensions: [number, number, number];
  voxels: Array<{
    position: [number, number, number];
    color: [number, number, number];
  }>;
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

    const sourceImage = form.get("sourceImage") as File;
    const resolution = parseInt(form.get("resolution") as string) || 32;
    const style = (form.get("style") as string) || "blocky";
    const colorPalette = (form.get("colorPalette") as string) || "original";

    if (!sourceImage) {
      return NextResponse.json({ error: "Missing source image" }, { status: 400 });
    }

    // Convert image to base64
    const buffer = await sourceImage.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Build prompt for voxel generation
    const prompt = buildVoxelPrompt(resolution, style, colorPalette);

    // Use Gemini to analyze the image and generate voxel data
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: sourceImage.type || "image/png",
                data: base64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse voxel data from response
    const voxelData = parseVoxelData(text, resolution);

    if (!voxelData) {
      return NextResponse.json(
        { error: "Failed to generate valid voxel data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ voxelData });
  } catch (error: unknown) {
    console.error("Error in voxel generation:", error);
    const errorMessage = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function buildVoxelPrompt(resolution: number, style: string, colorPalette: string): string {
  let colorInstructions = "";
  switch (colorPalette) {
    case "limited-16":
      colorInstructions = "Use a limited palette of 16 distinct colors.";
      break;
    case "limited-32":
      colorInstructions = "Use a limited palette of 32 distinct colors.";
      break;
    default:
      colorInstructions = "Preserve the original colors as closely as possible.";
  }

  let styleInstructions = "";
  switch (style) {
    case "blocky":
      styleInstructions = "Make it look like Minecraft voxels - sharp edges, clearly defined blocks.";
      break;
    case "smooth":
      styleInstructions = "Fill in voxels to create smoother curves and transitions.";
      break;
    case "stylized":
      styleInstructions = "Interpret the image artistically, emphasizing key features.";
      break;
  }

  return `Analyze this image and convert it to a ${resolution}x${resolution}x${resolution} voxel representation.

${styleInstructions}
${colorInstructions}

IMPORTANT: Output ONLY valid JSON in the following format, no explanations:
{
  "dimensions": [${resolution}, ${resolution}, ${resolution}],
  "voxels": [
    {"position": [x, y, z], "color": [r, g, b]},
    ...
  ]
}

Where:
- x, y, z are integers from 0 to ${resolution - 1}
- r, g, b are integers from 0 to 255
- Include only filled voxels (no empty space)
- Limit output to the most important 500-1000 voxels that capture the essence of the image
- Y represents height (0 = bottom, ${resolution - 1} = top)
- The output should create a recognizable 3D representation when rendered

Analyze the image and generate the voxel data now:`;
}

function parseVoxelData(text: string, resolution: number): VoxelData | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*"dimensions"[\s\S]*"voxels"[\s\S]*\}/);
    if (!jsonMatch) {
      // If no valid JSON, generate a simple placeholder
      return generatePlaceholderVoxels(resolution);
    }

    const data = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!data.dimensions || !Array.isArray(data.voxels)) {
      return generatePlaceholderVoxels(resolution);
    }

    // Validate and sanitize voxels
    const validVoxels = data.voxels
      .filter((v: { position?: number[]; color?: number[] }) => {
        if (!v.position || !v.color) return false;
        if (!Array.isArray(v.position) || v.position.length !== 3) return false;
        if (!Array.isArray(v.color) || v.color.length !== 3) return false;
        return v.position.every((p: number) => p >= 0 && p < resolution);
      })
      .map((v: { position: number[]; color: number[] }) => ({
        position: v.position.map((p: number) => Math.floor(p)) as [number, number, number],
        color: v.color.map((c: number) => Math.max(0, Math.min(255, Math.floor(c)))) as [number, number, number],
      }))
      .slice(0, 2000); // Limit for performance

    return {
      dimensions: [resolution, resolution, resolution],
      voxels: validVoxels,
    };
  } catch (e) {
    console.error("Error parsing voxel data:", e);
    return generatePlaceholderVoxels(resolution);
  }
}

function generatePlaceholderVoxels(resolution: number): VoxelData {
  // Generate a simple cube as placeholder
  const voxels: VoxelData["voxels"] = [];
  const size = Math.floor(resolution * 0.6);
  const offset = Math.floor((resolution - size) / 2);

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        // Only include surface voxels for efficiency
        if (
          x === 0 || x === size - 1 ||
          y === 0 || y === size - 1 ||
          z === 0 || z === size - 1
        ) {
          voxels.push({
            position: [x + offset, y + offset, z + offset],
            color: [
              Math.floor(100 + (x / size) * 155),
              Math.floor(100 + (y / size) * 155),
              Math.floor(100 + (z / size) * 155),
            ],
          });
        }
      }
    }
  }

  return {
    dimensions: [resolution, resolution, resolution],
    voxels,
  };
}
