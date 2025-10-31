"use client";

import Navbar from "@/app/_components/Navbar";
import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";
import SquishyCard from "@/app/_components/_cards/SquishyCard";

export default function LectureFlashCardHome() {
  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950">
      <Navbar />
      <FlashCards />
      <GlowingDotsBackground />
    </main>
  );
}

const FlashCards = () => {
  return (
    <section className="relative z-20 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 py-24 md:px-8 md:py-36">
      <h2 className="w-full mb-10 text-5xl font-semibold border-b-2 border-slate-100">Lecture 2</h2>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <SquishyCard title="Chapter 6" subtitle="Microbial nutrition & growth" link="lecture/six" className="bg-violet-900" />
        <SquishyCard title="Chapter 7" subtitle="Microbial metabolism" link="lecture/seven" className="bg-indigo-900" />
        <SquishyCard title="Chapter 9" subtitle="Physical & chemical control of microbes" link="lecture/nine" className="bg-indigo-600" />
        <SquishyCard title="Chapter 10" subtitle="Antimicrobial treatment" link="lecture/ten" className="bg-violet-600" />
      </div>

      <h2 className="w-full mt-40 mb-10 text-5xl text-end font-semibold border-b-2 border-slate-100">Lecture 3</h2>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <SquishyCard title="Chapter 8" subtitle="Bacterial genetics" link="lecture/eight" className="bg-violet-900" />
        <SquishyCard title="Chapter 5" subtitle="Viral genetics" link="lecture/five" className="bg-indigo-900" />
        <SquishyCard title="Chapter 11" subtitle="Pathogenesis" link="lecture/eleven" className="bg-indigo-600" />
        <SquishyCard title="Chapter 12" subtitle="Host defenses" link="lecture/twelve" className="bg-violet-600" />
        <SquishyCard title="Chapter 13" subtitle="Host defenses and vaccines" link="lecture/thirteen" className="bg-violet-900" />
      </div>
    </section>
  );
};
