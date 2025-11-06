// app/api/reports/exam-question/[id]/restore/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Verify the report exists and is an exam_question report
    const { data: report, error: fetchError } = await supabase.from("reports").select("id, report_type, reported_item_id").eq("id", id).single();

    if (fetchError || !report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    if (report.report_type !== "exam_question") {
      return NextResponse.json({ success: false, error: "Report is not an exam question report" }, { status: 400 });
    }

    if (!report.reported_item_id) {
      return NextResponse.json({ success: false, error: "No exam question ID associated with this report" }, { status: 400 });
    }

    // Restore the exam question (set is_hidden to false)
    const { error: restoreError } = await supabase
      .from("exam_questions")
      .update({
        is_hidden: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.reported_item_id);

    if (restoreError) {
      console.error("Error restoring exam question:", restoreError);
      return NextResponse.json({ success: false, error: "Failed to restore exam question" }, { status: 500 });
    }

    // Delete the report
    const { error: deleteError } = await supabase.from("reports").delete().eq("id", id);

    if (deleteError) {
      console.error("Error deleting report:", deleteError);
      return NextResponse.json({ success: false, error: "Failed to delete report" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Exam question restored and report deleted successfully",
    });
  } catch (error) {
    console.error("Error restoring exam question:", error);
    return NextResponse.json({ success: false, error: "Failed to restore exam question" }, { status: 500 });
  }
}
