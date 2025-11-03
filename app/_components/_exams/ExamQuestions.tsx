"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, FC } from "react";
import { FiArrowRight, FiHome, FiClock } from "react-icons/fi";

import Countdown from "@/app/_components/Countdown";
import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";
import StackedNotification from "@/app/_components/StackedNotification";

import { createClient } from "@/utils/supabase/client";
import { updateStudyStreak } from "@/app/utils/studyStreak/updateStudyStreak";

import { QuestionType, ScoreType, FinalExamQuestionsType, FinalQuestionsType, SupabaseClientType } from "@/types/types";

// Helper function to format elapsed time
const formatElapsedTime = (milliseconds: number): string => {
  return Math.floor(milliseconds / 1000).toString();
};

// Helper function to save/update exam score using upsert (requires unique constraint)
const saveExamScore = async (supabase: SupabaseClientType, userId: string, examNumber: number, examType: string, calculatedScore: ScoreType, timeElapsed: number): Promise<void> => {
  const isPerfect = calculatedScore.correctAnswers / calculatedScore.totalQuestions === 1;
  const newScore = calculatedScore.correctAnswers;
  const newTimeElapsed = parseInt(formatElapsedTime(timeElapsed));

  try {
    const { data: existingRecord } = await supabase
      .from("exam_scores")
      .select("score, time_elapsed, number_of_tries_to_reach_perfect_score")
      .eq("user_id", userId)
      .eq("exam_type", examType)
      .eq("exam_number", examNumber)
      .maybeSingle();

    const baseData = {
      user_id: userId,
      exam_type: examType,
      exam_number: examNumber,
    };

    if (existingRecord) {
      const existingScore = existingRecord.score;
      const existingTimeElapsed = existingRecord.time_elapsed;
      const existingTries = existingRecord.number_of_tries_to_reach_perfect_score || 0;
      const existingIsPerfect = existingScore === calculatedScore.totalQuestions;

      const shouldUpdateTime = (newTimeElapsed < existingTimeElapsed && newScore >= existingScore) || (newTimeElapsed > existingTimeElapsed && newScore > existingScore);

      const updateData = {
        ...baseData,
        score: newScore > existingScore ? newScore : existingScore,
        time_elapsed: shouldUpdateTime ? newTimeElapsed : existingTimeElapsed,
        number_of_tries_to_reach_perfect_score: !isPerfect && !existingIsPerfect ? existingTries + 1 : existingTries,
      };

      const { error } = await supabase.from("exam_scores").upsert(updateData, {
        onConflict: "user_id,exam_type,exam_number",
      });

      if (error) console.error("Error updating exam score:", error);
    } else {
      const { error } = await supabase.from("exam_scores").upsert(
        {
          ...baseData,
          score: newScore,
          time_elapsed: newTimeElapsed,
          number_of_tries_to_reach_perfect_score: 1,
        },
        {
          onConflict: "user_id,exam_type,exam_number",
        }
      );

      if (error) console.error("Error saving exam score:", error);
    }
  } catch (error) {
    console.error("Error in saveExamScore:", error);
  }
};

// Shared function to handle exam submission logic
const handleExamSubmission = async (
  calculatedScore: ScoreType,
  timeElapsed: number,
  examNumber: number,
  examType: string,
  setScore: (score: ScoreType) => void,
  setIsSubmitted: (submitted: boolean) => void,
  setCompletionTime: (time: number) => void
) => {
  setScore(calculatedScore);
  setIsSubmitted(true);
  setCompletionTime(timeElapsed);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("User not authenticated");
      return;
    }

    await updateStudyStreak(supabase, user.id);
    await saveExamScore(supabase, user.id, examNumber, examType, calculatedScore, timeElapsed);
  } catch (error) {
    console.error("Error updating study tracking:", error);
  }
};

export default function ExamQuestions({ multipleChoiceQuestions, examNumber, examType }: FinalExamQuestionsType) {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<ScoreType | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [completionTime, setCompletionTime] = useState<number | null>(null);

  const router = useRouter();
  const calculateScoreRef = useRef<(() => ScoreType) | null>(null);

  const showNotification = (msg: string) => {
    setMessage(msg);
    setIsNotifOpen(true);
  };

  const handleTimeUp = async (timeElapsed: number) => {
    if (!isSubmitted && calculateScoreRef.current) {
      showNotification("Time is up! See your score below.");
      const calculatedScore = calculateScoreRef.current();
      await handleExamSubmission(calculatedScore, timeElapsed, examNumber, examType, setScore, setIsSubmitted, setCompletionTime);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950">
      <Countdown onTimeUp={handleTimeUp} hours={60} minutes={0} seconds={1} isSubmitted={isSubmitted} onElapsedTimeChange={setElapsedTime} />
      <Questions
        multipleChoiceQuestions={multipleChoiceQuestions}
        isSubmitted={isSubmitted}
        setIsSubmitted={setIsSubmitted}
        router={router}
        score={score}
        setScore={setScore}
        calculateScoreRef={calculateScoreRef}
        elapsedTime={elapsedTime}
        completionTime={completionTime}
        setCompletionTime={setCompletionTime}
        examNumber={examNumber}
        examType={examType}
      />
      <GlowingDotsBackground />
      <StackedNotification isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} message={message} />
    </main>
  );
}

const getRandomElements = <T,>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const shuffleOptions = (questions: QuestionType[]): QuestionType[] => {
  return questions.map((question) => ({
    ...question,
    options: shuffleArray(question.options),
  }));
};

const Questions: FC<FinalQuestionsType> = ({
  multipleChoiceQuestions,
  isSubmitted,
  setIsSubmitted,
  router,
  score,
  setScore,
  calculateScoreRef,
  elapsedTime,
  completionTime,
  setCompletionTime,
  examNumber,
  examType,
}) => {
  const [selectedMultipleChoice, setSelectedMultipleChoice] = useState<QuestionType[]>([]);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const randomMC = getRandomElements(multipleChoiceQuestions, 30);
    const shuffledMC = shuffleOptions(randomMC);
    setSelectedMultipleChoice(shuffledMC);
  }, [multipleChoiceQuestions]);

  const handleAnswerChange = (questionIndex: number, optionIndex: number, questionType: string) => {
    if (isSubmitted) return;

    const key = `${questionType}-${questionIndex}`;
    setAnswers((prev) => {
      const currentAnswers = prev[key] || [];
      const isSelected = currentAnswers.includes(optionIndex);

      if (isSelected) {
        // Remove the option if already selected
        return {
          ...prev,
          [key]: currentAnswers.filter((idx) => idx !== optionIndex),
        };
      } else {
        // Add the option if not selected
        return {
          ...prev,
          [key]: [...currentAnswers, optionIndex],
        };
      }
    });
  };

  const isTestComplete = (): boolean => {
    // Check if all questions have at least one answer
    return selectedMultipleChoice.every((_, index) => {
      const key = `mc-${index}`;
      return answers[key] && answers[key].length > 0;
    });
  };

  const calculateScore = useCallback((): ScoreType => {
    let correctAnswers = 0;
    const totalQuestions = selectedMultipleChoice.length;

    selectedMultipleChoice.forEach((question, questionIndex) => {
      const userAnswers = answers[`mc-${questionIndex}`] || [];

      // Get all correct answer indices
      const correctIndices = question.options.map((option, idx) => (option.correct ? idx : -1)).filter((idx) => idx !== -1);

      // Check if user selected exactly the correct answers
      const isCorrect = userAnswers.length === correctIndices.length && userAnswers.every((idx) => correctIndices.includes(idx));

      if (isCorrect) {
        correctAnswers++;
      }
    });

    return { correctAnswers, totalQuestions };
  }, [answers, selectedMultipleChoice]);

  useEffect(() => {
    calculateScoreRef.current = calculateScore;
  }, [calculateScore, calculateScoreRef]);

  const handleSubmit = async () => {
    if (!isSubmitted && isTestComplete()) {
      const calculatedScore = calculateScore();
      await handleExamSubmission(calculatedScore, elapsedTime, examNumber, examType, setScore, setIsSubmitted, setCompletionTime);
    }
  };

  const handleReturnToDashboard = () => {
    router.push("/");
  };

  return (
    <section className="relative z-20 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 py-24 md:px-8 md:py-36">
      <div className="w-full max-w-4xl">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Select All That Apply</h2>
          <div className="space-y-8">
            {selectedMultipleChoice.map((question, questionIndex) => {
              const userAnswers = answers[`mc-${questionIndex}`] || [];

              return (
                <div key={questionIndex} className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {questionIndex + 1}. {question.question}
                  </h3>
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => {
                      const isCorrect = option.correct;
                      const isSelected = userAnswers.includes(optionIndex);
                      const isWrong = isSelected && !isCorrect;
                      const isMissed = !isSelected && isCorrect && isSubmitted;

                      let labelClass = "flex items-center space-x-3 cursor-pointer hover:bg-zinc-800 p-3 rounded-md transition-colors";

                      if (isSubmitted) {
                        if (isCorrect && isSelected) {
                          labelClass += " bg-green-800 border-2 border-green-600";
                        } else if (isMissed) {
                          labelClass += " bg-yellow-800 border-2 border-yellow-600";
                        } else if (isWrong) {
                          labelClass += " bg-red-800 border-2 border-red-600";
                        }
                        labelClass = labelClass.replace("cursor-pointer hover:bg-zinc-800", "cursor-not-allowed");
                      }

                      return (
                        <label key={optionIndex} className={labelClass}>
                          <input
                            type="checkbox"
                            name={`mc-${questionIndex}-${optionIndex}`}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(questionIndex, optionIndex, "mc")}
                            className="w-4 h-4 text-blue-500 focus:ring-blue-500 focus:ring-2"
                            disabled={isSubmitted}
                          />
                          <span className="text-gray-300">
                            {String.fromCharCode(65 + optionIndex)}. {option.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isSubmitted && score && (
          <div className="mb-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-700 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Test Complete!</h2>
            <div className="text-6xl font-bold text-white mb-2">
              {score.correctAnswers}/{score.totalQuestions}
            </div>
            <p className="text-xl text-blue-200 mb-4">You scored {Math.round((score.correctAnswers / score.totalQuestions) * 100)}%</p>

            {completionTime && (
              <div className="flex items-center justify-center gap-2 text-lg text-indigo-200 mb-4">
                <FiClock />
                <span>Completed in: {formatElapsedTime(completionTime)}</span>
              </div>
            )}

            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(score.correctAnswers / score.totalQuestions) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-evenly">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!isTestComplete()}
              className="font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white cursor-pointer disabled:cursor-not-allowed"
            >
              Submit Test
              <FiArrowRight />
            </button>
          ) : (
            <div className="flex flex-col md:flex-row gap-16">
              <button
                onClick={handleReturnToDashboard}
                className="font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
              >
                <FiHome />
                Return to Dashboard
              </button>

              <button
                onClick={() => window.location.reload()}
                className="font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
              >
                Retake Test
                <FiArrowRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
