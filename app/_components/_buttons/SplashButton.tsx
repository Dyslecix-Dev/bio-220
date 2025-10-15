import { twMerge } from "tailwind-merge";

import { SplashButtonType } from "@/types/types";

export default function SplashButton({ type, disabled, onClick, className, children }: SplashButtonType) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={twMerge(
        "rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-zinc-50 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-950 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 cursor-pointer disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}
