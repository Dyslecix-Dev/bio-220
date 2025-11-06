// app/api/reports/exam-question/[id]/delete/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Delete the exam question
    const { error: deleteQuestionError } = await supabase.from("exam_questions").delete().eq("id", report.reported_item_id);

    if (deleteQuestionError) {
      console.error("Error deleting exam question:", deleteQuestionError);
      return NextResponse.json({ success: false, error: "Failed to delete exam question" }, { status: 500 });
    }

    // Delete the report
    const { error: deleteReportError } = await supabase.from("reports").delete().eq("id", id);

    if (deleteReportError) {
      console.error("Error deleting report:", deleteReportError);
      return NextResponse.json({ success: false, error: "Failed to delete report" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Exam question and report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting exam question:", error);
    return NextResponse.json({ success: false, error: "Failed to delete exam question" }, { status: 500 });
  }
}
