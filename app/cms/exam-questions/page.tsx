"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FiEdit2, FiX, FiSearch, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { IoWarningSharp } from "react-icons/io5";

import { motion, AnimatePresence } from "motion/react";

import Navbar from "@/app/_components/Navbar";
import ShuffleLoader from "@/app/_components/ShuffleLoader";
import StackedNotification from "@/app/_components/StackedNotification";

import { createClient } from "@/utils/supabase/client";

type OptionType = {
  text: string;
  correct: boolean;
};

type ExamQuestionType = {
  id: string;
  user_id: string;
  question: string;
  options: OptionType[];
  exam_type: string;
  exam_number: string;
  created_at: string;
  updated_at: string;
};

export default function CMSExamQuestions() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestionType[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setMessage(msg);
    setIsNotifOpen(true);
  };

  useEffect(() => {
    fetchExamQuestions();
  }, []);

  const fetchExamQuestions = async () => {
    try {
      const supabase = await createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Get user profile for name
      const { data: profile } = await supabase.from("user_profiles").select("name").eq("id", user.id).single();

      setUserName(profile?.name || user.email || "Anonymous");

      const { data, error } = await supabase.from("exam_questions").select("*").eq("is_hidden", false).order("exam_type", { ascending: true }).order("exam_number", { ascending: true });

      if (error) {
        setError(error.message);
        console.error("Error fetching exam questions:", error);
      } else if (data) {
        setExamQuestions(data);
      }
    } catch (err) {
      setError("Failed to fetch exam questions");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const supabase = await createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showNotification("You must be logged in to delete questions");
        return;
      }

      const questionToDelete = examQuestions.find((q) => q.id === questionId);
      if (!questionToDelete) {
        showNotification("Question not found");
        return;
      }

      if (questionToDelete.user_id !== user.id) {
        showNotification("You can only delete your own exam questions");
        return;
      }

      const { error } = await supabase.from("exam_questions").delete().eq("id", questionId);

      if (error) {
        console.error("Error deleting question:", error);
        showNotification(`Failed to delete question: ${error.message}`);
        return;
      }

      setExamQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== questionId));
      showNotification("Exam question deleted successfully!");
    } catch (error) {
      console.error("Unexpected error deleting question:", error);
      showNotification("An unexpected error occurred while deleting the question");
    }
  };

  const handleReportQuestion = async (questionId: string) => {
    if (!currentUserId) {
      showNotification("You must be logged in to report questions");
      return;
    }

    try {
      const response = await fetch(`/api/exam-questions/${questionId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reporterUserId: currentUserId,
          reporterName: userName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Error submitting report:", data.error);
        showNotification(data.error || "Failed to report question");
        return;
      }

      showNotification("Question reported successfully and hidden from all users");

      // Remove the question from view
      setExamQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== questionId));
    } catch (error) {
      console.error("Error in handleReportQuestion:", error);
      showNotification("Failed to report question");
    }
  };

  // Group questions by exam type and number
  const groupedQuestions = examQuestions.reduce((acc, question) => {
    const key = `${question.exam_type}-${question.exam_number}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(question);
    return acc;
  }, {} as Record<string, ExamQuestionType[]>);

  // Sort questions within each group by created_at (most recent first)
  Object.keys(groupedQuestions).forEach((key) => {
    groupedQuestions[key].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  });

  // Sort groups: lecture first (1-16), then lab (1-14)
  const sortedGroups = Object.keys(groupedQuestions).sort((a, b) => {
    const [typeA, numA] = a.split("-");
    const [typeB, numB] = b.split("-");

    // If different types, lecture comes before lab
    if (typeA !== typeB) {
      return typeA === "lecture" ? -1 : 1;
    }

    // Same type, sort by exam number
    return parseInt(numA) - parseInt(numB);
  });

  if (loading) {
    return (
      <main className="min-h-screen overflow-hidden bg-zinc-950 flex items-center justify-center">
        <ShuffleLoader />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen overflow-hidden bg-zinc-950 text-white flex items-center justify-center">
        <Navbar />
        <div className="text-2xl text-red-400">Error: {error}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-white">
      <Navbar />

      <section className="pt-32 px-6 max-w-7xl mx-auto pb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold">All Exam Questions ({examQuestions.length})</h2>
          <Link href="/cms/exam-questions/create" className="text-indigo-400 hover:text-indigo-500 transition-colors text-lg font-semibold">
            + New Question
          </Link>
        </div>

        {sortedGroups.map((group) => (
          <ExamGroup key={group} groupName={group} questions={groupedQuestions[group]} onDeleteQuestion={handleDeleteQuestion} onReportQuestion={handleReportQuestion} currentUserId={currentUserId} />
        ))}
      </section>

      <StackedNotification isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} message={message} />
    </main>
  );
}

const ExamGroup = ({
  groupName,
  questions,
  onDeleteQuestion,
  onReportQuestion,
  currentUserId,
}: {
  groupName: string;
  questions: ExamQuestionType[];
  onDeleteQuestion: (questionId: string) => void;
  onReportQuestion: (questionId: string) => void;
  currentUserId: string | null;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const filteredQuestions = questions.filter((question) => {
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase();
    const questionMatch = question.question.toLowerCase().includes(query);
    const optionsMatch = question.options.some((opt) => opt.text.toLowerCase().includes(query));
    return questionMatch || optionsMatch;
  });

  const formatGroupName = (groupName: string) => {
    const [type, number] = groupName.split("-");
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);

    if (type === "lecture") {
      return `${capitalizedType} - Chapter ${number}`;
    } else if (type === "lab") {
      return `${capitalizedType} - Week ${number}`;
    }

    return groupName;
  };

  return (
    <div className="mb-4">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-zinc-900 border border-zinc-700 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="text-indigo-400">{isOpen ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}</div>
          <div className="text-left">
            <h3 className="text-2xl font-semibold text-zinc-300">{formatGroupName(groupName)}</h3>
            <p className="text-sm text-zinc-500">
              {filteredQuestions.length} {filteredQuestions.length === 1 ? "question" : "questions"}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="mt-4 space-y-4">
              {filteredQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} onDeleteQuestion={onDeleteQuestion} onReportQuestion={onReportQuestion} currentUserId={currentUserId} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Report Modal Component
const ReportModal = ({ isOpen, onClose, onConfirm, isSubmitting }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isSubmitting: boolean }) => {
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
              <h3 className="text-xl font-bold text-zinc-100 text-center mb-2">Report Misinformation?</h3>

              {/* Description */}
              <p className="text-zinc-400 text-center mb-6">Are you sure you want to report this question for misinformation? This question will be hidden from all users.</p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? "Reporting..." : "Report Question"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const QuestionCard = ({
  question,
  onDeleteQuestion,
  onReportQuestion,
  currentUserId,
}: {
  question: ExamQuestionType;
  onDeleteQuestion: (questionId: string) => void;
  onReportQuestion: (questionId: string) => void;
  currentUserId: string | null;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  const isOwner = currentUserId === question.user_id;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDeleteQuestion(question.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleReportClick = () => {
    setShowReportModal(true);
  };

  const confirmReport = async () => {
    setSubmittingReport(true);
    await onReportQuestion(question.id);
    setSubmittingReport(false);
    setShowReportModal(false);
  };

  const correctAnswers = question.options.filter((opt) => opt.correct).length;

  return (
    <>
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 hover:border-indigo-500 transition-colors">
        {/* Header with actions */}
        <div className="flex justify-between gap-2 mb-4">
          <button onClick={handleReportClick} className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-full transition-colors cursor-pointer" title="Report misinformation">
            <IoWarningSharp className="text-white" />
          </button>

          {isOwner && (
            <div className="flex gap-2">
              <button onClick={handleDeleteClick} className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors cursor-pointer" title="Delete question">
                <FiX className="text-white" />
              </button>
              <Link href={`/cms/exam-questions/${question.id}`} className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors" title="Edit question">
                <FiEdit2 className="text-white" />
              </Link>
            </div>
          )}
        </div>

        {/* Question Text */}
        <h4 className="text-xl font-semibold text-white mb-4">{question.question}</h4>

        {/* Options */}
        <div className="space-y-2 mb-4">
          {question.options.map((option, index) => (
            <div key={index} className={`p-3 rounded-md border ${option.correct ? "bg-green-900/30 border-green-600" : "bg-zinc-800 border-zinc-700"}`}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                <span className={option.correct ? "text-green-300" : "text-gray-300"}>{option.text}</span>
                {option.correct && <span className="ml-auto text-xs bg-green-600 px-2 py-1 rounded">Correct</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="flex justify-between items-center text-sm text-zinc-400">
          <span className="font-mono">ID: {question.id}</span>
          <span>
            {correctAnswers} correct answer{correctAnswers !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={cancelDelete}>
          <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Delete Question?</h3>
            <p className="text-zinc-400 mb-6">Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold cursor-pointer">
                Yes, Delete
              </button>
              <button onClick={cancelDelete} className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors font-semibold cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} onConfirm={confirmReport} isSubmitting={submittingReport} />
    </>
  );
};
