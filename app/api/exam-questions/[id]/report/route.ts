// app/api/exam-questions/[id]/report/route.ts
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

    // Verify the exam question exists and is not already hidden
    const { data: question, error: fetchError } = await supabase.from("exam_questions").select("id, is_hidden").eq("id", id).single();

    if (fetchError || !question) {
      return NextResponse.json({ success: false, error: "Exam question not found" }, { status: 404 });
    }

    if (question.is_hidden) {
      return NextResponse.json({ success: false, error: "Exam question is already hidden" }, { status: 400 });
    }

    // Insert report
    const { error: reportError } = await supabase.from("reports").insert({
      reporter_user_id: reporterUserId,
      reporter_name: reporterName,
      report_type: "exam_question",
      reported_item_id: id,
    });

    if (reportError) {
      console.error("Error creating report:", reportError);
      return NextResponse.json({ success: false, error: "Failed to create report" }, { status: 500 });
    }

    // Hide the exam question
    const { error: hideError } = await supabase
      .from("exam_questions")
      .update({
        is_hidden: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (hideError) {
      console.error("Error hiding exam question:", hideError);
      return NextResponse.json({ success: false, error: "Failed to hide exam question" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Exam question reported and hidden successfully",
    });
  } catch (error) {
    console.error("Error reporting exam question:", error);
    return NextResponse.json({ success: false, error: "Failed to report exam question" }, { status: 500 });
  }
}
