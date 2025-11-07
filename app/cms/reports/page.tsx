"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FiAlertTriangle, FiCreditCard, FiFileText, FiSearch, FiChevronDown, FiChevronUp, FiTrash2, FiEdit2, FiRefreshCw, FiClock } from "react-icons/fi";
import { GoPencil } from "react-icons/go";
import { IoBugOutline, IoWarningSharp } from "react-icons/io5";
import { PiCards } from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";

import Navbar from "@/app/_components/Navbar";
import ShuffleLoader from "@/app/_components/ShuffleLoader";
import StackedNotification from "@/app/_components/StackedNotification";

import { createClient } from "@/utils/supabase/client";

type ReportType = {
  id: string;
  reporter_user_id: string;
  reporter_name: string;
  report_type: "bug" | "flash_card" | "exam_question";
  report_message: string | null;
  reported_item_id: string | null;
  created_at: string;
  item_updated_at?: string | null;
};

export default function ReportsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportType[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [notifMessage, setNotifMessage] = useState<string>("");

  const showNotification = (msg: string) => {
    setNotifMessage(msg);
    setIsNotifOpen(true);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
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

      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        console.error("Error fetching reports:", error);
      } else if (data) {
        // Fetch updated_at timestamps for flash cards and exam questions
        const reportsWithTimestamps = await Promise.all(
          data.map(async (report) => {
            if (report.reported_item_id && report.report_type === "flash_card") {
              const { data: card } = await supabase.from("flash_cards").select("updated_at").eq("id", report.reported_item_id).single();
              return { ...report, item_updated_at: card?.updated_at };
            } else if (report.reported_item_id && report.report_type === "exam_question") {
              const { data: question } = await supabase.from("exam_questions").select("updated_at").eq("id", report.reported_item_id).single();
              return { ...report, item_updated_at: question?.updated_at };
            }
            return report;
          })
        );
        setReports(reportsWithTimestamps);
      }
    } catch (err) {
      setError("Failed to fetch reports");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBugReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showNotification(data.error || "Failed to delete bug report");
        return;
      }

      showNotification("Bug report deleted successfully");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (error) {
      console.error("Error deleting bug report:", error);
      showNotification("Failed to delete bug report");
    }
  };

  const handleRestoreFlashCard = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/flash-card/${reportId}/restore`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showNotification(data.error || "Failed to restore flash card");
        return;
      }

      showNotification("Flash card restored and report deleted");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (error) {
      console.error("Error restoring flash card:", error);
      showNotification("Failed to restore flash card");
    }
  };

  const handleDeleteFlashCard = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/flash-card/${reportId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showNotification(data.error || "Failed to delete flash card");
        return;
      }

      showNotification("Flash card and report deleted successfully");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (error) {
      console.error("Error deleting flash card:", error);
      showNotification("Failed to delete flash card");
    }
  };

  const handleRestoreExamQuestion = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/exam-question/${reportId}/restore`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showNotification(data.error || "Failed to restore exam question");
        return;
      }

      showNotification("Exam question restored and report deleted");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (error) {
      console.error("Error restoring exam question:", error);
      showNotification("Failed to restore exam question");
    }
  };

  const handleDeleteExamQuestion = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/exam-question/${reportId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showNotification(data.error || "Failed to delete exam question");
        return;
      }

      showNotification("Exam question and report deleted successfully");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (error) {
      console.error("Error deleting exam question:", error);
      showNotification("Failed to delete exam question");
    }
  };

  // Filter reports based on search query
  const filteredReports = reports.filter((report) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const nameMatch = report.reporter_name.toLowerCase().includes(query);
    const messageMatch = report.report_message?.toLowerCase().includes(query);
    const typeMatch = report.report_type.toLowerCase().includes(query);
    const idMatch = report.reported_item_id?.toLowerCase().includes(query);

    return nameMatch || messageMatch || typeMatch || idMatch;
  });

  // Group reports by type
  const groupedReports = filteredReports.reduce((acc, report) => {
    if (!acc[report.report_type]) {
      acc[report.report_type] = [];
    }
    acc[report.report_type].push(report);
    return acc;
  }, {} as Record<string, ReportType[]>);

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
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-slate-100">
      <Navbar />

      <section className="pt-32 px-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Reports Dashboard</h1>
          <p className="text-zinc-400 mb-6">View all user-submitted reports including bugs, flash card issues, and exam question problems.</p>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by reporter, message, type, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Reports" value={filteredReports.length} icon={<IoBugOutline />} color="bg-emerald-500" />
          <StatCard title="Bug Reports" value={groupedReports.bug?.length || 0} icon={<IoWarningSharp />} color="bg-yellow-500" />
          <StatCard title="Flash Card Reports" value={groupedReports.flash_card?.length || 0} icon={<PiCards />} color="bg-blue-500" />
          <StatCard title="Exam Question Reports" value={groupedReports.exam_question?.length || 0} icon={<GoPencil />} color="bg-red-500" />
        </div>

        {/* Reports by Type */}
        <div className="space-y-4">
          {Object.keys(groupedReports).length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <FiAlertTriangle className="mx-auto mb-4" size={48} />
              <p className="text-xl">No reports found</p>
            </div>
          ) : (
            <>
              {groupedReports.bug && (
                <ReportTypeSection
                  title="Bug Reports"
                  reports={groupedReports.bug}
                  icon={<FiAlertTriangle />}
                  color="yellow"
                  onDeleteBugReport={handleDeleteBugReport}
                  onRestoreFlashCard={handleRestoreFlashCard}
                  onDeleteFlashCard={handleDeleteFlashCard}
                  onRestoreExamQuestion={handleRestoreExamQuestion}
                  onDeleteExamQuestion={handleDeleteExamQuestion}
                />
              )}
              {groupedReports.flash_card && (
                <ReportTypeSection
                  title="Flash Card Reports"
                  reports={groupedReports.flash_card}
                  icon={<FiCreditCard />}
                  color="blue"
                  onDeleteBugReport={handleDeleteBugReport}
                  onRestoreFlashCard={handleRestoreFlashCard}
                  onDeleteFlashCard={handleDeleteFlashCard}
                  onRestoreExamQuestion={handleRestoreExamQuestion}
                  onDeleteExamQuestion={handleDeleteExamQuestion}
                />
              )}
              {groupedReports.exam_question && (
                <ReportTypeSection
                  title="Exam Question Reports"
                  reports={groupedReports.exam_question}
                  icon={<FiFileText />}
                  color="red"
                  onDeleteBugReport={handleDeleteBugReport}
                  onRestoreFlashCard={handleRestoreFlashCard}
                  onDeleteFlashCard={handleDeleteFlashCard}
                  onRestoreExamQuestion={handleRestoreExamQuestion}
                  onDeleteExamQuestion={handleDeleteExamQuestion}
                />
              )}
            </>
          )}
        </div>
      </section>

      <StackedNotification isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} message={notifMessage} />
    </main>
  );
}

const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        <div className={`${color} p-2 rounded-lg text-white`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
};

const ReportTypeSection = ({
  title,
  reports,
  icon,
  color,
  onDeleteBugReport,
  onRestoreFlashCard,
  onDeleteFlashCard,
  onRestoreExamQuestion,
  onDeleteExamQuestion,
}: {
  title: string;
  reports: ReportType[];
  icon: React.ReactNode;
  color: "yellow" | "blue" | "red";
  onDeleteBugReport: (reportId: string) => void;
  onRestoreFlashCard: (reportId: string) => void;
  onDeleteFlashCard: (reportId: string) => void;
  onRestoreExamQuestion: (reportId: string) => void;
  onDeleteExamQuestion: (reportId: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const colorClasses = {
    yellow: {
      bg: "bg-yellow-600",
      border: "border-yellow-500",
      text: "text-yellow-400",
    },
    blue: {
      bg: "bg-blue-600",
      border: "border-blue-500",
      text: "text-blue-400",
    },
    red: {
      bg: "bg-red-600",
      border: "border-red-500",
      text: "text-red-400",
    },
  };

  return (
    <div className="mb-4">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center p-4 bg-zinc-900 border-2 ${colorClasses[color].border} rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer`}
      >
        <div className="flex items-center gap-4">
          <div className={`${colorClasses[color].bg} p-2 rounded-lg text-white`}>{icon}</div>
          <div className="text-left">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-sm text-zinc-400">
              {reports.length} {reports.length === 1 ? "report" : "reports"}
            </p>
          </div>
        </div>
        <div className={colorClasses[color].text}>{isOpen ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}</div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="mt-4 space-y-4">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onDeleteBugReport={onDeleteBugReport}
                  onRestoreFlashCard={onRestoreFlashCard}
                  onDeleteFlashCard={onDeleteFlashCard}
                  onRestoreExamQuestion={onRestoreExamQuestion}
                  onDeleteExamQuestion={onDeleteExamQuestion}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReportCard = ({
  report,
  onDeleteBugReport,
  onRestoreFlashCard,
  onDeleteFlashCard,
  onRestoreExamQuestion,
  onDeleteExamQuestion,
}: {
  report: ReportType;
  onDeleteBugReport: (reportId: string) => void;
  onRestoreFlashCard: (reportId: string) => void;
  onDeleteFlashCard: (reportId: string) => void;
  onRestoreExamQuestion: (reportId: string) => void;
  onDeleteExamQuestion: (reportId: string) => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "bug":
        return "Bug Report";
      case "flash_card":
        return "Flash Card";
      case "exam_question":
        return "Exam Question";
      default:
        return type;
    }
  };

  const isRecentlyEdited = () => {
    if (!report.item_updated_at) return false;
    const updatedAt = new Date(report.item_updated_at);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return updatedAt > oneHourAgo;
  };

  const handleDelete = () => {
    if (report.report_type === "bug") {
      onDeleteBugReport(report.id);
    }
    setShowDeleteConfirm(false);
  };

  const handleRestore = () => {
    if (report.report_type === "flash_card") {
      onRestoreFlashCard(report.id);
    } else if (report.report_type === "exam_question") {
      onRestoreExamQuestion(report.id);
    }
    setShowRestoreConfirm(false);
  };

  const handleDeleteItem = () => {
    if (report.report_type === "flash_card") {
      onDeleteFlashCard(report.id);
    } else if (report.report_type === "exam_question") {
      onDeleteExamQuestion(report.id);
    }
    setShowDeleteItemConfirm(false);
  };

  const recentlyEdited = isRecentlyEdited();

  console.log(report);

  return (
    <>
      <div className={`bg-zinc-900 border rounded-lg p-6 transition-colors ${recentlyEdited ? "border-emerald-500 shadow-lg shadow-emerald-500/20" : "border-zinc-800 hover:border-zinc-700"}`}>
        {/* Recently Edited Badge */}
        {recentlyEdited && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
            <FiClock className="text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Recently edited (within last hour)</span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-lg font-semibold text-white mb-1">{report.reporter_name}</h4>
            <p className="text-sm text-zinc-400">{formatDate(report.created_at)}</p>
          </div>
          <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium">{getReportTypeLabel(report.report_type)}</span>
        </div>

        {/* Flash Card (if exists) */}
        {report.report_type === "exam_question" && (
          <div className="mb-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <p className="text-sm font-semibold text-zinc-400 mb-2">Message:</p>
            <p className="text-white whitespace-pre-wrap">{report.report_message}</p>
          </div>
        )}

        {/* Reported Item ID (if exists) */}
        {report.reported_item_id && (
          <div className="mb-4">
            <p className="text-sm text-zinc-400 mb-1">Reported Item ID:</p>
            <code className="px-3 py-2 bg-zinc-800 rounded text-xs text-indigo-400 font-mono block">{report.reported_item_id}</code>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          {report.report_type === "bug" && (
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer">
              <FiTrash2 />
              Delete Report
            </button>
          )}

          {report.report_type === "flash_card" && report.reported_item_id && (
            <>
              <button onClick={() => setShowRestoreConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer">
                <FiRefreshCw />
                Restore Card
              </button>
              <Link href={`/cms/flash-cards/${report.reported_item_id}`} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                <FiEdit2 />
                Edit Card
              </Link>
              <button onClick={() => setShowDeleteItemConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer">
                <FiTrash2 />
                Delete Card
              </button>
            </>
          )}

          {report.report_type === "exam_question" && report.reported_item_id && (
            <>
              <button onClick={() => setShowRestoreConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer">
                <FiRefreshCw />
                Restore Question
              </button>
              <Link href={`/cms/exam-questions/${report.reported_item_id}`} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                <FiEdit2 />
                Edit Question
              </Link>
              <button onClick={() => setShowDeleteItemConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer">
                <FiTrash2 />
                Delete Question
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500">Report ID: {report.id}</div>
          <div className="text-xs text-zinc-500">Reporter ID: {report.reporter_user_id}</div>
        </div>
      </div>

      {/* Delete Report Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Delete Report?</h3>
            <p className="text-zinc-400 mb-6">Are you sure you want to delete this bug report? This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold cursor-pointer">
                Yes, Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors font-semibold cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRestoreConfirm(false)}>
          <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Restore {report.report_type === "flash_card" ? "Flash Card" : "Exam Question"}?</h3>
            <p className="text-zinc-400 mb-6">
              This will unhide the {report.report_type === "flash_card" ? "flash card" : "exam question"} and delete this report. The item will be visible to all users again.
            </p>
            <div className="flex gap-4">
              <button onClick={handleRestore} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold cursor-pointer">
                Yes, Restore
              </button>
              <button onClick={() => setShowRestoreConfirm(false)} className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors font-semibold cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {showDeleteItemConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteItemConfirm(false)}>
          <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Delete {report.report_type === "flash_card" ? "Flash Card" : "Exam Question"}?</h3>
            <p className="text-zinc-400 mb-6">This will permanently delete the {report.report_type === "flash_card" ? "flash card" : "exam question"} and this report. This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={handleDeleteItem} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold cursor-pointer">
                Yes, Delete
              </button>
              <button onClick={() => setShowDeleteItemConfirm(false)} className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors font-semibold cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
