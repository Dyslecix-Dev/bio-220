"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiPlus, FiX, FiCheck } from "react-icons/fi";

import Navbar from "@/app/_components/Navbar";
import ShuffleLoader from "@/app/_components/ShuffleLoader";

import { createClient } from "@/utils/supabase/client";

const EXAM_TYPE_OPTIONS = [
  { value: "lecture", label: "Lecture" },
  { value: "lab", label: "Lab" },
];

// Restricted to only specific exams
const EXAM_NUMBER_OPTIONS: Record<string, { value: string; label: string }[]> = {
  lecture: [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
  ],
  lab: [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
  ],
};

type OptionType = {
  text: string;
  correct: boolean;
};

export default function CreateExamQuestion() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [examType, setExamType] = useState("");
  const [examNumber, setExamNumber] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<OptionType[]>([
    { text: "", correct: false },
    { text: "", correct: false },
  ]);

  // Handle exam type change and reset exam number
  const handleExamTypeChange = (type: string) => {
    setExamType(type);
    setExamNumber(""); // Reset exam number when type changes
  };

  // Get available exam numbers based on selected type
  const availableExamNumbers = examType ? EXAM_NUMBER_OPTIONS[examType] || [] : [];

  // Add new option
  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, { text: "", correct: false }]);
    }
  };

  // Remove option
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  // Update option text
  const updateOptionText = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  // Toggle option correct status
  const toggleOptionCorrect = (index: number) => {
    const newOptions = [...options];
    newOptions[index].correct = !newOptions[index].correct;
    setOptions(newOptions);
  };

  // Validate form
  const validateForm = () => {
    if (!examType) {
      setError("Please select an exam type");
      return false;
    }

    if (!examNumber) {
      setError("Please select an exam number");
      return false;
    }

    if (!question.trim()) {
      setError("Please enter a question");
      return false;
    }

    if (options.length < 2 || options.length > 5) {
      setError("You must have between 2 and 5 options");
      return false;
    }

    if (options.some((opt) => !opt.text.trim())) {
      setError("All options must have text");
      return false;
    }

    const correctCount = options.filter((opt) => opt.correct).length;
    if (correctCount === 0) {
      setError("At least one option must be marked as correct");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const supabase = await createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to create exam questions");
        setLoading(false);
        return;
      }

      // Insert the exam question
      const { data, error: insertError } = await supabase
        .from("exam_questions")
        .insert({
          user_id: user.id,
          exam_type: examType,
          exam_number: examNumber,
          question: question.trim(),
          options: options.map((opt) => ({
            text: opt.text.trim(),
            correct: opt.correct,
          })),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating exam question:", insertError);
        setError(`Failed to create exam question: ${insertError.message}`);
        setLoading(false);
        return;
      }

      // Success - redirect to CMS page
      router.push("/cms/exam-questions");
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred while creating the exam question");
      setLoading(false);
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
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-white">
      <Navbar />

      <section className="pt-32 px-6 max-w-3xl mx-auto pb-12">
        <h1 className="text-4xl font-bold mb-8">Create Exam Question</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Type - Required */}
          <div>
            <label htmlFor="examType" className="block text-sm font-semibold mb-2">
              Exam Type <span className="text-red-500">*</span>
            </label>
            <select
              id="examType"
              value={examType}
              onChange={(e) => handleExamTypeChange(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              required
            >
              <option value="">Select exam type...</option>
              {EXAM_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Number - Required */}
          <div>
            <label htmlFor="examNumber" className="block text-sm font-semibold mb-2">
              Exam Number <span className="text-red-500">*</span>
            </label>
            <select
              id="examNumber"
              value={examNumber}
              onChange={(e) => setExamNumber(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={!examType}
            >
              <option value="">{examType ? "Select exam number..." : "Select exam type first..."}</option>
              {availableExamNumbers.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {examType && <p className="mt-1 text-xs text-zinc-400">{examType === "lecture" ? "Available: 1-3" : "Available: 1-5"}</p>}
          </div>

          {/* Question - Required */}
          <div>
            <label htmlFor="question" className="block text-sm font-semibold mb-2">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter the exam question..."
              required
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold">
                Answer Options <span className="text-red-500">*</span>
                <span className="text-xs text-zinc-400 ml-2">(2-5 options, at least 1 must be correct)</span>
              </label>
              {options.length < 5 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-semibold transition-colors transition-300 cursor-pointer"
                >
                  <FiPlus /> Add Option
                </button>
              )}
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  {/* Option Letter */}
                  <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-zinc-700 rounded text-sm font-semibold">{String.fromCharCode(65 + index)}</div>

                  {/* Option Text Input */}
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOptionText(index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    required
                  />

                  {/* Correct Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleOptionCorrect(index)}
                    className={`flex-shrink-0 p-2 rounded-lg transition-colors cursor-pointer ${option.correct ? "bg-green-600 hover:bg-green-700" : "bg-zinc-700 hover:bg-zinc-600"}`}
                    title={option.correct ? "Marked as correct" : "Mark as correct"}
                  >
                    <FiCheck className={option.correct ? "text-white" : "text-zinc-400"} />
                  </button>

                  {/* Remove Button */}
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="flex-shrink-0 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                      title="Remove option"
                    >
                      <FiX className="text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Helper Text */}
            <p className="mt-2 text-xs text-zinc-400">Click the checkmark to mark an option as correct. You can have multiple correct answers.</p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors cursor-pointer"
            >
              {loading ? "Creating..." : "Create Question"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => router.push("/cms/exam-questions")}
              className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
