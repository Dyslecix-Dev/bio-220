"use client";

import Navbar from "@/app/_components/Navbar";
import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";
import SquishyCard from "@/app/_components/_cards/SquishyCard";

export default function LectureExamHome() {
  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950">
      <Navbar />
      <Exams />
      <GlowingDotsBackground />
    </main>
  );
}

const Exams = () => {
  return (
    <section className="relative z-20 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 py-24 md:px-8 md:py-36">
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <SquishyCard title="Lecture 2" link="lecture/two" className="bg-orange-500" />
        <SquishyCard title="Lecture 3" link="lecture/three" className="bg-yellow-500" />
      </div>
    </section>
  );
};

