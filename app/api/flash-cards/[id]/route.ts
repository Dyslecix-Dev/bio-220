// app/api/flash-cards/[id]/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Gets a single flash card
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
        frontImageFolder: card.front_image_folder,
        backImageFolder: card.back_image_folder,
      },
    });
  } catch (error) {
    console.error("Error fetching flash card:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch flash card" }, { status: 500 });
  }
}

// Updates a single flash card
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    // Fetch existing card to get old image URLs and folders for cleanup
    const { data: existingCard, error: fetchError } = await supabase.from("flash_cards").select("front_image, back_image, front_image_folder, back_image_folder").eq("id", id).single();

    if (fetchError || !existingCard) {
      return NextResponse.json({ success: false, error: "Flash card not found" }, { status: 404 });
    }

    // Prepare update object with snake_case column names
    const updateData: Record<string, string | null> = {
      topic,
      front_text: frontText,
      back_text: backText,
    };

    // Handle front image upload or folder change
    if (frontImage) {
      // New file uploaded - delete old image if it exists
      if (existingCard.front_image) {
        try {
          await del(existingCard.front_image);
        } catch (error) {
          console.error("Error deleting old front image:", error);
        }
      }

      const fileName = `${frontImageFolder}/${Date.now()}-${frontImage.name}`;
      const blob = await put(fileName, frontImage, { access: "public" });

      updateData.front_image = blob.url;
      updateData.front_image_folder = frontImageFolder;
    } else if (removeFrontImage) {
      // Removing image - delete from storage
      if (existingCard.front_image) {
        try {
          await del(existingCard.front_image);
        } catch (error) {
          console.error("Error deleting front image:", error);
        }
      }
      updateData.front_image = null;
      updateData.front_image_folder = null;
    } else if (frontImageFolder && existingCard.front_image && frontImageFolder !== existingCard.front_image_folder) {
      try {
        // Fetch the existing blob
        const response = await fetch(existingCard.front_image);
        const blob = await response.blob();

        // Extract original filename
        const urlParts = existingCard.front_image.split("/");
        const originalFileName = urlParts[urlParts.length - 1];

        // Upload to new location
        const newFileName = `${frontImageFolder}/${originalFileName}`;
        const newBlob = await put(newFileName, blob, { access: "public" });

        // Delete old blob
        await del(existingCard.front_image);

        updateData.front_image = newBlob.url;
        updateData.front_image_folder = frontImageFolder;
      } catch (error) {
        console.error("Error moving front image:", error);
        throw new Error(`Failed to move front image: ${error}`);
      }
    }

    // Handle back image upload or folder change
    if (backImage) {
      // New file uploaded - delete old image if it exists
      if (existingCard.back_image) {
        try {
          await del(existingCard.back_image);
        } catch (error) {
          console.error("Error deleting old back image:", error);
        }
      }

      const fileName = `${backImageFolder}/${Date.now()}-${backImage.name}`;
      const blob = await put(fileName, backImage, { access: "public" });

      updateData.back_image = blob.url;
      updateData.back_image_folder = backImageFolder;
    } else if (removeBackImage) {
      // Removing image - delete from storage
      if (existingCard.back_image) {
        try {
          await del(existingCard.back_image);
        } catch (error) {
          console.error("Error deleting back image:", error);
        }
      }
      updateData.back_image = null;
      updateData.back_image_folder = null;
    } else if (backImageFolder && existingCard.back_image && backImageFolder !== existingCard.back_image_folder) {
      try {
        // Fetch the existing blob
        const response = await fetch(existingCard.back_image);
        const blob = await response.blob();

        // Extract original filename
        const urlParts = existingCard.back_image.split("/");
        const originalFileName = urlParts[urlParts.length - 1];

        // Upload to new location
        const newFileName = `${backImageFolder}/${originalFileName}`;
        const newBlob = await put(newFileName, blob, { access: "public" });

        // Delete old blob
        await del(existingCard.back_image);

        updateData.back_image = newBlob.url;
        updateData.back_image_folder = backImageFolder;
      } catch (error) {
        console.error("Error moving back image:", error);
        throw new Error(`Failed to move back image: ${error}`);
      }
    }

    // Update flash card in database
    const { error: updateError } = await supabase.from("flash_cards").update(updateData).eq("id", id);

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
