"use client";

import { useState, useEffect } from "react";
import { IoWarningSharp } from "react-icons/io5";
import { motion, AnimatePresence } from "motion/react";

import { createClient } from "@/utils/supabase/client";

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback after successful report
  reportType: "flash-card" | "exam-question";
  itemId: string; // ID of the item being reported
};

export default function ReportModal({ isOpen, onClose, onSuccess, reportType, itemId }: ReportModalProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

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
          return;
        }

        if (!session?.user) {
          return;
        }

        setUserId(session.user.id);

        const { data: profile, error: profileError } = await supabase.from("user_profiles").select("name").eq("id", session.user.id).single();

        if (profileError) {
          console.error("Error getting profile:", profileError);
          setUserName(session.user.email || "Anonymous");
        } else {
          setUserName(profile?.name || session.user.email || "Anonymous");
        }
      } catch (error) {
        console.error("Error in getUserData:", error);
      }
    };

    if (isOpen) {
      getUserData();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      console.error("User not authenticated");
      return;
    }

    setSubmitting(true);

    try {
      // Determine the API endpoint based on report type
      const endpoint = reportType === "flash-card" ? `/api/flash-cards/${itemId}/report` : `/api/exam-questions/${itemId}/report`;

      const response = await fetch(endpoint, {
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
        setSubmitting(false);
        return;
      }

      // Reset form state before calling success callback
      setMessage("");
      setSubmitting(false);

      // Call the success callback which will close the modal
      onSuccess();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setSubmitting(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessage("");
      setSubmitting(false);
    }
  }, [isOpen]);

  const getTitle = () => {
    return reportType === "flash-card" ? "Report Flash Card?" : "Report Exam Question?";
  };

  const getDescription = () => {
    return reportType === "flash-card"
      ? "Are you sure you want to report this card for misinformation? This card will be hidden from all users."
      : "Are you sure you want to report this question for misinformation? This question will be hidden from all users.";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl mx-4">
              {/* Icon */}
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-1 border-yellow-500">
                <IoWarningSharp className="h-6 w-6 text-yellow-500" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-zinc-100 text-center mb-4">{getTitle()}</h3>

              {/* Description */}
              <p className="text-zinc-400 text-center mb-6">{getDescription()}</p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Reporter Info Display */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
                  <p className="text-sm text-zinc-400">Reporting as:</p>
                  <p className="mt-1 font-medium text-zinc-200">{userName}</p>
                </div>

                {/* Misinformation Description */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-zinc-300">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe the misinformation in detail."
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
                    onClick={onClose}
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
