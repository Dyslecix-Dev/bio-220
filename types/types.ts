import { useRouter } from "next/navigation";
import { Dispatch, DragEvent, MouseEventHandler, ReactNode, RefObject, SetStateAction } from "react";

import { createClient } from "@/utils/supabase/client";

export interface AddKanbanCardPropsType {
  column: KanbanColumnType;
  addCard: (card: Omit<KanbanCardType, "id">) => void;
}

export interface BurnBarrelType {
  setCards: Dispatch<SetStateAction<KanbanCardType[]>>;
}

export interface CountdownTimeType {
  unit: "Hour" | "Minute" | "Second";
  text: string;
  startTime: number;
  totalDuration: number;
}

export interface CountdownType {
  onTimeUp?: (timeElapsed: number) => Promise<void>;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface DropIndicatorType {
  beforeId: string | null;
  column: KanbanColumnType;
}

export interface ExamQuestionsType {
  multipleChoiceQuestions: QuestionType[];
  isSubmitted: boolean;
  setIsSubmitted: (submitted: boolean) => void;
  router: ReturnType<typeof useRouter>;
  score: ScoreType | null;
  setScore: (score: ScoreType) => void;
  calculateScoreRef: RefObject<(() => ScoreType) | null>;
}

export interface FAQuestionType {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export interface FinalExamQuestionsType {
  multipleChoiceQuestions: QuestionType[];
  examNumber: number;
  examType: string;
}

export interface FinalQuestionsType extends ExamQuestionsType {
  elapsedTime: number;
  completionTime: number | null;
  setCompletionTime: (time: number) => void;
  examNumber: number;
  examType: string;
}

export interface FlashCardType {
  user_id: string;
  id: string;
  topic: string;
  frontText?: string;
  backText?: string;
  frontImage?: string;
  backImage?: string;
  grade: number;
  attempts: number;
}

export interface KanbanCardPropsType {
  id: string;
  text: string;
  column: KanbanColumnType;
  handleDragStart: (e: DragEvent<HTMLDivElement>, card: KanbanCardType) => void;
}

export interface KanbanCardType {
  id: string;
  text: string;
  column: KanbanColumnType;
}

export interface KanbanColumnPropsType {
  text: string;
  column: KanbanColumnType;
  headingColor: string;
  cards: KanbanCardType[];
  setCards: Dispatch<SetStateAction<KanbanCardType[]>>;
}

type KanbanColumnType = "To-Do" | "In Progress" | "Complete";

export interface NotificationType {
  id: string;
  text: string;
  removeNotif: (id?: string) => void;
}

export interface OptionType {
  text: string;
  correct: boolean;
  correctAnswer?: string;
}

export interface QuestionType {
  question: string;
  options: OptionType[];
}

export interface ScoreType {
  correctAnswers: number;
  totalQuestions: number;
}

export interface SplashButtonType {
  className?: string;
  type: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  children: ReactNode;
}

export interface StackedNotificationType {
  isNotifOpen: boolean;
  setIsNotifOpen: (isOpen: boolean) => void;
  message: string | null;
}

export type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;

export interface TimerReturnType {
  ref: RefObject<HTMLSpanElement>;
  time: number;
}

export type UserFlashCardProgressType = {
  grade: number;
  attempts: number;
  user_id: string;
};

export interface UserStudyType {
  last_study_date: string | null;
  study_streak: number | null;
}
