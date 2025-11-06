import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Verify the report exists and is a flash_card report
    const { data: report, error: fetchError } = await supabase.from("reports").select("id, report_type, reported_item_id").eq("id", id).single();

    if (fetchError || !report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    if (report.report_type !== "flash_card") {
      return NextResponse.json({ success: false, error: "Report is not a flash card report" }, { status: 400 });
    }

    if (!report.reported_item_id) {
      return NextResponse.json({ success: false, error: "No flash card ID associated with this report" }, { status: 400 });
    }

    // Get the flash card to retrieve image URLs
    const { data: flashCard, error: cardError } = await supabase.from("flash_cards").select("front_image, back_image").eq("id", report.reported_item_id).single();

    if (cardError) {
      console.error("Error fetching flash card:", cardError);
    }

    // Delete images from Vercel Blob if they exist
    if (flashCard) {
      const imagesToDelete = [];
      if (flashCard.front_image) imagesToDelete.push(flashCard.front_image);
      if (flashCard.back_image) imagesToDelete.push(flashCard.back_image);

      if (imagesToDelete.length > 0) {
        try {
          await Promise.all(imagesToDelete.map((url) => del(url)));
        } catch (blobError) {
          console.error("Error deleting images from Vercel Blob:", blobError);
          // Continue with deletion even if blob deletion fails
        }
      }
    }

    // Delete the flash card
    const { error: deleteCardError } = await supabase.from("flash_cards").delete().eq("id", report.reported_item_id);

    if (deleteCardError) {
      console.error("Error deleting flash card:", deleteCardError);
      return NextResponse.json({ success: false, error: "Failed to delete flash card" }, { status: 500 });
    }

    // Delete the report
    const { error: deleteReportError } = await supabase.from("reports").delete().eq("id", id);

    if (deleteReportError) {
      console.error("Error deleting report:", deleteReportError);
      return NextResponse.json({ success: false, error: "Failed to delete report" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Flash card and report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting flash card:", error);
    return NextResponse.json({ success: false, error: "Failed to delete flash card" }, { status: 500 });
  }
}
