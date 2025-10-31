"use client";

import { useState, useEffect } from "react";

import { motion } from "motion/react";
import { FiPlus, FiTrash } from "react-icons/fi";
import { FaFire } from "react-icons/fa";

import { createClient } from "@/utils/supabase/client";

import Navbar from "@/app/_components/Navbar";
import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";
import ShuffleLoader from "@/app/_components/ShuffleLoader";

import { AddKanbanCardPropsType, BurnBarrelType, DropIndicatorType, KanbanCardPropsType, KanbanCardType, KanbanColumnPropsType } from "@/types/types";

export default function Kanban() {
  return (
    <>
      <main className="min-h-screen overflow-hidden bg-zinc-950 hidden xl:block">
        <Navbar />
        <Board />
        <GlowingDotsBackground />
      </main>

      <main className="min-h-screen overflow-hidden bg-zinc-950 xl:hidden">
        <Navbar />
        <section className="relative z-20 flex justify-center items-start min-h-screen w-full gap-3 px-12 py-24">
          <h1 className="flex text-center text-2xl font-semibold text-neutral-300">Sorry, but this feature can only be accessed on a desktop.</h1>
        </section>
        <GlowingDotsBackground />
      </main>
    </>
  );
}

const Board = () => {
  const [cards, setCards] = useState<KanbanCardType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCards = async () => {
      try {
        setLoading(true);
        const supabase = await createClient();

        // Get current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase.from("kanban_tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: true });

        if (error) throw error;

        const transformedCards: KanbanCardType[] = data.map((task) => ({
          id: task.id,
          text: task.text,
          column: task.column,
        }));

        setCards(transformedCards);
      } catch (err) {
        console.error("Load cards error:", err);
        setError(err instanceof Error ? err.message : "Failed to load cards");
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  const addCard = async (newCard: Omit<KanbanCardType, "id">) => {
    try {
      const supabase = await createClient();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("kanban_tasks")
        .insert([
          {
            text: newCard.text,
            column: newCard.column,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const cardWithId: KanbanCardType = {
        id: data.id,
        text: data.text,
        column: data.column,
      };

      setCards((prev) => [...prev, cardWithId]);
    } catch (err) {
      console.error("Add card error:", err);
      setError(err instanceof Error ? err.message : "Failed to add card");
    }
  };

  const updateCard = async (cardId: string, updates: Partial<KanbanCardType>) => {
    try {
      const supabase = await createClient();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("User not authenticated");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbUpdates: any = {};
      if (updates.text !== undefined) dbUpdates.text = updates.text;
      if (updates.column !== undefined) dbUpdates.column = updates.column;

      const { error } = await supabase.from("kanban_tasks").update(dbUpdates).eq("id", cardId).eq("user_id", user.id);

      if (error) throw error;

      setCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, ...updates } : card)));
    } catch (err) {
      console.error("Update card error:", err);
      setError(err instanceof Error ? err.message : "Failed to update card");
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      const supabase = await createClient();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("kanban_tasks").delete().eq("id", cardId).eq("user_id", user.id);

      if (error) throw error;

      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (err) {
      console.error("Delete card error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete card");
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen overflow-hidden bg-zinc-950 flex items-center justify-center">
        <ShuffleLoader />
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative z-20 flex justify-center items-center min-h-screen w-full px-12">
        <div className="text-red-500">Error: {error}</div>
      </section>
    );
  }

  return (
    <section className="relative z-20 flex justify-center items-start min-h-screen w-full gap-3 px-12 py-40">
      <div className="flex gap-3">
        <Column text="To-Do" column="To-Do" headingColor="text-red-300" cards={cards} setCards={setCards} updateCard={updateCard} />
        <Column text="In Progress" column="In Progress" headingColor="text-blue-200" cards={cards} setCards={setCards} updateCard={updateCard} />
        <Column text="Complete" column="Complete" headingColor="text-emerald-200" cards={cards} setCards={setCards} updateCard={updateCard} />
        <BurnBarrel setCards={setCards} deleteCard={deleteCard} />
        <AddCard column="To-Do" addCard={addCard} />
      </div>
    </section>
  );
};

const Column = ({ text, headingColor, cards, column, setCards, updateCard }: KanbanColumnPropsType & { updateCard: (cardId: string, updates: Partial<KanbanCardType>) => void }) => {
  const [active, setActive] = useState<boolean>(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, card: KanbanCardType) => {
    e.dataTransfer.setData("cardId", card.id);
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");

    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const before = element.dataset.before || "-1";

    if (before !== cardId) {
      let copy = [...cards];

      const cardToTransfer = copy.find((c) => c.id === cardId);
      if (!cardToTransfer) return;

      const updatedCard = { ...cardToTransfer, column };

      copy = copy.filter((c) => c.id !== cardId);

      const moveToBack = before === "-1";

      if (moveToBack) {
        copy.push(updatedCard);
      } else {
        const insertAtIndex = copy.findIndex((el) => el.id === before);
        if (insertAtIndex === -1) return;

        copy.splice(insertAtIndex, 0, updatedCard);
      }

      setCards(copy);

      await updateCard(cardId, { column });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators();
    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e: React.DragEvent) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e: React.DragEvent, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET = 50;

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );

    return el;
  };

  const getIndicators = (): HTMLElement[] => {
    return Array.from(document.querySelectorAll(`[data-column="${column}"]`)) as HTMLElement[];
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredCards = cards.filter((c) => c.column === column);

  return (
    <div className="w-56 sm:w-64 shrink-0">
      <div className="mb-3 flex items-center gap-2">
        <h3 className={`font-medium ${headingColor}`}>{text}</h3>
        <span className="h-6 w-6 flex items-center justify-center rounded-full text-sm text-slate-800 bg-slate-200">{filteredCards.length}</span>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`h-full w-full transition-colors min-h-[200px] ${active ? "bg-neutral-800/50" : "bg-neutral-800/0"}`}
      >
        {filteredCards.map((c) => {
          return <Card key={c.id} {...c} handleDragStart={handleDragStart} />;
        })}
        <DropIndicator beforeId={null} column={column} />
      </div>
    </div>
  );
};

const Card = ({ text, id, column, handleDragStart }: KanbanCardPropsType) => {
  return (
    <>
      <DropIndicator beforeId={id} column={column} />
      <motion.div
        layout
        layoutId={id}
        draggable="true"
        onDragStart={(e) => {
          if ("dataTransfer" in e) {
            handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, { text, id, column });
          }
        }}
        className="cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 active:cursor-grabbing"
      >
        <p className="text-sm text-neutral-100">{text}</p>
      </motion.div>
    </>
  );
};

const DropIndicator = ({ beforeId, column }: DropIndicatorType) => {
  return <div data-before={beforeId || "-1"} data-column={column} className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0" />;
};

const BurnBarrel = ({ setCards, deleteCard }: BurnBarrelType & { deleteCard: (cardId: string) => void }) => {
  const [active, setActive] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");

    setCards((pv) => pv.filter((c) => c.id !== cardId));

    await deleteCard(cardId);

    setActive(false);
  };

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mt-10 grid h-56 w-56 shrink-0 place-content-center rounded border text-3xl ${
        active ? "border-red-800 bg-red-800/20 text-red-500" : "border-neutral-500 bg-neutral-500/20 text-neutral-500"
      }`}
    >
      {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
    </div>
  );
};

const AddCard = ({ column, addCard }: AddKanbanCardPropsType) => {
  const [text, setText] = useState<string>("");
  const [adding, setAdding] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim().length) return;

    const newCard = {
      column,
      text: text.trim(),
    };

    await addCard(newCard);

    setText("");
    setAdding(false);
  };

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new task..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-3 text-sm text-neutral-50 placeholder-violet-300 focus:outline-0"
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50 cursor-pointer">
              Close
            </button>
            <button type="submit" className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300 cursor-pointer">
              <span>Add</span>
              <FiPlus />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button layout onClick={() => setAdding(true)} className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50 cursor-pointer">
          <span>Add card</span>
          <FiPlus />
        </motion.button>
      )}
    </>
  );
};
