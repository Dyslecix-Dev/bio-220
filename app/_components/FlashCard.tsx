"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";

import Navbar from "@/app/_components/Navbar";
import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";
import ShuffleLoader from "@/app/_components/ShuffleLoader";

import { createClient } from "@/utils/supabase/client";
import { updateStudyStreak } from "@/app/utils/studyStreak/updateStudyStreak";

import { FlashCardType, UserFlashCardProgressType } from "@/types/types";

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Calculate grade percentage
const calculateGradePercentage = (grade: number, attempts: number): number => {
  if (attempts === 0) return 0;
  return (grade / attempts) * 100;
};

// Categorize cards based on grade percentage
const categorizeCard = (grade: number, attempts: number): string => {
  if (grade === 0 && attempts === 0) return "New";

  const percentage = calculateGradePercentage(grade, attempts);

  if (percentage <= 50) return "Now";
  if (percentage <= 90) return "Tomorrow";
  return "Next Week";
};

// Group cards by category
const groupCardsByCategory = (cards: FlashCardType[]) => {
  const categories = {
    New: [] as FlashCardType[],
    Now: [] as FlashCardType[],
    Tomorrow: [] as FlashCardType[],
    "Next Week": [] as FlashCardType[],
  };

  cards.forEach((card) => {
    const category = categorizeCard(card.grade, card.attempts);
    categories[category as keyof typeof categories].push(card);
  });

  return categories;
};

export default function FlashCardComponent({
  tableKey,
  tableValue,
  onUpdateProgress,
}: {
  tableKey: string;
  tableValue: string;
  onUpdateProgress?: (cardId: string, newGrade: number, newAttempts: number) => void;
}) {
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [reviewCards, setReviewCards] = useState<FlashCardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [flashCards, setFlashCards] = useState<FlashCardType[]>([]);

  // Create a stable callback for updating card progress
  const updateCardProgress = useCallback(
    (cardId: string, newGrade: number, newAttempts: number) => {
      // Update the main flashCards state
      setFlashCards((prevCards) => prevCards.map((card) => (card.id === cardId ? { ...card, grade: newGrade, attempts: newAttempts } : card)));

      // Update review cards if in review mode
      setReviewCards((prevCards) => prevCards.map((card) => (card.id === cardId ? { ...card, grade: newGrade, attempts: newAttempts } : card)));

      // Call the external callback if provided
      if (onUpdateProgress) {
        onUpdateProgress(cardId, newGrade, newAttempts);
      }
    },
    [onUpdateProgress]
  );

  const handleDifficultySelect = async (difficulty: string) => {
    const currentCard = reviewCards[currentCardIndex];
    if (!currentCard) return;

    // Calculate new grade and attempts
    const newAttempts = currentCard.attempts + 1;
    let gradeIncrement = 0;

    switch (difficulty) {
      case "again":
        gradeIncrement = 0;
        break;
      case "hard":
        gradeIncrement = 0.7;
        break;
      case "good":
        gradeIncrement = 0.85;
        break;
      case "easy":
        gradeIncrement = 1;
        break;
    }

    const newGrade = currentCard.grade + gradeIncrement;

    try {
      const supabase = await createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return;
      }

      // Update flash card progress
      const { error: progressError } = await supabase.from("user_flash_card_progress").upsert(
        {
          user_id: user.id,
          card_id: currentCard.id,
          grade: newGrade,
          attempts: newAttempts,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,card_id",
        }
      );

      if (progressError) {
        console.error("Error updating progress:", progressError);
        return;
      }

      // Update study streak using the utility function
      await updateStudyStreak(supabase, user.id);

      // Update local state
      updateCardProgress(currentCard.id, newGrade, newAttempts);
    } catch (error) {
      console.error("Error updating card:", error);
      return;
    }

    if (currentCardIndex < reviewCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setIsReviewMode(false);
      setReviewCards([]);
      setCurrentCardIndex(0);
    }
  };

  const handleStartReview = useCallback((numCards: number, cards: FlashCardType[]) => {
    setReviewCards(cards);
    setCurrentCardIndex(0);
    setIsReviewMode(true);
  }, []);

  if (isReviewMode) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <ReviewMode card={reviewCards[currentCardIndex]} onDifficultySelect={handleDifficultySelect} currentIndex={currentCardIndex} totalCards={reviewCards.length} />
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950">
      <Navbar />
      <CardGrid tableKey={tableKey} tableValue={tableValue} flashCards={flashCards} setFlashCards={setFlashCards} onStartReview={handleStartReview} />
      <GlowingDotsBackground />
    </main>
  );
}

const CardGrid = ({
  tableKey,
  tableValue,
  flashCards,
  setFlashCards,
  onStartReview,
}: {
  tableKey: string;
  tableValue: string;
  flashCards: FlashCardType[];
  setFlashCards: React.Dispatch<React.SetStateAction<FlashCardType[]>>;
  onStartReview: (numCards: number, cards: FlashCardType[]) => void;
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchFlashCards = async () => {
    try {
      const supabase = await createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        return;
      }

      const { data, error } = await supabase
        .from("flash_cards")
        .select(
          `
            *,
            user_flash_card_progress!left (
              grade,
              attempts,
              user_id
            )
          `
        )
        .eq(tableKey, tableValue);

      if (error) {
        setError(error.message);
        console.error("Error fetching flash cards:", error);
      } else if (data) {
        const transformedData = data.map(({ front_text, back_text, front_image, back_image, id, topic, user_flash_card_progress, ...rest }) => {
          const userProgress = user_flash_card_progress?.find((progress: UserFlashCardProgressType) => progress.user_id === user.id);

          return {
            id,
            topic,
            grade: userProgress?.grade ?? 0,
            attempts: userProgress?.attempts ?? 0,
            frontText: front_text,
            backText: back_text,
            frontImage: front_image,
            backImage: back_image,
            ...rest,
          };
        });

        setFlashCards(shuffleArray(transformedData));
      }
    } catch (err) {
      setError("Failed to fetch flash cards");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashCards();
  }, [tableKey, tableValue, setFlashCards]);

  const startReview = (numCards: number) => {
    const categorizedCards = groupCardsByCategory(flashCards);
    const sourceCards = selectedCategory ? categorizedCards[selectedCategory as keyof typeof categorizedCards] : flashCards;
    const selectedCards = shuffleArray(sourceCards).slice(0, numCards);

    onStartReview(numCards, selectedCards);
  };

  if (loading) {
    return (
      <main className="min-h-screen overflow-hidden bg-zinc-950 flex items-center justify-center">
        <ShuffleLoader />
      </main>
    );
  }

  if (error) {
    return (
      <div className="relative z-20 mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-36">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-400 text-xl">Error: {error}</div>
        </div>
      </div>
    );
  }

  const categorizedCards = groupCardsByCategory(flashCards);
  const displayedCards = selectedCategory ? categorizedCards[selectedCategory as keyof typeof categorizedCards] : flashCards;

  return (
    <div className="relative z-20 mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-36">
      {/* Bar Graph */}
      <BarGraph categorizedCards={categorizedCards} selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />

      {/* Review Interface */}
      <ReviewInterface onStartReview={startReview} selectedCategory={selectedCategory} fetchFlashCards={fetchFlashCards} />

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
        {displayedCards.map((item: FlashCardType) => {
          return <FlashCard key={item.id} {...item} />;
        })}
      </div>
    </div>
  );
};

const ReviewInterface = ({ onStartReview, selectedCategory, fetchFlashCards }: { onStartReview: (numCards: number) => void; selectedCategory: string | null; fetchFlashCards: () => void }) => {
  const [numCards, setNumCards] = useState<number>(5);

  const handleReview = () => {
    if (numCards > 0) {
      onStartReview(numCards);
    }
  };

  const handleResetCardProgress = async () => {
    try {
      const supabase = await createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return;
      }

      const { error } = await supabase.from("user_flash_card_progress").update({ grade: 0, attempts: 0 }).eq("user_id", user.id);

      if (error) {
        console.error("Error resetting card progress:", error);
      }

      fetchFlashCards();
    } catch (err) {
      console.error("Error resetting card progress:", err);
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-zinc-900/50 p-4 sm:p-6 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="text-white text-base sm:text-lg font-medium text-center sm:text-left">Review</div>
          <div className="flex items-center justify-center space-x-2">
            <input
              type="number"
              min="1"
              value={numCards}
              onChange={(e) => setNumCards(parseInt(e.target.value) || 1)}
              className="w-16 sm:w-20 px-2 sm:px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-white text-sm sm:text-base font-medium text-center">cards from {selectedCategory || "all categories"}</div>

          <button
            onClick={handleReview}
            className="bg-indigo-500 text-white font-medium py-2 px-4 sm:px-6 rounded-lg transition-all hover:bg-indigo-600 active:scale-95 cursor-pointer w-full sm:w-auto"
          >
            Start Review
          </button>

          <button
            onClick={handleResetCardProgress}
            className="bg-rose-600 text-white font-medium py-2 px-4 sm:px-6 md:ml-20 lg:ml-40 rounded-lg transition-all hover:bg-rose-700 active:scale-95 cursor-pointer w-full sm:w-auto"
          >
            Reset Grades
          </button>
        </div>
      </div>
    </div>
  );
};

const ReviewMode = ({ card, onDifficultySelect, currentIndex, totalCards }: { card: FlashCardType; onDifficultySelect: (difficulty: string) => void; currentIndex: number; totalCards: number }) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleDifficultySelect = async (difficulty: string) => {
    setIsFlipped(false);
    await new Promise((resolve) => setTimeout(resolve, 200));
    onDifficultySelect(difficulty);
  };

  const difficultyButtons = [
    { label: "Again", color: "bg-red-600 hover:bg-red-700", value: "again" },
    { label: "Hard", color: "bg-orange-600 hover:bg-orange-700", value: "hard" },
    { label: "Good", color: "bg-yellow-600 hover:bg-yellow-700", value: "good" },
    { label: "Easy", color: "bg-green-600 hover:bg-green-700", value: "easy" },
  ];

  if (!card) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">No card available</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Progress indicator */}
      <div className="absolute top-4 sm:top-8 right-4 sm:right-8 text-white text-base sm:text-lg font-medium">
        {currentIndex + 1} / {totalCards}
      </div>

      {/* Big Card */}
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl aspect-square cursor-pointer mb-6 sm:mb-8" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
          {/* Front of card */}
          <div className="absolute inset-0 w-full h-full rounded-2xl bg-neutral-100 shadow-xl overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
            {card.frontImage ? (
              // When frontImage exists, show image with text below
              <div className="flex flex-col h-full">
                <div className="flex-1 relative">
                  <Image src={card.frontImage} alt="Front of card" fill={true} className="object-contain" />
                </div>
                {card.frontText && (
                  <div className="p-4 sm:p-6 bg-neutral-100 border-t border-neutral-200">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black text-center leading-tight">{card.frontText}</h3>
                  </div>
                )}
              </div>
            ) : (
              // When no frontImage, center the text
              <div className="absolute inset-0 p-6 sm:p-8 md:p-12 overflow-auto flex items-center justify-center">
                {card.frontText && <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-black text-center leading-tight">{card.frontText}</h3>}
              </div>
            )}
          </div>

          {/* Back of card */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl bg-neutral-700 shadow-xl overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {card.backImage ? (
              // When backImage exists, show image with text below
              <div className="flex flex-col h-full">
                <div className="flex-1 relative">
                  <Image src={card.backImage} alt="Back of card" fill={true} className="object-contain" />
                </div>
                {card.backText && (
                  <div className="p-4 sm:p-6 bg-neutral-700 border-t border-neutral-600">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white text-center leading-tight">{card.backText}</h3>
                  </div>
                )}
              </div>
            ) : (
              // When no backImage, center the text
              <div className="absolute inset-0 p-6 sm:p-8 md:p-12 overflow-auto flex items-center justify-center">
                {card.backText && <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white text-center leading-tight">{card.backText}</h3>}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Difficulty buttons */}
      {isFlipped && (
        <motion.div
          className="w-full max-w-sm sm:max-w-md md:max-w-lg grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {difficultyButtons.map((button) => (
            <button
              key={button.value}
              onClick={() => handleDifficultySelect(button.value)}
              className={`
                px-3 sm:px-6 md:px-8 py-3 sm:py-4 ${button.color} text-white font-medium rounded-lg 
                transition-colors duration-200 text-sm sm:text-base md:text-lg cursor-pointer
                flex-1 sm:flex-none
              `}
            >
              {button.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Instruction text */}
      {!isFlipped && <div className="text-zinc-400 text-center text-sm sm:text-base md:text-lg px-4">Click the card to reveal the answer</div>}
    </div>
  );
};

const BarGraph = ({
  categorizedCards,
  selectedCategory,
  onCategorySelect,
}: {
  categorizedCards: Record<string, FlashCardType[]>;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}) => {
  const categories = ["New", "Now", "Tomorrow", "Next Week"];
  const categoryColors = {
    New: "bg-blue-500",
    Now: "bg-red-500",
    Tomorrow: "bg-orange-500",
    "Next Week": "bg-green-500",
  };

  const categoryTextColors = {
    New: "text-blue-500",
    Now: "text-red-500",
    Tomorrow: "text-orange-500",
    "Next Week": "text-green-500",
  };

  const maxCount = Math.max(...categories.map((cat) => categorizedCards[cat].length));
  const maxHeight = 120;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-end space-x-2 sm:space-x-4 bg-zinc-900/50 p-4 sm:p-6 rounded-2xl backdrop-blur-sm">
        {categories.map((category) => {
          const count = categorizedCards[category].length;
          const height = maxCount > 0 ? (count / maxCount) * maxHeight : 0;
          const isSelected = selectedCategory === category;
          const hasCards = count > 0;

          return (
            <div
              key={category}
              className={`
                pt-6 sm:pt-10 flex-1 flex flex-col items-center transition-all duration-300
                ${hasCards ? "cursor-pointer group" : "cursor-not-allowed opacity-50"}
              `}
              onClick={() => hasCards && onCategorySelect(isSelected ? null : category)}
            >
              {/* Bar */}
              <div className="w-full max-w-12 sm:max-w-20 relative mb-2 transition-all duration-300" style={{ height: `${maxHeight}px` }}>
                <div
                  className={`
                    absolute bottom-0 w-full rounded-t-lg transition-all duration-300
                    ${categoryColors[category as keyof typeof categoryColors]}
                    ${isSelected ? "opacity-100 scale-105" : hasCards ? "opacity-70 hover:opacity-90" : "opacity-30"}
                  `}
                  style={{ height: `${height}px` }}
                />

                {/* Count label on top of bar */}
                <div
                  className={`
                    absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 text-xs sm:text-sm font-bold transition-colors duration-300
                    ${isSelected ? categoryTextColors[category as keyof typeof categoryTextColors] : "text-white"}
                  `}
                  style={{ bottom: `${height + 8}px` }}
                >
                  {count}
                </div>
              </div>

              {/* Category label */}
              <div
                className={`
                  text-center text-xs sm:text-sm font-medium transition-colors duration-300
                  ${isSelected ? categoryTextColors[category as keyof typeof categoryTextColors] : "text-white"}
                `}
              >
                {category}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FlashCard = ({ frontText, backText, frontImage, backImage }: FlashCardType) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative cursor-pointer aspect-square w-full max-w-sm mx-auto" onClick={handleClick}>
      <motion.div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
        {/* Front of card */}
        <div className="absolute inset-0 w-full h-full rounded-2xl bg-neutral-100 shadow-md overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
          {frontImage ? (
            // When frontImage exists, show image with text below
            <div className="flex flex-col h-full">
              <div className="flex-1 relative">
                <Image src={frontImage} alt="Front of card" fill={true} className="object-contain" />
              </div>
              {frontText && (
                <div className="p-3 sm:p-4 bg-neutral-100 border-t border-neutral-200">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-black text-center leading-tight">{frontText}</h3>
                </div>
              )}
            </div>
          ) : (
            // When no frontImage, center the text
            <div className="absolute inset-0 p-4 sm:p-6 overflow-auto flex items-center justify-center">
              {frontText && <h3 className="text-base sm:text-lg md:text-xl font-bold text-black text-center leading-tight">{frontText}</h3>}
            </div>
          )}
        </div>

        {/* Back of card */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl bg-neutral-700 shadow-md overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {backImage ? (
            // When backImage exists, show image with text below
            <div className="flex flex-col h-full">
              <div className="flex-1 relative">
                <Image src={backImage} alt="Back of card" fill={true} className="object-contain" />
              </div>
              {backText && (
                <div className="p-3 sm:p-4 bg-neutral-700 border-t border-neutral-600">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white text-center leading-tight">{backText}</h3>
                </div>
              )}
            </div>
          ) : (
            // When no backImage, center the text
            <div className="absolute inset-0 p-4 sm:p-6 overflow-auto flex items-center justify-center">
              {backText && <h3 className="text-base sm:text-lg md:text-xl font-bold text-white text-center leading-tight">{backText}</h3>}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
