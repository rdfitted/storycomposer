import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const sceneImage = formData.get('sceneImage') as File;
    const productImage = formData.get('productImage') as File;
    const productName = formData.get('productName') as string;
    const xPercent = parseFloat(formData.get('xPercent') as string);
    const yPercent = parseFloat(formData.get('yPercent') as string);

    if (!sceneImage || !productImage || !productName || isNaN(xPercent) || isNaN(yPercent)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Generating composite image with:', {
      sceneImageSize: sceneImage.size,
      productImageSize: productImage.size,
      productName,
      position: { xPercent, yPercent }
    });

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Convert scene image to base64
    const sceneArrayBuffer = await sceneImage.arrayBuffer();
    const sceneBase64 = Buffer.from(sceneArrayBuffer).toString('base64');
    const sceneImagePart = {
      inlineData: {
        mimeType: sceneImage.type,
        data: sceneBase64
      }
    };

    // Convert product image to base64
    const productArrayBuffer = await productImage.arrayBuffer();
    const productBase64 = Buffer.from(productArrayBuffer).toString('base64');
    const productImagePart = {
      inlineData: {
        mimeType: productImage.type,
        data: productBase64
      }
    };

    // Create semantic location description based on position
    let locationDescription = '';
    if (xPercent < 25) locationDescription += 'on the left side of the scene';
    else if (xPercent > 75) locationDescription += 'on the right side of the scene';
    else locationDescription += 'in the center area of the scene';
    
    if (yPercent < 25) locationDescription += ', towards the top';
    else if (yPercent > 75) locationDescription += ', towards the bottom';
    else locationDescription += ', in the middle height';

    const prompt = `
**Role:**
You are a visual composition expert. Your task is to take a 'product' image and seamlessly integrate it into a 'scene' image, adjusting for perspective, lighting, and scale.

**Specifications:**
-   **Product to add:**
    The first image provided. It may be surrounded by black padding or background, which you should ignore and treat as transparent and only keep the product.
-   **Scene to use:**
    The second image provided. It may also be surrounded by black padding, which you should ignore.
-   **Placement Instruction (Crucial):**
    -   You must place the product at the location described below exactly. You should only place the product once. Use this dense, semantic description to find the exact spot in the scene.
    -   **Product location Description:** "The product should be placed ${locationDescription}, at approximately ${xPercent.toFixed(1)}% from the left and ${yPercent.toFixed(1)}% from the top of the image."
-   **Final Image Requirements:**
    -   The output image's style, lighting, shadows, reflections, and camera perspective must exactly match the original scene.
    -   Do not just copy and paste the product. You must intelligently re-render it to fit the context. Adjust the product's perspective and orientation to its most natural position, scale it appropriately, and ensure it casts realistic shadows according to the scene's light sources.
    -   The product must have proportional realism. For example, a lamp product can't be bigger than a sofa in scene.
    -   You must not return the original scene image without product placement. The product must be always present in the composite image.

The output should ONLY be the final, composed image. Do not add any text or explanation.
`;

    const textPart = { text: prompt };

    console.log('Sending images and prompt to Gemini...');

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [productImagePart, sceneImagePart, textPart] },
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 1.0,
      },
    });

    console.log('Received response from Gemini.');

    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
      const { mimeType, data } = imagePartFromResponse.inlineData;
      console.log(`Received image data (${mimeType}), length:`, data.length);
      const finalImageUrl = `data:${mimeType};base64,${data}`;
      
      return NextResponse.json({ 
        finalImageUrl,
        debugImageUrl: null, // No debug image for simplified version
        finalPrompt: prompt 
      });
    }

    console.error("Model response did not contain an image part.", response);
    throw new Error("The AI model did not return an image. Please try again.");

  } catch (error) {
    console.error('Error generating composite image:', error);
    return NextResponse.json(
      { error: 'Failed to generate composite image' },
      { status: 500 }
    );
  }
}