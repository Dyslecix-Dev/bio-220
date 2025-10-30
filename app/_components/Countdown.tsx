import { useEffect, useRef, useState } from "react";
import { useAnimate } from "motion/react";
import { CountdownType, CountdownTimeType, TimerReturnType } from "@/types/types";

const SECOND: number = 1000;
const MINUTE: number = SECOND * 60;
const HOUR: number = MINUTE * 60;

export default function Countdown({
  onTimeUp,
  hours,
  minutes,
  seconds,
  isSubmitted = false,
  onElapsedTimeChange,
}: CountdownType & {
  isSubmitted?: boolean;
  onElapsedTimeChange?: (elapsedTime: number) => void;
}) {
  const [startTime] = useState<number>(Date.now());

  const totalDuration = hours * HOUR + minutes * MINUTE + seconds * SECOND;

  const handleSubmitTest = (timeElapsed: number) => {
    if (onTimeUp) {
      onTimeUp(timeElapsed);
    }
  };

  const handleElapsedTimeUpdate = (elapsed: number) => {
    if (onElapsedTimeChange) {
      onElapsedTimeChange(elapsed);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 w-full bg-indigo-600 px-2 py-0.5 text-white shadow-lg" style={{ zIndex: 9999 }}>
      <div className="mx-auto flex w-fit max-w-5xl flex-wrap items-center justify-center gap-x-4 text-xs md:text-sm">
        <CountdownItem
          unit="Hour"
          text="hours"
          startTime={startTime}
          totalDuration={totalDuration}
          onTimeUp={handleSubmitTest}
          isSubmitted={isSubmitted}
          onElapsedTimeChange={handleElapsedTimeUpdate}
        />
        <CountdownItem
          unit="Minute"
          text="minutes"
          startTime={startTime}
          totalDuration={totalDuration}
          onTimeUp={handleSubmitTest}
          isSubmitted={isSubmitted}
          onElapsedTimeChange={handleElapsedTimeUpdate}
        />
        <CountdownItem
          unit="Second"
          text="seconds"
          startTime={startTime}
          totalDuration={totalDuration}
          onTimeUp={handleSubmitTest}
          isSubmitted={isSubmitted}
          onElapsedTimeChange={handleElapsedTimeUpdate}
        />
      </div>
    </div>
  );
}

const CountdownItem = ({
  unit,
  text,
  startTime,
  totalDuration,
  onTimeUp,
  isSubmitted = false,
  onElapsedTimeChange,
}: CountdownTimeType & {
  onTimeUp?: (elapsedTime: number) => void;
  isSubmitted?: boolean;
  onElapsedTimeChange?: (elapsedTime: number) => void;
}) => {
  const { ref, time } = useTimer(unit, startTime, totalDuration, onTimeUp, isSubmitted, onElapsedTimeChange);
  return (
    <div className="flex w-fit items-center justify-center gap-1.5 py-2">
      <div className="relative w-full overflow-hidden text-center">
        <span ref={ref} className="block font-mono text-sm font-semibold md:text-base">
          {time}
        </span>
      </div>
      <span>{text}</span>
    </div>
  );
};

const useTimer = (
  unit: "Hour" | "Minute" | "Second",
  startTime: number,
  totalDuration: number,
  onTimeUp?: (elapsedTime: number) => void,
  isSubmitted: boolean = false,
  onElapsedTimeChange?: (elapsedTime: number) => void
): TimerReturnType => {
  const [ref, animate] = useAnimate();
  const timeRef = useRef<number>(0);
  const [time, setTime] = useState<number>(0);
  const hasSubmitted = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSubmitted) {
      // Clear the interval when test is submitted
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    handleCountdown();
    intervalRef.current = setInterval(handleCountdown, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSubmitted]);

  const handleCountdown = async (): Promise<void> => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    const remaining = Math.max(0, totalDuration - elapsedTime);

    // Update elapsed time for all units, but only call the callback once (from seconds)
    if (unit === "Second" && onElapsedTimeChange) {
      onElapsedTimeChange(elapsedTime);
    }

    if (remaining === 0 && !hasSubmitted.current && onTimeUp && unit === "Second") {
      hasSubmitted.current = true;
      onTimeUp(elapsedTime);
    }

    let newTime = 0;

    if (unit === "Hour") {
      newTime = Math.floor(remaining / HOUR);
    } else if (unit === "Minute") {
      newTime = Math.floor((remaining % HOUR) / MINUTE);
    } else {
      newTime = Math.floor((remaining % MINUTE) / SECOND);
    }

    if (newTime !== timeRef.current) {
      await animate(ref.current, { y: ["0%", "-50%"], opacity: [1, 0] }, { duration: 0.35 });
      timeRef.current = newTime;
      setTime(newTime);
      await animate(ref.current, { y: ["50%", "0%"], opacity: [0, 1] }, { duration: 0.35 });
    }
  };

  return { ref, time };
};
