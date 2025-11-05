import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Delete a bug report
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Verify the report exists and is a bug report
    const { data: report, error: fetchError } = await supabase.from("reports").select("id, report_type").eq("id", id).single();

    if (fetchError || !report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    if (report.report_type !== "bug") {
      return NextResponse.json({ success: false, error: "Only bug reports can be deleted directly" }, { status: 400 });
    }

    // Delete the report
    const { error: deleteError } = await supabase.from("reports").delete().eq("id", id);

    if (deleteError) {
      console.error("Error deleting report:", deleteError);
      return NextResponse.json({ success: false, error: "Failed to delete report" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Bug report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json({ success: false, error: "Failed to delete report" }, { status: 500 });
  }
}
