import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Delete blob images
export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    // Delete each image from Vercel Blob
    const deletePromises = urls.map((url) => del(url));
    await Promise.all(deletePromises);

    return NextResponse.json({ success: true, deleted: urls.length });
  } catch (error) {
    console.error("Error deleting images:", error);
    return NextResponse.json({ error: "Failed to delete images", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
