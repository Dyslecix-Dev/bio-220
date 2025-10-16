"use server";

import { put } from "@vercel/blob";
import { createClient } from "@/utils/supabase/server";

export async function POST(formData: FormData) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Extract form data
    const topic = formData.get("topic") as string;
    const frontText = formData.get("frontText") as string;
    const backText = formData.get("backText") as string;
    const frontImageFile = formData.get("frontImage") as File | null;
    const backImageFile = formData.get("backImage") as File | null;
    const frontImageFolder = formData.get("frontImageFolder") as string;
    const backImageFolder = formData.get("backImageFolder") as string;

    // Validate required fields
    if (!topic?.trim()) {
      return { success: false, error: "Topic is required" };
    }

    // Validate folder names if images are provided
    if (frontImageFile && frontImageFile.size > 0 && !frontImageFolder?.trim()) {
      return { success: false, error: "Front image folder is required" };
    }

    if (backImageFile && backImageFile.size > 0 && !backImageFolder?.trim()) {
      return { success: false, error: "Back image folder is required" };
    }

    // Upload images if provided
    let frontImageUrl = null;
    let backImageUrl = null;

    if (frontImageFile && frontImageFile.size > 0) {
      const filename = `${frontImageFolder}/${Date.now()}-${frontImageFile.name}`;
      const blob = await put(filename, frontImageFile, {
        access: "public",
      });
      frontImageUrl = blob.url;
    }

    if (backImageFile && backImageFile.size > 0) {
      const filename = `${backImageFolder}/${Date.now()}-${backImageFile.name}`;
      const blob = await put(filename, backImageFile, {
        access: "public",
      });
      backImageUrl = blob.url;
    }

    // Insert flash card
    const { error: insertError } = await supabase.from("flash_cards").insert({
      user_id: user.id,
      topic: topic.trim(),
      front_text: frontText?.trim() || null,
      back_text: backText?.trim() || null,
      front_image: frontImageUrl,
      back_image: backImageUrl,
    });

    if (insertError) {
      console.error("Error creating flash card:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error:", err);
    return { success: false, error: "Failed to create flash card" };
  }
}
