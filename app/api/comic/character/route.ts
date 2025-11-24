import { NextResponse } from "next/server";

// In-memory storage for character data (in production, use a database)
const characterStore = new Map<string, {
  id: string;
  name: string;
  description: string;
  referenceImages: string[]; // base64 encoded
  createdAt: number;
}>();

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload for character references
      const form = await req.formData();
      const characterId = form.get("characterId") as string;
      const name = form.get("name") as string;
      const description = form.get("description") as string;
      const images = form.getAll("images") as File[];

      if (!characterId || !name) {
        return NextResponse.json(
          { error: "Missing characterId or name" },
          { status: 400 }
        );
      }

      // Convert images to base64
      const referenceImages: string[] = [];
      for (const image of images) {
        const buffer = await image.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        referenceImages.push(`data:${image.type};base64,${base64}`);
      }

      // Store character
      characterStore.set(characterId, {
        id: characterId,
        name,
        description: description || "",
        referenceImages,
        createdAt: Date.now(),
      });

      return NextResponse.json({
        success: true,
        character: {
          id: characterId,
          name,
          description,
          imageCount: referenceImages.length,
        },
      });
    } else {
      // Handle JSON request for character retrieval
      const body = await req.json();
      const { action, characterId } = body;

      if (action === "get" && characterId) {
        const character = characterStore.get(characterId);
        if (character) {
          return NextResponse.json({ character });
        }
        return NextResponse.json({ error: "Character not found" }, { status: 404 });
      }

      if (action === "list") {
        const characters = Array.from(characterStore.values()).map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          imageCount: c.referenceImages.length,
          createdAt: c.createdAt,
        }));
        return NextResponse.json({ characters });
      }

      if (action === "delete" && characterId) {
        characterStore.delete(characterId);
        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error in character API:", error);
    const errorMessage = error instanceof Error ? error.message : "Operation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const characterId = url.searchParams.get("id");

    if (characterId) {
      const character = characterStore.get(characterId);
      if (character) {
        return NextResponse.json({ character });
      }
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // List all characters
    const characters = Array.from(characterStore.values()).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      imageCount: c.referenceImages.length,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ characters });
  } catch (error: unknown) {
    console.error("Error in character GET:", error);
    const errorMessage = error instanceof Error ? error.message : "Operation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const characterId = url.searchParams.get("id");

    if (!characterId) {
      return NextResponse.json(
        { error: "Missing character ID" },
        { status: 400 }
      );
    }

    const existed = characterStore.has(characterId);
    characterStore.delete(characterId);

    return NextResponse.json({
      success: true,
      deleted: existed,
    });
  } catch (error: unknown) {
    console.error("Error in character DELETE:", error);
    const errorMessage = error instanceof Error ? error.message : "Operation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
