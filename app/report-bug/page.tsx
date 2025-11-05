"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import Navbar from "@/app/_components/Navbar";
import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";
import ShuffleLoader from "@/app/_components/ShuffleLoader";
import StackedNotification from "@/app/_components/StackedNotification";

import { createClient } from "@/utils/supabase/client";

export default function ReportBug() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [notifMessage, setNotifMessage] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();

    const getUserData = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setNotifMessage("Please log in to report a bug.");
          setIsNotifOpen(true);
          setLoading(false);
          return;
        }

        if (!session?.user) {
          setNotifMessage("Please log in to report a bug.");
          setIsNotifOpen(true);
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        // Get user profile for name
        const { data: profile, error: profileError } = await supabase.from("user_profiles").select("name").eq("id", session.user.id).single();

        if (profileError) {
          console.error("Error getting profile:", profileError);
          setUserName(session.user.email || "Anonymous");
        } else {
          setUserName(profile?.name || session.user.email || "Anonymous");
        }
      } catch (error) {
        console.error("Error in getUserData:", error);
        setNotifMessage("An error occurred. Please try again.");
        setIsNotifOpen(true);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setNotifMessage("Please enter a bug description.");
      setIsNotifOpen(true);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reports/bug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reporterUserId: userId,
          reporterName: userName,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Error submitting report:", data.error);
        setNotifMessage(data.error || "Failed to submit report. Please try again.");
        setIsNotifOpen(true);
        setSubmitting(false);
        return;
      }

      setNotifMessage("Bug report submitted successfully!");
      setIsNotifOpen(true);
      setMessage("");

      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setNotifMessage("An error occurred. Please try again.");
      setIsNotifOpen(true);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen overflow-hidden bg-zinc-950 flex items-center justify-center">
        <ShuffleLoader />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950">
      <Navbar />
      <StackedNotification isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} message={notifMessage} />
      <div className="relative z-20 mx-auto flex min-h-[calc(100vh-80px)] max-w-2xl flex-col items-center justify-center px-4 py-24 md:px-8">
        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-zinc-100">Report a Bug</h1>
            <p className="mt-2 text-zinc-400">Help us improve by reporting any issues you encounter</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reporter Info Display */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
              <p className="text-sm text-zinc-400">Reporting as:</p>
              <p className="mt-1 font-medium text-zinc-200">{userName}</p>
            </div>

            {/* Bug Description */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-300">
                Bug Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe the bug you encountered in detail. Include what you were doing when it happened, what you expected to happen, and what actually happened."
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 placeholder-zinc-500 transition-colors focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                disabled={submitting}
                required
              />
              <p className="mt-2 text-xs text-zinc-500">{message.length} characters</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-3 font-medium text-zinc-300 transition-colors duration-300 hover:bg-zinc-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-yellow-500 px-6 py-3 font-medium text-zinc-900 transition-all duration-300 hover:bg-yellow-400 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                disabled={submitting || !message.trim()}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-300">Tips for a good bug report:</h3>
            <ul className="space-y-1 text-sm text-zinc-400">
              <li>• Be specific about what happened</li>
              <li>• Include steps to reproduce the issue</li>
              <li>• Mention which page or feature was affected</li>
              <li>• Note any error messages you saw</li>
            </ul>
          </div>
        </div>
      </div>
      <GlowingDotsBackground />
    </main>
  );
}
