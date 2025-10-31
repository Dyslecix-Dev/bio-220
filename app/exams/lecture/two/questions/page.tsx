import Link from "next/link";

import { createClient } from "@/utils/supabase/server";
import ExamQuestions from "@/app/_components/_exams/ExamQuestions";

export default async function LectureExamTwoQuestions() {
  const supabase = await createClient();

  // Fetch questions for lecture exam 2
  const { data: allQuestions, error } = await supabase.from("exam_questions").select("*").eq("exam_type", "lecture").eq("exam_number", "2");

  if (error) {
    console.error("Error fetching exam questions:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Exam</h2>
          <p className="text-red-400">Failed to load exam questions. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!allQuestions || allQuestions.length < 30) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Questions Available</h2>
          <p className="mb-4 text-zinc-400">There are no questions available for this exam yet.</p>
          <Link href="/" className="bg-indigo-500 text-white font-medium py-2 px-4 rounded transition-all hover:bg-indigo-600 active:scale-95 duration-300 cursor-pointer inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Shuffle and select 30 random questions
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  const selectedQuestions = shuffled.slice(0, 30);

  return <ExamQuestions multipleChoiceQuestions={selectedQuestions} examNumber={2} examType="lecture" />;
}
