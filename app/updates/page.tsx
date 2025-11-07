"use client";

import { useState } from "react";

import { motion } from "motion/react";
import { FiChevronDown } from "react-icons/fi";
import useMeasure from "react-use-measure";

import Navbar from "@/app/_components/Navbar";
import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";

import { FAQuestionType } from "@/types/types";

export default function Updates() {
  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950">
      <Navbar />
      <BasicFAQ />
      <GlowingDotsBackground />
    </main>
  );
}

const BasicFAQ = () => {
  return (
    <div className="relative z-20 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 py-24 md:px-8 md:py-36">
      <div className="p-5 mx-auto max-w-3xl bg-slate-800 rounded-xl">
        <h3 className="mb-4 text-center text-3xl font-semibold text-white">Website updates</h3>
        <Question title="November 5th, 2025" defaultOpen>
          <h4>New Features</h4>
          <ul>
            <li>Added flash cards and exams to navbar for better navigation.</li>
          </ul>

          <h4 className="mt-10">Minor Changes</h4>
          <ul>
            <li>Removed Kanban option from mobile devices (currently not accessible on mobile).</li>
            <li>Made flash cards while reviewing slightly smaller.</li>
            <li>Extended the loading animation between flash cards.</li>
            <li>Fixed &quot;Cancel&quot; and &quot;Report&quot; buttons overlapping on mobile.</li>
            <li>Added loading icon while grades are being reset for flash cards.</li>
          </ul>

          <h4 className="mt-10">Bug Fixes</h4>
          <ul>
            <li>Fixed how resetting grades for flash cards, reset all flash cards everywhere. Now it only resets the flash cards in the current chapter or week.</li>
          </ul>
        </Question>

        <Question title="November 4th, 2025">
          <p>Added the &quot;Updates&quot; page. Also added the ability for users to report flash cards and exam questions with misinformation.</p>
        </Question>

        <Question title="November 2nd, 2025">
          <p>First official release of the website! Features include flash cards, mock exams, kanban board, and admins adding flash cards and mock exams.</p>
        </Question>
      </div>
    </div>
  );
};

const Question = ({ title, children, defaultOpen = false }: FAQuestionType) => {
  const [ref, { height }] = useMeasure();
  const [open, setOpen] = useState<boolean>(defaultOpen);

  return (
    <motion.div animate={open ? "open" : "closed"} className="border-b-[1px] border-b-slate-300">
      <button onClick={() => setOpen((pv) => !pv)} className="flex w-full items-center justify-between gap-4 py-6 cursor-pointer">
        <motion.span
          variants={{
            open: {
              color: "rgba(3, 6, 23, 0)",
            },
            closed: {
              color: "rgba(256, 256, 256)",
            },
          }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-left text-lg font-medium"
        >
          {title}
        </motion.span>
        <motion.span
          variants={{
            open: {
              rotate: "180deg",
              color: "rgb(124 58 237)",
            },
            closed: {
              rotate: "0deg",
              color: "#fff",
            },
          }}
        >
          <FiChevronDown className="text-2xl" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: open ? height : "0px",
          marginBottom: open ? "24px" : "0px",
        }}
        className="overflow-hidden text-slate-400"
      >
        <div ref={ref}>{children}</div>
      </motion.div>
    </motion.div>
  );
};
