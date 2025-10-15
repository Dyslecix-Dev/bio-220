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
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <SquishyCard
          title="Lab 3"
          // subtitle="The respiratory system."
          link="lab/three"
          className="bg-purple-500"
        />
      </div>
    </section>
  );
};
