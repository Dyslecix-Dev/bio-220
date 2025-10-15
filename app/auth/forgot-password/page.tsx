"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";

import { motion } from "motion/react";

import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";
import SplashButton from "@/app/_components/_buttons/SplashButton";

import { createClient } from "@/utils/supabase/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = await createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) console.error("Error:", error);

      setMessage({
        type: "success",
        text: "Check your email for a password reset link",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error sending reset password email. Please try again.",
      });
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 py-20 text-zinc-200 selection:bg-zinc-600">
      <motion.div
        initial={{
          opacity: 0,
          y: 25,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 1.25,
          ease: "easeInOut",
        }}
        className="relative z-10 mx-auto w-full max-w-xl p-4"
      >
        <div>
          <div className="mb-9 mt-6 space-y-1.5">
            <h1 className="text-2xl font-semibold">Reset your password</h1>
            <p className="text-zinc-400">Enter your email address and we&apos;ll send you a link to reset your password.</p>
          </div>
        </div>

        {message && <div className={`mb-4 p-3 rounded-md ${message.type === "success" ? "bg-green-900/50 text-green-200" : "bg-red-900/50 text-red-200"}`}>{message.text}</div>}

        <form onSubmit={handleResetPassword}>
          <div className="mb-6">
            <label htmlFor="email" className="mb-1.5 block text-zinc-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@provider.com"
              required
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
            />
          </div>

          <SplashButton type="submit" disabled={loading} className="w-full cursor-pointer">
            {loading ? "Sending..." : "Send Reset Link"}
          </SplashButton>

          <div className="mt-4 text-center">
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 text-sm">
              Back to login
            </Link>
          </div>
        </form>
      </motion.div>

      <GlowingDotsBackground />
    </div>
  );
}
