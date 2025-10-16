import { MouseEventHandler, ReactNode } from "react";

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

export interface NotificationType {
  id: string;
  text: string;
  removeNotif: (id?: string) => void;
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

export type UserFlashCardProgressType = {
  grade: number;
  attempts: number;
  user_id: string;
};

export interface UserStudyType {
  last_study_date: string | null;
  study_streak: number | null;
}
