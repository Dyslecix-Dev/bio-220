// app/api/flash-cards/[id]/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Gets a single flash card
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Fetch flash card from Supabase
    const { data: card, error } = await supabase.from("flash_cards").select("*").eq("id", id).single();

    if (error || !card) {
      return NextResponse.json({ success: false, error: "Flash card not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: card.id,
        topic: card.topic,
        frontText: card.front_text,
        backText: card.back_text,
        frontImage: card.front_image,
        backImage: card.back_image,
      },
    });
  } catch (error) {
    console.error("Error fetching flash card:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch flash card" }, { status: 500 });
  }
}

// Updates a single flash card
export async function PUT(request: NextRequest, { params }: { params: { cardId: string } }) {
  try {
    const { cardId } = params;
    const formData = await request.formData();

    const topic = formData.get("topic") as string;
    const frontText = formData.get("frontText") as string;
    const backText = formData.get("backText") as string;
    const frontImage = formData.get("frontImage") as File | null;
    const frontImageFolder = formData.get("frontImageFolder") as string | null;
    const backImage = formData.get("backImage") as File | null;
    const backImageFolder = formData.get("backImageFolder") as string | null;
    const removeFrontImage = formData.get("removeFrontImage") === "true";
    const removeBackImage = formData.get("removeBackImage") === "true";

    // Prepare update object with snake_case column names
    const updateData: Record<string, string | null> = {
      topic,
      front_text: frontText,
      back_text: backText,
    };

    // Handle front image upload
    if (frontImage) {
      const fileName = `${Date.now()}-${frontImage.name}`;
      const filePath = `${frontImageFolder}/${fileName}`;
      const arrayBuffer = await frontImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage.from("flash-cards").upload(filePath, buffer, { upsert: true });

      if (uploadError) {
        throw new Error(`Failed to upload front image: ${uploadError.message}`);
      }

      const { data: publicData } = supabase.storage.from("flash-cards").getPublicUrl(filePath);

      updateData.front_image = publicData.publicUrl;
    } else if (removeFrontImage) {
      updateData.front_image = null;
    }

    // Handle back image upload
    if (backImage) {
      const fileName = `${Date.now()}-${backImage.name}`;
      const filePath = `${backImageFolder}/${fileName}`;
      const arrayBuffer = await backImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage.from("flash-cards").upload(filePath, buffer, { upsert: true });

      if (uploadError) {
        throw new Error(`Failed to upload back image: ${uploadError.message}`);
      }

      const { data: publicData } = supabase.storage.from("flash-cards").getPublicUrl(filePath);

      updateData.back_image = publicData.publicUrl;
      updateData.back_image_folder = backImageFolder;
    } else if (removeBackImage) {
      updateData.back_image = null;
      updateData.back_image_folder = null;
    }

    // Update flash card in database
    const { error: updateError } = await supabase.from("flash_cards").update(updateData).eq("id", cardId);

    if (updateError) {
      throw new Error(`Failed to update flash card: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "Flash card updated successfully",
    });
  } catch (error) {
    console.error("Error updating flash card:", error);
    return NextResponse.json({ success: false, error: (error as Error).message || "Failed to update flash card" }, { status: 500 });
  }
}
