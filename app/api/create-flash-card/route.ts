"use server";

import { NextRequest, NextResponse } from "next/server";

import { put } from "@vercel/blob";

import { createClient } from "@/utils/supabase/server";

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

    // Parse the incoming form data
    const formData = await request.formData();

    const topic = formData.get("topic") as string;
    const frontText = formData.get("frontText") as string;
    const backText = formData.get("backText") as string;
    const frontImageFile = formData.get("frontImage") as File | null;
    const backImageFile = formData.get("backImage") as File | null;
    const frontImageFolder = formData.get("frontImageFolder") as string;
    const backImageFolder = formData.get("backImageFolder") as string;

    if (!topic?.trim()) {
      return NextResponse.json({ success: false, error: "Topic is required" });
    }

    if (frontImageFile && frontImageFile.size > 0 && !frontImageFolder?.trim()) {
      return NextResponse.json({ success: false, error: "Front image folder is required" });
    }

    if (backImageFile && backImageFile.size > 0 && !backImageFolder?.trim()) {
      return NextResponse.json({ success: false, error: "Back image folder is required" });
    }

    let frontImageUrl = null;
    let backImageUrl = null;

    if (frontImageFile && frontImageFile.size > 0) {
      const filename = `${frontImageFolder}/${Date.now()}-${frontImageFile.name}`;
      const blob = await put(filename, frontImageFile, { access: "public" });
      frontImageUrl = blob.url;
    }

    if (backImageFile && backImageFile.size > 0) {
      const filename = `${backImageFolder}/${Date.now()}-${backImageFile.name}`;
      const blob = await put(filename, backImageFile, { access: "public" });
      backImageUrl = blob.url;
    }

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
      return NextResponse.json({ success: false, error: insertError.message });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ success: false, error: "Failed to create flash card" });
  }
}
