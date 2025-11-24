import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface VideoContext {
  aspectRatio: string;
  model: string;
  hasStartingFrame: boolean;
  hasEndingFrame: boolean;
  frameMode: "start-only" | "end-only" | "interpolation" | "none";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, context } = body as { prompt: string; context?: VideoContext };

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const systemPrompt = buildVideoEnhancementPrompt(context);

    const fullPrompt = `${systemPrompt}\n\nUser's video prompt to enhance:\n"${prompt}"\n\nProvide ONLY the enhanced, cinematic prompt with no preamble or explanation:`;

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

    // Clean up the response - remove any prefix patterns
    let enhancedPrompt = responseText.trim();
    const prefixPatterns = [
      /^Enhanced prompt:\s*/i,
      /^Here's the enhanced prompt:\s*/i,
      /^Here is the enhanced prompt:\s*/i,
      /^Enhanced video prompt:\s*/i,
    ];
    for (const pattern of prefixPatterns) {
      enhancedPrompt = enhancedPrompt.replace(pattern, "");
    }

    return NextResponse.json({ enhancedPrompt });
  } catch (error: unknown) {
    console.error("Error enhancing video prompt:", error);
    const errorMessage = error instanceof Error ? error.message : "Enhancement failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function buildVideoEnhancementPrompt(context?: VideoContext): string {
  let prompt = `You are an expert video prompt writer for AI video generation. Your task is to transform a brief user prompt into a richly detailed, cinematic description that will produce stunning AI-generated video.

## Your Role
- Expand vague descriptions into specific, visual details
- Add camera movements, angles, and cinematography directions
- Describe lighting, atmosphere, color grading, and mood
- Include motion descriptions - how subjects move through the scene
- Add environmental details that enhance the visual storytelling
- Keep the enhanced prompt focused and coherent
- Output ONLY the enhanced prompt, no explanations

## Video Enhancement Guidelines

### Camera & Cinematography
- Specify camera movements: dolly, pan, tilt, crane, tracking shot, steadicam
- Define framing: extreme close-up, close-up, medium shot, wide shot, establishing shot
- Add depth: foreground elements, background blur, parallax effects
- Consider the shot duration and pacing

### Motion & Movement
- Describe how subjects move: walking, running, floating, slow-motion
- Include environmental motion: wind, water, particles, light rays
- Add secondary motion: hair movement, fabric flow, atmospheric effects

### Atmosphere & Lighting
- Specify lighting style: golden hour, blue hour, dramatic shadows, soft diffused light
- Include color palette and color grading direction
- Add atmospheric effects: fog, mist, dust particles, lens flares
- Describe the overall mood and emotional tone

### Style & Quality
- Use cinematic vocabulary: rack focus, shallow depth of field, anamorphic
- Reference visual styles when appropriate: documentary, commercial, cinematic
- Aim for photorealistic, high-quality output`;

  if (context) {
    prompt += `\n\n## Current Video Settings`;
    prompt += `\n- Aspect Ratio: ${context.aspectRatio} (${context.aspectRatio === "16:9" ? "landscape/cinematic" : "portrait/vertical"})`;
    prompt += `\n- Model: ${context.model}`;

    if (context.frameMode !== "none") {
      prompt += `\n\n### Frame Context`;
      if (context.frameMode === "start-only" && context.hasStartingFrame) {
        prompt += `\n- Starting frame provided: The video should begin with this image and animate from it`;
        prompt += `\n- Focus the prompt on describing the motion and transformation FROM the starting image`;
      } else if (context.frameMode === "end-only" && context.hasEndingFrame) {
        prompt += `\n- Ending frame provided: The video should conclude at this image`;
        prompt += `\n- Focus the prompt on describing the journey TOWARD the ending image`;
      } else if (context.frameMode === "interpolation" && context.hasStartingFrame && context.hasEndingFrame) {
        prompt += `\n- Both starting and ending frames provided: The video should smoothly transition between them`;
        prompt += `\n- Focus the prompt on describing the TRANSFORMATION and motion between the two frames`;
        prompt += `\n- Consider what changes between start and end, and how that change should animate`;
      }
    }

    // Adjust for aspect ratio
    if (context.aspectRatio === "9:16") {
      prompt += `\n\n### Vertical Video Considerations`;
      prompt += `\n- Optimize composition for vertical viewing`;
      prompt += `\n- Consider center-weighted framing`;
      prompt += `\n- Vertical motion (rising, falling) can be especially effective`;
    }
  }

  return prompt;
}
