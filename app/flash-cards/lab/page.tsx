"use client";

import Navbar from "@/app/_components/Navbar";
import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";
import SquishyCard from "@/app/_components/_cards/SquishyCard";

export default function LabFlashCardHome() {
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
      <h2 className="w-full mb-10 text-5xl font-semibold border-b-2 border-slate-100">Lab 4</h2>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <SquishyCard title="Week 10" subtitle="Microbes in food and water" link="lab/ten" className="bg-sky-900" />
        <SquishyCard title="Week 11" subtitle="Microbes of the urinary tract, and Microbial flora of the mouth" link="lab/eleven" className="bg-green-900" />
        <SquishyCard title="Week 12" subtitle="Parasitology" link="lab/twelve" className="bg-green-600" />
      </div>

      <h2 className="w-full mb-10 text-5xl text-end font-semibold border-b-2 border-slate-100">Lab 5</h2>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <SquishyCard title="Week 13" subtitle="Lyzsozyme and tears, and Handling patient samples" link="lab/thirteen" className="bg-sky-900" />
        <SquishyCard title="Week 14" subtitle="White blood cells morphology serology (ELISA)" link="lab/fourteen" className="bg-green-900" />
      </div>
    </section>
  );
};
