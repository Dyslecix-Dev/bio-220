"use client";

import Navbar from "@/app/_components/Navbar";
import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";
import SquishyCard from "@/app/_components/_cards/SquishyCard";

export default function ExamHome() {
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
        <SquishyCard title="Lecture 2" subtitle="Second mock lecture test." link="exams/lecture-two" className="bg-rose-500 hidden xl:block" />

        <SquishyCard title="Lecture 3" subtitle="Third mock lecture test." link="exams/lecture-three" className="bg-orange-500 hidden xl:block" />

        <SquishyCard title="Lab 3" subtitle="Third mock lab practical." link="exams/lab-three" className="bg-violet-500 hidden xl:block" />

        <SquishyCard title="Lab 4" subtitle="Fourth mock lab practical." link="exams/lab-four" className="bg-sky-500 hidden xl:block" />

        <SquishyCard title="Lab 5" subtitle="Fifth mock lab practical." link="exams/lab-five" className="bg-green-500 hidden xl:block" />
      </div>
    </section>
  );
};
