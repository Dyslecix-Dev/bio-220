"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import { motion } from "motion/react";

import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";

type ListOrderItem = "front" | "middle" | "back";

export default function ExamIntro({ examNumber, examLink, examType = "lecture" }: { examNumber: number; examLink: string; examType?: string }) {
  const [order, setOrder] = useState<ListOrderItem[]>(["front", "middle", "back"]);

  const handleShuffle = () => {
    const orderCopy = [...order];
    orderCopy.unshift(orderCopy.pop() as ListOrderItem);
    setOrder(orderCopy);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-100 relative">
      <GlowingDotsBackground />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-8 relative z-10">
        <div>
          <h3 className="text-5xl font-black leading-[1.25] md:text-7xl">
            BIO 220
            <br />
            {examType === "lab" ? "Lab" : "Lecture"} Exam {examNumber}
          </h3>
          <p className="mb-8 mt-4 text-lg text-slate-400">This is a timed test with 30 randomly generated questions (select all that apply). You have 60 minutes to complete it.</p>
          <Link
            href={`/exams/${examType}/${examLink}/questions`}
            className="bg-indigo-500 text-white font-medium py-2 px-4 rounded transition-all hover:bg-indigo-600 active:scale-95 duration-300 cursor-pointer inline-block"
          >
            Start Test
          </Link>
        </div>
        <div className="relative h-[450px] w-[350px]">
          <Card
            imgUrl="https://images.unsplash.com/photo-1707079918151-d5931af83f06?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=801g"
            imgAlt="Red and green microbes"
            handleShuffle={handleShuffle}
            position={order[0]}
          />
          <Card
            imgUrl="https://images.unsplash.com/photo-1707386821166-4221717fcf8a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=798"
            imgAlt="Pink and teal microbes"
            handleShuffle={handleShuffle}
            position={order[1]}
          />
          <Card
            imgUrl="https://images.unsplash.com/photo-1707079917487-bffb9b5cf56d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=780"
            imgAlt="Yellow and blue microbes"
            handleShuffle={handleShuffle}
            position={order[2]}
          />
        </div>
      </div>
    </main>
  );
}

interface CardProps {
  handleShuffle: () => void;
  position: ListOrderItem;
  imgUrl: string;
  imgAlt: string;
}

const Card = ({ handleShuffle, position, imgUrl, imgAlt }: CardProps) => {
  const mousePosRef = useRef(0);

  const onDragStart = (e: MouseEvent) => {
    mousePosRef.current = e.clientX;
  };

  const onDragEnd = (e: MouseEvent) => {
    const diff = mousePosRef.current - e.clientX;

    if (diff > 150) {
      handleShuffle();
    }

    mousePosRef.current = 0;
  };

  const x = position === "front" ? "0%" : position === "middle" ? "33%" : "66%";
  const rotateZ = position === "front" ? "-6deg" : position === "middle" ? "0deg" : "6deg";
  const zIndex = position === "front" ? "2" : position === "middle" ? "1" : "0";

  const draggable = position === "front";

  return (
    <motion.div
      style={{
        zIndex,
      }}
      animate={{ rotate: rotateZ, x }}
      drag
      dragElastic={0.35}
      dragListener={draggable}
      dragConstraints={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      transition={{
        duration: 0.35,
      }}
      className={`absolute left-0 top-0 flex h-full w-full select-none items-center justify-center rounded-2xl border-2 border-slate-700 bg-slate-800/20 p-1 shadow-xl backdrop-blur-md ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="relative h-[98%] w-[98%] overflow-hidden rounded-xl">
        <Image src={imgUrl} alt={imgAlt} fill className="pointer-events-none object-cover" />
      </div>
    </motion.div>
  );
};
