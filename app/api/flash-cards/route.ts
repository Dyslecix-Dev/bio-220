import { NextRequest, NextResponse } from "next/server";

import { put } from "@vercel/blob";

import { createClient } from "@/utils/supabase/server";

// Configure route to handle larger file uploads
export const runtime = "nodejs"; // Use Node.js runtime (not Edge)
export const maxDuration = 60; // Maximum execution time in seconds

// IMPORTANT: Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: false, // Disable default body parser
    responseLimit: false,
  },
};

// Create flash card
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "User not authenticated" });
    }

    // Parse the incoming form data with error handling
    let formData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      console.error("FormData parsing error:", parseError);
      return NextResponse.json({
        success: false,
        error: "Images are too large. Add only one image.",
      });
    }

    const topic = formData.get("topic") as string;
    const frontText = formData.get("frontText") as string;
    const backText = formData.get("backText") as string;
    const frontImageFile = formData.get("frontImage") as File | null;
    const backImageFile = formData.get("backImage") as File | null;
    const frontImageFolder = formData.get("frontImageFolder") as string;
    const backImageFolder = formData.get("backImageFolder") as string;

    // Validate file sizes (Vercel Blob has a limit, typically 4.5MB for free tier)
    const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB in bytes

    if (frontImageFile && frontImageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `Front image is too large (${(frontImageFile.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 4.5MB.`,
      });
    }

    if (backImageFile && backImageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `Back image is too large (${(backImageFile.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 4.5MB.`,
      });
    }

    if (!topic?.trim()) {
      return NextResponse.json({ success: false, error: "Topic is required" });
    }

    if (frontImageFile && frontImageFile.size > 0 && !frontImageFolder?.trim()) {
      return NextResponse.json({ success: false, error: "Front image folder is required" });
    }

    if (backImageFile && backImageFile.size > 0 && !backImageFolder?.trim()) {
      return NextResponse.json({ success: false, error: "Back image folder is required" });
    }

    // Upload images in parallel for better performance
    const uploadPromises = [];

    if (frontImageFile && frontImageFile.size > 0) {
      uploadPromises.push(
        (async () => {
          try {
            const filename = `${frontImageFolder}/${Date.now()}-front-${frontImageFile.name}`;
            const blob = await put(filename, frontImageFile, {
              access: "public",
              addRandomSuffix: true, // Ensures unique filenames
            });
            return { type: "front", url: blob.url };
          } catch (error) {
            console.error("Error uploading front image:", error);
            throw new Error("Failed to upload front image");
          }
        })()
      );
    }

    if (backImageFile && backImageFile.size > 0) {
      uploadPromises.push(
        (async () => {
          try {
            const filename = `${backImageFolder}/${Date.now()}-back-${backImageFile.name}`;
            const blob = await put(filename, backImageFile, {
              access: "public",
              addRandomSuffix: true, // Ensures unique filenames
            });
            return { type: "back", url: blob.url };
          } catch (error) {
            console.error("Error uploading back image:", error);
            throw new Error("Failed to upload back image");
          }
        })()
      );
    }

    // Wait for all uploads to complete
    let frontImageUrl = null;
    let backImageUrl = null;

    if (uploadPromises.length > 0) {
      const results = await Promise.all(uploadPromises);
      results.forEach((result) => {
        if (result.type === "front") frontImageUrl = result.url;
        if (result.type === "back") backImageUrl = result.url;
      });
    }

    const { error: insertError } = await supabase.from("flash_cards").insert({
      user_id: user.id,
      topic: topic.trim(),
      front_text: frontText?.trim() || null,
      back_text: backText?.trim() || null,
      front_image: frontImageUrl,
      back_image: backImageUrl,
      front_image_folder: frontImageUrl ? frontImageFolder?.trim() : null,
      back_image_folder: backImageUrl ? backImageFolder?.trim() : null,
    });

    if (insertError) {
      console.error("Error creating flash card:", insertError);
      return NextResponse.json({ success: false, error: insertError.message });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to create flash card";
    return NextResponse.json({ success: false, error: errorMessage });
  }
}
