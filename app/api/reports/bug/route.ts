// app/api/reports/bug/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reporterUserId, reporterName, message } = body;

    // Validate required fields
    if (!reporterUserId || !reporterName) {
      return NextResponse.json({ success: false, error: "Missing reporter information" }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Bug description is required" }, { status: 400 });
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(reporterUserId);

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Insert bug report
    const { error: insertError } = await supabase.from("reports").insert({
      reporter_user_id: reporterUserId,
      reporter_name: reporterName,
      report_type: "bug",
      report_message: message.trim(),
    });

    if (insertError) {
      console.error("Error creating bug report:", insertError);
      return NextResponse.json({ success: false, error: "Failed to submit bug report" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Bug report submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting bug report:", error);
    return NextResponse.json({ success: false, error: "Failed to submit bug report" }, { status: 500 });
  }
}
