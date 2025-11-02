"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { FiEdit2, FiX, FiSearch } from "react-icons/fi";

import { motion } from "motion/react";

import Navbar from "@/app/_components/Navbar";
import ShuffleLoader from "@/app/_components/ShuffleLoader";
import StackedNotification from "@/app/_components/StackedNotification";

import { createClient } from "@/utils/supabase/client";

import { FlashCardType, UserFlashCardProgressType } from "@/types/types";

export default function CMSFlashCards() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [flashCards, setFlashCards] = useState<FlashCardType[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Notification state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  const showNotification = (message: string) => {
    setNotifMessage(message);
    setIsNotifOpen(true);
  };

  useEffect(() => {
    fetchFlashCards();
  }, []);

  const fetchFlashCards = async () => {
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

      const { data, error } = await supabase.from("flash_cards").select(`
          *,
          user_flash_card_progress!left (
            grade,
            attempts,
            user_id
          )
        `);

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

        setFlashCards(transformedData);
      }
    } catch (err) {
      setError("Failed to fetch flash cards");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showNotification("You must be logged in to delete cards");
        return;
      }

      const cardToDelete = flashCards.find((card) => card.id === cardId);
      if (!cardToDelete) {
        showNotification("Card not found");
        return;
      }

      if (cardToDelete.user_id !== user.id) {
        showNotification("You can only delete your own flash cards");
        return;
      }

      const { error } = await supabase.from("flash_cards").delete().eq("id", cardId);
      if (error) {
        console.error("Error deleting card:", error);
        showNotification(`Failed to delete card: ${error.message}`);
        return;
      }

      const imagesToDelete = [];
      if (cardToDelete.frontImage) {
        imagesToDelete.push(cardToDelete.frontImage);
      }
      if (cardToDelete.backImage) {
        imagesToDelete.push(cardToDelete.backImage);
      }

      if (imagesToDelete.length > 0) {
        try {
          const deleteResponse = await fetch("/api/blob-images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ urls: imagesToDelete }),
          });

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            console.error("Error deleting images from Vercel Blob:", errorData);
          }
        } catch (blobError) {
          console.error("Failed to delete images from Vercel Blob:", blobError);
        }
      }

      setFlashCards((prevCards) => prevCards.filter((card) => card.id !== cardId));
      showNotification("Flash card deleted successfully!");
    } catch (error) {
      console.error("Unexpected error deleting card:", error);
      showNotification("An unexpected error occurred while deleting the card");
    }
  };

  // Group cards by topic
  const groupedCards = flashCards.reduce((acc, card) => {
    const topic = card.topic || "Uncategorized";
    if (!acc[topic]) {
      acc[topic] = [];
    }
    acc[topic].push(card);
    return acc;
  }, {} as Record<string, FlashCardType[]>);

  // Custom sort: Lecture first (numerically), then Lab (numerically), then alphabetically
  const sortedTopics = Object.keys(groupedCards).sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    const aIsLecture = aLower.includes("lecture");
    const bIsLecture = bLower.includes("lecture");
    const aIsLab = aLower.includes("lab");
    const bIsLab = bLower.includes("lab");

    // Lecture comes first
    if (aIsLecture && !bIsLecture) return -1;
    if (!aIsLecture && bIsLecture) return 1;

    // If both are lectures, sort numerically
    if (aIsLecture && bIsLecture) {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    }

    // Lab comes second (with numeric sorting)
    if (aIsLab && !bIsLab) return -1;
    if (!aIsLab && bIsLab) return 1;

    // If both are labs, sort numerically
    if (aIsLab && bIsLab) {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    }

    // Otherwise alphabetical
    return a.localeCompare(b);
  });

  sortedTopics.forEach((topic) => {
    groupedCards[topic].sort((a, b) => {
      // Sort by created_at date (newest first)
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
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

      <section className="pt-32 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold">All Flash Cards ({flashCards.length})</h2>
          <Link href="/cms/flash-cards/create" className="text-indigo-400 hover:text-indigo-500 transition-colors text-lg font-semibold">
            + New Card
          </Link>
        </div>

        {sortedTopics.map((topic) => (
          <TopicSection key={topic} topic={topic} cards={groupedCards[topic]} onDeleteCard={handleDeleteCard} currentUserId={currentUserId} />
        ))}
      </section>

      {/* Notification Component */}
      <StackedNotification isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} message={notifMessage} />
    </main>
  );
}

const TopicSection = ({ topic, cards, onDeleteCard, currentUserId }: { topic: string; cards: FlashCardType[]; onDeleteCard: (cardId: string) => void; currentUserId: string | null }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCards = cards.filter((card) => {
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase();
    const frontMatch = card.frontText?.toLowerCase().includes(query);
    const backMatch = card.backText?.toLowerCase().includes(query);
    return frontMatch || backMatch;
  });

  const formatTopic = (topic: string) => {
    let formattedTopic = topic.replace("-", " ");

    formattedTopic = formattedTopic.charAt(0).toUpperCase() + formattedTopic.slice(1);

    return formattedTopic;
  };

  return (
    <div className="mb-12">
      <div className="mb-4 pb-2 border-b-2 border-zinc-700">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="text-2xl font-semibold text-zinc-300">{formatTopic(topic)}</h3>
            <p className="text-sm text-zinc-500">
              {filteredCards.length} {filteredCards.length === 1 ? "card" : "cards"}
            </p>
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {filteredCards.map((card) => (
          <FlipCard key={card.id} card={card} onDeleteCard={onDeleteCard} currentUserId={currentUserId} />
        ))}
      </div>
    </div>
  );
};

const FlipCard = ({ card, onDeleteCard, currentUserId }: { card: FlashCardType; onDeleteCard: (cardId: string) => void; currentUserId: string | null }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = currentUserId === card.user_id;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDeleteCard(card.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="flex-shrink-0 w-80 h-96 cursor-pointer relative" onClick={handleCardClick}>
        <motion.div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
          <div
            className="absolute inset-0 w-full h-full rounded-lg border border-zinc-700 bg-zinc-900 hover:border-indigo-500 transition-colors overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {isOwner && (
              <div className="absolute top-2 left-2 right-2 flex justify-between z-10" style={{ pointerEvents: isFlipped ? "none" : "auto" }}>
                <button onClick={handleDeleteClick} className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors cursor-pointer" title="Delete card">
                  <FiX className="text-white" />
                </button>
                <Link href={`/cms/flash-cards/${card.id}`} className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors" title="Edit card">
                  <FiEdit2 className="text-white" />
                </Link>
              </div>
            )}

            {card.frontImage ? (
              <div className="flex flex-col h-full pt-12">
                <div className="flex-shrink-0 h-48 relative">
                  <Image src={card.frontImage} alt="Front of card" fill={true} className="object-contain p-4" />
                </div>
                {card.frontText && (
                  <div className="flex-1 overflow-y-auto p-4 bg-zinc-800 border-t border-zinc-700">
                    <p className="text-sm whitespace-pre-wrap">{card.frontText}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full pt-12 p-6 overflow-y-auto flex items-center justify-center">{card.frontText && <p className="text-lg text-center whitespace-pre-wrap">{card.frontText}</p>}</div>
            )}

            <div className="absolute bottom-2 left-2">
              <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-1 rounded">ID: {card.id}</span>
            </div>
          </div>

          <div
            className="absolute inset-0 w-full h-full rounded-lg border border-zinc-700 bg-zinc-700 hover:border-indigo-500 transition-colors overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {card.backImage ? (
              <div className="flex flex-col h-full pt-12">
                <div className="flex-shrink-0 h-48 relative">
                  <Image src={card.backImage} alt="Back of card" fill={true} className="object-contain p-4" />
                </div>
                {card.backText && (
                  <div className="flex-1 overflow-y-auto p-4 bg-zinc-600 border-t border-zinc-500">
                    <p className="text-sm text-white whitespace-pre-wrap">{card.backText}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full pt-12 p-6 overflow-y-auto flex items-center justify-center">
                {card.backText && <p className="text-lg text-center text-white whitespace-pre-wrap">{card.backText}</p>}
              </div>
            )}

            <div className="absolute bottom-2 left-2">
              <span className="text-xs font-mono text-zinc-300 bg-zinc-600 px-2 py-1 rounded">ID: {card.id}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={cancelDelete}>
          <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Delete Card?</h3>
            <p className="text-zinc-400 mb-6">Are you sure you want to delete this card? This action cannot be undone.</p>
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
    </>
  );
};
