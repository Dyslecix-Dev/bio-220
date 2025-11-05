// app/api/flash-cards/[id]/report/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reporterUserId, reporterName } = body;

    if (!reporterUserId || !reporterName) {
      return NextResponse.json({ success: false, error: "Missing reporter information" }, { status: 400 });
    }

    // Verify the flash card exists and is not already hidden
    const { data: card, error: fetchError } = await supabase.from("flash_cards").select("id, is_hidden").eq("id", id).single();

    if (fetchError || !card) {
      return NextResponse.json({ success: false, error: "Flash card not found" }, { status: 404 });
    }

    if (card.is_hidden) {
      return NextResponse.json({ success: false, error: "Flash card is already hidden" }, { status: 400 });
    }

    // Insert report
    const { error: reportError } = await supabase.from("reports").insert({
      reporter_user_id: reporterUserId,
      reporter_name: reporterName,
      report_type: "flash_card",
      reported_item_id: id,
    });

    if (reportError) {
      console.error("Error creating report:", reportError);
      return NextResponse.json({ success: false, error: "Failed to create report" }, { status: 500 });
    }

    // Hide the flash card
    const { error: hideError } = await supabase
      .from("flash_cards")
      .update({
        is_hidden: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (hideError) {
      console.error("Error hiding flash card:", hideError);
      return NextResponse.json({ success: false, error: "Failed to hide flash card" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Flash card reported and hidden successfully",
    });
  } catch (error) {
    console.error("Error reporting flash card:", error);
    return NextResponse.json({ success: false, error: "Failed to report flash card" }, { status: 500 });
  }
}
