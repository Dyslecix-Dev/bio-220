import { NextRequest, NextResponse } from "next/server";

import { type EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (!tokenHash || !type) {
    console.error("Missing token_hash or type");
    const errorUrl = new URL("/auth/error", request.url);
    errorUrl.searchParams.set("message", "Invalid confirmation link");
    return NextResponse.redirect(errorUrl);
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (error) {
      console.error("OTP verification error:", error);
      const errorUrl = new URL("/auth/error", request.url);
      errorUrl.searchParams.set("message", error.message);
      return NextResponse.redirect(errorUrl);
    }

    const redirectUrl = new URL(next, request.url);
    redirectUrl.searchParams.delete("token_hash");
    redirectUrl.searchParams.delete("type");

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Unexpected error in confirmation route:", error);
    const errorUrl = new URL("/auth/error", request.url);
    errorUrl.searchParams.set("message", "An unexpected error occurred");
    return NextResponse.redirect(errorUrl);
  }
}
